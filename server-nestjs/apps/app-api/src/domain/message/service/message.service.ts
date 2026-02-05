import { Injectable, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MessageRepository } from '../repository/message.repository';
import { UploadService } from '../../upload/service/upload.service';
import { WebSocketService, SocketEvent } from '@app/external-infra/websocket';
import { SendMessageDto, GetMessagesDto, UpdateChatSettingsDto, GetChatSettingsDto } from '../dto';
import { MessageType } from '@app/enum';
import { User, ChatEvent, ChatEventType } from '@app/entity';
import { GroqService } from '@app/external-infra/groq';

@Injectable()
export class MessageService {
  constructor(
    private readonly messageRepository: MessageRepository,
    private readonly uploadService: UploadService,
    private readonly webSocketService: WebSocketService,
    private readonly groqService: GroqService,
    @InjectRepository(ChatEvent)
    private readonly chatEventRepository: Repository<ChatEvent>,
  ) {}

  async sendMessage(
    userId: string,
    dto: SendMessageDto,
    imageFile?: Express.Multer.File,
    audioFile?: Express.Multer.File,
  ) {
    if (!dto.text && !imageFile && !audioFile) {
      throw new BadRequestException('Message must have text, image, or audio');
    }

    let mediaUrl: string | undefined;
    let messageType = dto.messageType || MessageType.TEXT;
    let transcription: string | undefined;

    // Upload image if provided
    if (imageFile) {
      const result = await this.uploadService.uploadMessageImage(imageFile);
      mediaUrl = result.url;
      messageType = MessageType.IMAGE;
    }

    // Upload audio if provided
    if (audioFile) {
      const [uploadResult, transcriptionResult] = await Promise.all([
        this.uploadService.uploadMessageAudio(audioFile),
        this.groqService.transcribeAudio(audioFile),
      ]);
      mediaUrl = uploadResult.url;
      messageType = MessageType.AUDIO;
      transcription = transcriptionResult || undefined;
    }

    // Check if recipient exists
    const recipient = await this.messageRepository.findUserById(dto.toUserId);
    if (!recipient) {
      throw new BadRequestException('User not found');
    }

    // Guest message limit: guests can only send 3 messages to bot users
    const sender = await this.messageRepository.findUserById(userId);
    if (sender?.isGuest && recipient.isBot) {
      const messageCount = await this.messageRepository.countMessagesSentByUser(userId, dto.toUserId);
      if (messageCount >= 3) {
        throw new ForbiddenException(
          'Guest message limit reached. Please register to continue chatting.',
        );
      }
    }

    // Check if there's an existing accepted conversation
    const existingConversation = await this.messageRepository.hasAcceptedConversation(userId, dto.toUserId);

    // Determine if this is a message request
    let isMessageRequest = false;
    if (recipient.isPrivate && !existingConversation) {
      // Check if sender is following the recipient or is a connection
      const isFollowing = await this.messageRepository.isUserFollowing(userId, dto.toUserId);
      const isConnected = await this.messageRepository.areUsersConnected(userId, dto.toUserId);

      if (!isFollowing && !isConnected) {
        isMessageRequest = true;
      }
    }

    const message = await this.messageRepository.create({
      fromUser: { id: userId } as User,
      toUser: { id: dto.toUserId } as User,
      text: dto.text,
      mediaUrl,
      messageType,
      transcription,
      seen: false,
      isMessageRequest,
      isRequestAccepted: !isMessageRequest,
      encrypted: dto.encrypted === 'true',
      encryptionIv: dto.iv || undefined,
    });

    // Get full message with relations
    const fullMessage = await this.messageRepository.findById(message.id);

    // Send real-time notification via WebSocket
    // For message requests, send a different event
    if (isMessageRequest) {
      this.webSocketService.sendToUser(dto.toUserId, SocketEvent.MESSAGE_REQUEST, {
        message: this.formatMessageResponse(fullMessage),
      });
    } else {
      this.webSocketService.sendToUser(dto.toUserId, SocketEvent.NEW_MESSAGE, {
        message: this.formatMessageResponse(fullMessage),
      });
    }

    // If recipient is a bot, generate AI response
    if (recipient.isBot) {
      // Get recent conversation history for context
      const recentMessages = await this.messageRepository.getChatMessages(
        userId, dto.toUserId, 20, 0,
      );

      // Format messages for Groq API (reverse to chronological order)
      const chatHistory = [...recentMessages].reverse().map((m) => ({
        role: m.fromUserId === dto.toUserId ? 'assistant' as const : 'user' as const,
        content: m.text || '[media]',
      }));

      const systemPrompt = {
        role: 'system' as const,
        content: 'Ban la PingUp AI, tro ly than thien cua ung dung PingUp. Tra loi ngan gon, huu ich, bang tieng Viet hoac tieng Anh tuy theo ngon ngu cua nguoi dung.',
      };

      const aiResponse = await this.groqService.chatCompletion([systemPrompt, ...chatHistory]);

      if (aiResponse) {
        const botMessage = await this.messageRepository.create({
          fromUser: { id: dto.toUserId } as User,
          toUser: { id: userId } as User,
          text: aiResponse,
          messageType: MessageType.TEXT,
          seen: false,
          isMessageRequest: false,
          isRequestAccepted: true,
        });

        const fullBotMessage = await this.messageRepository.findById(botMessage.id);

        this.webSocketService.sendToUser(userId, SocketEvent.NEW_MESSAGE, {
          message: this.formatMessageResponse(fullBotMessage),
        });
      }
    }

    return {
      success: true,
      message: isMessageRequest ? 'Message request sent' : 'Message sent',
      data: {
        ...this.formatMessageResponse(fullMessage),
        isMessageRequest,
      },
    };
  }

  async getChatMessages(userId: string, dto: GetMessagesDto) {
    // Mark messages as seen
    await this.messageRepository.markMessagesAsSeen(dto.userId, userId);

    // Notify sender that their messages have been seen
    this.webSocketService.sendToUser(dto.userId, SocketEvent.MESSAGE_SEEN, {
      seenByUserId: userId,
      seenAt: new Date(),
    });

    const messages = await this.messageRepository.getChatMessages(
      userId,
      dto.userId,
      dto.limit,
      dto.offset,
    );

    return {
      success: true,
      data: messages.map((m) => this.formatMessageResponse(m)),
    };
  }

  async getRecentMessages(userId: string) {
    const unseenMessages = await this.messageRepository.getUnseenMessages(userId);

    return {
      success: true,
      data: {
        count: unseenMessages.length,
        messages: unseenMessages.map((m) => this.formatMessageResponse(m)),
      },
    };
  }

  async getRecentChats(userId: string) {
    const chats = await this.messageRepository.getRecentChatsExcludingRequests(userId);

    return {
      success: true,
      data: chats.map((chat) => ({
        user: {
          id: chat.user.id,
          fullName: chat.user.fullName,
          username: chat.user.username,
          profilePicture: chat.user.profilePicture,
        },
        lastMessage: chat.lastMessage
          ? this.formatMessageResponse(chat.lastMessage)
          : null,
        unseenCount: chat.unseenCount,
      })),
    };
  }

  async getMessageRequests(userId: string) {
    const requests = await this.messageRepository.getMessageRequests(userId);

    return {
      success: true,
      data: requests.map((req) => ({
        user: {
          id: req.user.id,
          fullName: req.user.fullName,
          username: req.user.username,
          profilePicture: req.user.profilePicture,
        },
        lastMessage: this.formatMessageResponse(req.lastMessage),
        messageCount: req.messageCount,
      })),
    };
  }

  async acceptMessageRequest(userId: string, fromUserId: string) {
    await this.messageRepository.acceptMessageRequest(userId, fromUserId);

    return {
      success: true,
      message: 'Message request accepted',
    };
  }

  async declineMessageRequest(userId: string, fromUserId: string) {
    await this.messageRepository.declineMessageRequest(userId, fromUserId);

    return {
      success: true,
      message: 'Message request declined',
    };
  }

  private formatMessageResponse(message: any) {
    return {
      id: message.id,
      text: message.isUnsent ? null : message.text,
      mediaUrl: message.isUnsent ? null : message.mediaUrl,
      messageType: message.messageType,
      transcription: message.isUnsent ? null : (message.transcription || null),
      seen: message.seen,
      seenAt: message.seenAt ? new Date(message.seenAt).toISOString() : null,
      encrypted: message.encrypted || false,
      encryptionIv: message.isUnsent ? null : (message.encryptionIv || null),
      isUnsent: message.isUnsent || false,
      unsentAt: message.unsentAt ? new Date(message.unsentAt).toISOString() : null,
      fromUser: {
        id: message.fromUser.id,
        fullName: message.fromUser.fullName,
        username: message.fromUser.username,
        profilePicture: message.fromUser.profilePicture,
      },
      toUser: {
        id: message.toUser.id,
        fullName: message.toUser.fullName,
        username: message.toUser.username,
        profilePicture: message.toUser.profilePicture,
      },
      // Ensure createdAt is always in ISO format with UTC timezone
      createdAt: message.createdAt ? new Date(message.createdAt).toISOString() : null,
    };
  }

  // Chat Settings
  async getChatSettings(userId: string, dto: GetChatSettingsDto) {
    const settings = await this.messageRepository.getChatSettings(userId, dto.chatWithUserId);

    return {
      success: true,
      data: settings ? {
        nickname: settings.nickname,
        isMuted: settings.isMuted,
        isBlocked: settings.isBlocked,
        backgroundColor: settings.backgroundColor,
        backgroundImage: settings.backgroundImage,
        messageColor: settings.messageColor,
      } : null,
    };
  }

  async getOtherUserSettings(userId: string, dto: GetChatSettingsDto) {
    // Get what the other user has set for the current user
    const settings = await this.messageRepository.getChatSettings(dto.chatWithUserId, userId);

    return {
      success: true,
      data: settings ? {
        nickname: settings.nickname,
      } : null,
    };
  }

  async updateChatSettings(userId: string, dto: UpdateChatSettingsDto) {
    // Get current settings to check what changed
    const currentSettings = await this.messageRepository.getChatSettings(userId, dto.chatWithUserId);

    // Update settings for current user
    const settings = await this.messageRepository.upsertChatSettings(
      userId,
      dto.chatWithUserId,
      {
        nickname: dto.nickname,
        isMuted: dto.isMuted,
        isBlocked: dto.isBlocked,
        backgroundColor: dto.backgroundColor,
        backgroundImage: dto.backgroundImage,
        messageColor: dto.messageColor,
      },
    );

    // If background changed, also update for the other user (shared background)
    if (dto.backgroundColor !== undefined || dto.backgroundImage !== undefined) {
      await this.messageRepository.upsertChatSettings(
        dto.chatWithUserId,
        userId,
        {
          backgroundColor: dto.backgroundColor,
          backgroundImage: dto.backgroundImage,
        },
      );
    }

    // If message color changed, also update for the other user (shared)
    if (dto.messageColor !== undefined) {
      await this.messageRepository.upsertChatSettings(
        dto.chatWithUserId,
        userId,
        {
          messageColor: dto.messageColor,
        },
      );
    }

    // Create chat events for changes
    if (dto.nickname !== undefined && dto.nickname !== currentSettings?.nickname) {
      const event = await this.createChatEvent(userId, dto.chatWithUserId, ChatEventType.NICKNAME_CHANGED, dto.nickname);
      this.sendChatEventNotification(userId, dto.chatWithUserId, event);
    }
    if ((dto.backgroundColor !== undefined || dto.backgroundImage !== undefined) &&
        (dto.backgroundColor !== currentSettings?.backgroundColor || dto.backgroundImage !== currentSettings?.backgroundImage)) {
      const event = await this.createChatEvent(userId, dto.chatWithUserId, ChatEventType.BACKGROUND_CHANGED, dto.backgroundImage || dto.backgroundColor);
      this.sendChatEventNotification(userId, dto.chatWithUserId, event);
    }
    if (dto.messageColor !== undefined && dto.messageColor !== currentSettings?.messageColor) {
      const event = await this.createChatEvent(userId, dto.chatWithUserId, ChatEventType.MESSAGE_COLOR_CHANGED, dto.messageColor);
      this.sendChatEventNotification(userId, dto.chatWithUserId, event);
    }

    // Send real-time settings update to both users
    const settingsData = {
      nickname: settings.nickname,
      isMuted: settings.isMuted,
      isBlocked: settings.isBlocked,
      backgroundColor: settings.backgroundColor,
      backgroundImage: settings.backgroundImage,
      messageColor: settings.messageColor,
    };

    // Notify both users about shared settings (background, messageColor)
    if (dto.backgroundColor !== undefined || dto.backgroundImage !== undefined || dto.messageColor !== undefined) {
      this.webSocketService.sendToUser(dto.chatWithUserId, SocketEvent.CHAT_SETTINGS_UPDATED, {
        chatWithUserId: userId,
        settings: {
          backgroundColor: settings.backgroundColor,
          backgroundImage: settings.backgroundImage,
          messageColor: settings.messageColor,
        },
      });
    }

    return {
      success: true,
      message: 'Chat settings updated',
      data: settingsData,
    };
  }

  private async createChatEvent(userId: string, chatWithUserId: string, eventType: ChatEventType, eventData?: string) {
    const event = this.chatEventRepository.create({
      userId,
      chatWithUserId,
      eventType,
      eventData: eventData || undefined,
    });
    await this.chatEventRepository.save(event);
    return event;
  }

  private async sendChatEventNotification(userId: string, chatWithUserId: string, event: ChatEvent) {
    // Get user info for the event
    const user = await this.messageRepository.findUserById(userId);

    const eventData = {
      id: event.id,
      eventType: event.eventType,
      eventData: event.eventData,
      userId: event.userId,
      user: user ? {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
      } : null,
      createdAt: event.createdAt,
    };

    // Send to both users so they both see the event in real-time
    this.webSocketService.sendToUser(userId, SocketEvent.CHAT_EVENT_CREATED, {
      chatWithUserId,
      event: eventData,
    });
    this.webSocketService.sendToUser(chatWithUserId, SocketEvent.CHAT_EVENT_CREATED, {
      chatWithUserId: userId,
      event: eventData,
    });
  }

  async getChatEvents(userId: string, chatWithUserId: string) {
    const events = await this.chatEventRepository.find({
      where: [
        { userId, chatWithUserId },
        { userId: chatWithUserId, chatWithUserId: userId },
      ],
      relations: ['user'],
      order: { createdAt: 'ASC' },
    });

    return {
      success: true,
      data: events.map(event => ({
        id: event.id,
        eventType: event.eventType,
        eventData: event.eventData,
        userId: event.userId,
        user: {
          id: event.user.id,
          fullName: event.user.fullName,
          username: event.user.username,
        },
        createdAt: event.createdAt,
      })),
    };
  }

  async uploadChatBackground(userId: string, chatWithUserId: string, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    const result = await this.uploadService.uploadMessageImage(file);

    // Update for current user
    const settings = await this.messageRepository.upsertChatSettings(
      userId,
      chatWithUserId,
      {
        backgroundImage: result.url,
      },
    );

    // Also update for the other user (shared background)
    await this.messageRepository.upsertChatSettings(
      chatWithUserId,
      userId,
      {
        backgroundImage: result.url,
      },
    );

    // Create chat event and send notification
    const event = await this.createChatEvent(userId, chatWithUserId, ChatEventType.BACKGROUND_CHANGED, result.url);
    this.sendChatEventNotification(userId, chatWithUserId, event);

    // Send real-time settings update to other user
    this.webSocketService.sendToUser(chatWithUserId, SocketEvent.CHAT_SETTINGS_UPDATED, {
      chatWithUserId: userId,
      settings: {
        backgroundColor: settings.backgroundColor,
        backgroundImage: settings.backgroundImage,
        messageColor: settings.messageColor,
      },
    });

    return {
      success: true,
      message: 'Background image uploaded',
      data: {
        nickname: settings.nickname,
        isMuted: settings.isMuted,
        isBlocked: settings.isBlocked,
        backgroundColor: settings.backgroundColor,
        backgroundImage: settings.backgroundImage,
        messageColor: settings.messageColor,
      },
    };
  }

  async setPartnerNickname(userId: string, chatWithUserId: string, nickname: string | null) {
    // This sets the nickname that the partner uses for the current user
    // i.e., what chatWithUserId calls userId
    const settings = await this.messageRepository.upsertChatSettings(
      chatWithUserId,
      userId,
      {
        nickname: nickname || undefined,
      },
    );

    // Create chat event - userId set their own nickname (as seen by chatWithUserId)
    await this.createChatEvent(userId, chatWithUserId, ChatEventType.NICKNAME_CHANGED, nickname || '');

    return {
      success: true,
      message: 'Partner nickname updated',
      data: {
        nickname: settings.nickname,
        isMuted: settings.isMuted,
        isBlocked: settings.isBlocked,
        backgroundColor: settings.backgroundColor,
        backgroundImage: settings.backgroundImage,
        messageColor: settings.messageColor,
      },
    };
  }

  async markMessagesSeen(userId: string, fromUserId: string) {
    // Mark messages from fromUserId to userId as seen
    await this.messageRepository.markMessagesAsSeen(fromUserId, userId);

    // Notify sender that their messages have been seen
    this.webSocketService.sendToUser(fromUserId, SocketEvent.MESSAGE_SEEN, {
      seenByUserId: userId,
      seenAt: new Date(),
    });

    return {
      success: true,
      message: 'Messages marked as seen',
    };
  }

  async deleteChat(userId: string, chatWithUserId: string) {
    // Set deletedAt timestamp for this user's view of the conversation
    await this.messageRepository.upsertChatSettings(userId, chatWithUserId, {
      deletedAt: new Date(),
    });

    return {
      success: true,
      message: 'Chat deleted',
    };
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new BadRequestException('Message not found');
    }

    // Verify user is part of this conversation
    if (message.fromUser.id !== userId && message.toUser.id !== userId) {
      throw new ForbiddenException('You cannot delete this message');
    }

    await this.messageRepository.deleteMessageForUser(messageId, userId);

    return {
      success: true,
      message: 'Message deleted',
    };
  }

  async unsendMessage(userId: string, messageId: string) {
    const message = await this.messageRepository.findById(messageId);
    if (!message) {
      throw new BadRequestException('Message not found');
    }

    // Only the sender can unsend
    if (message.fromUser.id !== userId) {
      throw new ForbiddenException('Only the sender can unsend a message');
    }

    // Already unsent
    if (message.isUnsent) {
      throw new BadRequestException('Message already unsent');
    }

    // 24-hour limit
    const hoursSinceSent = (Date.now() - new Date(message.createdAt).getTime()) / (1000 * 60 * 60);
    if (hoursSinceSent > 24) {
      throw new BadRequestException('Cannot unsend messages older than 24 hours');
    }

    const updatedMessage = await this.messageRepository.unsendMessage(messageId);

    // Notify the other user via WebSocket
    const recipientId = message.toUser.id;
    this.webSocketService.sendToUser(recipientId, SocketEvent.MESSAGE_UNSENT, {
      messageId,
      unsentByUserId: userId,
      unsentAt: updatedMessage.unsentAt,
    });

    return {
      success: true,
      message: 'Message unsent',
      data: this.formatMessageResponse(updatedMessage),
    };
  }
}

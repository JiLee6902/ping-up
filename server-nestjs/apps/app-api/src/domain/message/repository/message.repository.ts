import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm';
import { Message, User, ChatSettings, Connection, MessageDeletion } from '@app/entity';
import { ConnectionStatus } from '@app/enum';

@Injectable()
export class MessageRepository {
  constructor(
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(ChatSettings)
    private readonly chatSettingsRepository: Repository<ChatSettings>,
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
    @InjectRepository(MessageDeletion)
    private readonly messageDeletionRepository: Repository<MessageDeletion>,
  ) {}

  async create(messageData: Partial<Message>): Promise<Message> {
    const message = this.messageRepository.create(messageData);
    return this.messageRepository.save(message);
  }

  async findById(id: string): Promise<Message | null> {
    return this.messageRepository.findOne({
      where: { id },
      relations: ['fromUser', 'toUser'],
    });
  }

  async getChatMessages(
    userId1: string,
    userId2: string,
    limit = 50,
    offset = 0,
  ): Promise<Message[]> {
    // Check if user1 has deleted this chat
    const settings = await this.chatSettingsRepository.findOne({
      where: { userId: userId1, chatWithUserId: userId2 },
    });

    const queryBuilder = this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.fromUser', 'fromUser')
      .leftJoinAndSelect('message.toUser', 'toUser')
      .leftJoin(
        'message_deletions', 'md',
        'md.message_id = message.id AND md.user_id = :currentUserId',
        { currentUserId: userId1 },
      )
      .where(
        '((message.fromUserId = :userId1 AND message.toUserId = :userId2) OR (message.fromUserId = :userId2 AND message.toUserId = :userId1))',
        { userId1, userId2 },
      )
      .andWhere('md.id IS NULL'); // Exclude messages deleted by current user

    // If chat was deleted, only show messages after deletedAt
    if (settings?.deletedAt) {
      queryBuilder.andWhere('message.createdAt > :deletedAt', {
        deletedAt: settings.deletedAt,
      });
    }

    return queryBuilder
      .orderBy('message.createdAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();
  }

  async markMessagesAsSeen(fromUserId: string, toUserId: string): Promise<void> {
    await this.messageRepository.update(
      {
        fromUser: { id: fromUserId },
        toUser: { id: toUserId },
        seen: false,
      },
      { seen: true, seenAt: new Date() },
    );
  }

  async getUnseenMessages(userId: string): Promise<Message[]> {
    return this.messageRepository.find({
      where: {
        toUser: { id: userId },
        seen: false,
      },
      relations: ['fromUser', 'toUser'],
      order: { createdAt: 'DESC' },
    });
  }

  async getRecentChats(userId: string): Promise<any[]> {
    // Get distinct users who have chatted with this user
    const sentMessages = await this.messageRepository
      .createQueryBuilder('message')
      .select('DISTINCT message.toUserId', 'userId')
      .where('message.fromUserId = :userId', { userId })
      .getRawMany();

    const receivedMessages = await this.messageRepository
      .createQueryBuilder('message')
      .select('DISTINCT message.fromUserId', 'userId')
      .where('message.toUserId = :userId', { userId })
      .getRawMany();

    const allUserIds = [
      ...new Set([
        ...sentMessages.map((m) => m.userId),
        ...receivedMessages.map((m) => m.userId),
      ]),
    ];

    if (allUserIds.length === 0) {
      return [];
    }

    // Get users with their last message
    const recentChats = await Promise.all(
      allUserIds.map(async (otherUserId) => {
        // Check if user has deleted this chat
        const settings = await this.chatSettingsRepository.findOne({
          where: { userId, chatWithUserId: otherUserId },
        });

        // Build query for last message
        const queryBuilder = this.messageRepository
          .createQueryBuilder('message')
          .leftJoinAndSelect('message.fromUser', 'fromUser')
          .leftJoinAndSelect('message.toUser', 'toUser')
          .where(
            '((message.fromUserId = :userId AND message.toUserId = :otherUserId) OR (message.fromUserId = :otherUserId AND message.toUserId = :userId))',
            { userId, otherUserId },
          );

        // If chat was deleted, only consider messages after deletedAt
        if (settings?.deletedAt) {
          queryBuilder.andWhere('message.createdAt > :deletedAt', {
            deletedAt: settings.deletedAt,
          });
        }

        const lastMessage = await queryBuilder
          .orderBy('message.createdAt', 'DESC')
          .getOne();

        // If no messages after deletion, skip this chat
        if (!lastMessage) {
          return null;
        }

        // Count unseen messages (also respecting deletedAt)
        let unseenQueryBuilder = this.messageRepository
          .createQueryBuilder('message')
          .where('message.fromUserId = :otherUserId', { otherUserId })
          .andWhere('message.toUserId = :userId', { userId })
          .andWhere('message.seen = false');

        if (settings?.deletedAt) {
          unseenQueryBuilder = unseenQueryBuilder.andWhere(
            'message.createdAt > :deletedAt',
            { deletedAt: settings.deletedAt },
          );
        }

        const unseenCount = await unseenQueryBuilder.getCount();

        const otherUser = await this.userRepository.findOne({
          where: { id: otherUserId },
        });

        return {
          user: otherUser,
          lastMessage,
          unseenCount,
        };
      }),
    );

    // Filter out null entries (deleted chats with no new messages)
    return recentChats
      .filter((chat) => chat !== null)
      .sort(
        (a, b) =>
          new Date(b.lastMessage?.createdAt || 0).getTime() -
          new Date(a.lastMessage?.createdAt || 0).getTime(),
      );
  }

  // Chat Settings methods
  async getChatSettings(userId: string, chatWithUserId: string): Promise<ChatSettings | null> {
    return this.chatSettingsRepository.findOne({
      where: { userId, chatWithUserId },
    });
  }

  async upsertChatSettings(
    userId: string,
    chatWithUserId: string,
    data: Partial<ChatSettings>,
  ): Promise<ChatSettings> {
    let settings = await this.chatSettingsRepository.findOne({
      where: { userId, chatWithUserId },
    });

    if (settings) {
      // Explicitly handle each field to allow setting to null
      if (data.nickname !== undefined) settings.nickname = data.nickname;
      if (data.isMuted !== undefined) settings.isMuted = data.isMuted;
      if (data.isBlocked !== undefined) settings.isBlocked = data.isBlocked;
      if (data.backgroundColor !== undefined) settings.backgroundColor = data.backgroundColor;
      if (data.backgroundImage !== undefined) settings.backgroundImage = data.backgroundImage;
      if (data.messageColor !== undefined) settings.messageColor = data.messageColor;
      if (data.deletedAt !== undefined) settings.deletedAt = data.deletedAt;
      return this.chatSettingsRepository.save(settings);
    }

    settings = this.chatSettingsRepository.create({
      userId,
      chatWithUserId,
      ...data,
    });
    return this.chatSettingsRepository.save(settings);
  }

  async countMessagesSentByUser(fromUserId: string, toUserId: string): Promise<number> {
    return this.messageRepository.count({
      where: {
        fromUser: { id: fromUserId },
        toUser: { id: toUserId },
      },
    });
  }

  async findUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id: userId },
      relations: ['followers'],
    });
  }

  // Check if user1 is following user2
  async isUserFollowing(userId: string, targetUserId: string): Promise<boolean> {
    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
      relations: ['followers'],
    });
    return targetUser?.followers?.some(f => f.id === userId) || false;
  }

  // Check if two users are connected (accepted connection)
  async areUsersConnected(userId1: string, userId2: string): Promise<boolean> {
    const connection = await this.connectionRepository.findOne({
      where: [
        { fromUser: { id: userId1 }, toUser: { id: userId2 }, status: ConnectionStatus.ACCEPTED },
        { fromUser: { id: userId2 }, toUser: { id: userId1 }, status: ConnectionStatus.ACCEPTED },
      ],
    });
    return !!connection;
  }

  // Check if there's an existing accepted conversation between two users
  async hasAcceptedConversation(userId1: string, userId2: string): Promise<boolean> {
    // If any message between them is accepted, the conversation is accepted
    const acceptedMessage = await this.messageRepository.findOne({
      where: [
        { fromUser: { id: userId1 }, toUser: { id: userId2 }, isRequestAccepted: true },
        { fromUser: { id: userId2 }, toUser: { id: userId1 }, isRequestAccepted: true },
      ],
    });
    return !!acceptedMessage;
  }

  // Get message requests for a user
  async getMessageRequests(userId: string): Promise<any[]> {
    // Get distinct users who have sent message requests
    const requests = await this.messageRepository
      .createQueryBuilder('message')
      .leftJoinAndSelect('message.fromUser', 'fromUser')
      .where('message.toUserId = :userId', { userId })
      .andWhere('message.isMessageRequest = true')
      .andWhere('message.isRequestAccepted = false')
      .orderBy('message.createdAt', 'DESC')
      .getMany();

    // Group by sender and get the latest message from each
    const requestsByUser = new Map<string, any>();
    for (const req of requests) {
      if (!requestsByUser.has(req.fromUser.id)) {
        requestsByUser.set(req.fromUser.id, {
          user: req.fromUser,
          lastMessage: req,
          messageCount: 1,
        });
      } else {
        requestsByUser.get(req.fromUser.id).messageCount++;
      }
    }

    return Array.from(requestsByUser.values());
  }

  // Accept message request from a user
  async acceptMessageRequest(userId: string, fromUserId: string): Promise<void> {
    await this.messageRepository.update(
      {
        fromUser: { id: fromUserId },
        toUser: { id: userId },
        isMessageRequest: true,
        isRequestAccepted: false,
      },
      { isRequestAccepted: true },
    );
  }

  // Decline (delete) message request from a user
  async declineMessageRequest(userId: string, fromUserId: string): Promise<void> {
    await this.messageRepository.delete({
      fromUser: { id: fromUserId },
      toUser: { id: userId },
      isMessageRequest: true,
      isRequestAccepted: false,
    });
  }

  // Delete message for current user only (soft delete via junction table)
  async deleteMessageForUser(messageId: string, userId: string): Promise<void> {
    const deletion = this.messageDeletionRepository.create({
      messageId,
      userId,
    });
    await this.messageDeletionRepository.save(deletion);
  }

  // Unsend (recall) a message - sets global isUnsent flag
  async unsendMessage(messageId: string): Promise<Message | null> {
    await this.messageRepository.update(messageId, {
      isUnsent: true,
      unsentAt: new Date(),
    });
    return this.findById(messageId);
  }

  // Get recent chats excluding message requests (for recipient only)
  async getRecentChatsExcludingRequests(userId: string): Promise<any[]> {
    // Get distinct users who have chatted with this user
    // For SENT messages: show ALL (sender always sees their own messages)
    const sentMessages = await this.messageRepository
      .createQueryBuilder('message')
      .select('DISTINCT message.toUserId', 'otherUserId')
      .where('message.fromUserId = :userId', { userId })
      .getRawMany();

    // For RECEIVED messages: only show if NOT a pending request
    const receivedMessages = await this.messageRepository
      .createQueryBuilder('message')
      .select('DISTINCT message.fromUserId', 'otherUserId')
      .where('message.toUserId = :userId', { userId })
      .andWhere('(message.isMessageRequest = false OR message.isRequestAccepted = true)')
      .getRawMany();

    const allUserIds = [
      ...new Set([
        ...sentMessages.map((m) => m.otherUserId),
        ...receivedMessages.map((m) => m.otherUserId),
      ]),
    ].filter(Boolean);

    if (allUserIds.length === 0) {
      return [];
    }

    // Get users with their last message
    const recentChats = await Promise.all(
      allUserIds.map(async (otherUserId) => {
        // Check if user has deleted this chat
        const settings = await this.chatSettingsRepository.findOne({
          where: { userId, chatWithUserId: otherUserId },
        });

        // Build query for last message
        // Show: all sent messages by user + received messages that are not pending requests
        const queryBuilder = this.messageRepository
          .createQueryBuilder('message')
          .leftJoinAndSelect('message.fromUser', 'fromUser')
          .leftJoinAndSelect('message.toUser', 'toUser')
          .where(
            '((message.fromUserId = :userId AND message.toUserId = :otherUserId) OR ' +
            '(message.fromUserId = :otherUserId AND message.toUserId = :userId AND (message.isMessageRequest = false OR message.isRequestAccepted = true)))',
            { userId, otherUserId },
          );

        // If chat was deleted, only consider messages after deletedAt
        if (settings?.deletedAt) {
          queryBuilder.andWhere('message.createdAt > :deletedAt', {
            deletedAt: settings.deletedAt,
          });
        }

        const lastMessage = await queryBuilder
          .orderBy('message.createdAt', 'DESC')
          .getOne();

        // If no messages after deletion, skip this chat
        if (!lastMessage) {
          return null;
        }

        // Count unseen messages (also respecting deletedAt)
        let unseenQueryBuilder = this.messageRepository
          .createQueryBuilder('message')
          .where('message.fromUserId = :otherUserId', { otherUserId })
          .andWhere('message.toUserId = :userId', { userId })
          .andWhere('message.seen = false')
          .andWhere('(message.isMessageRequest = false OR message.isRequestAccepted = true)');

        if (settings?.deletedAt) {
          unseenQueryBuilder = unseenQueryBuilder.andWhere(
            'message.createdAt > :deletedAt',
            { deletedAt: settings.deletedAt },
          );
        }

        const unseenCount = await unseenQueryBuilder.getCount();

        const otherUser = await this.userRepository.findOne({
          where: { id: otherUserId },
        });

        return {
          user: otherUser,
          lastMessage,
          unseenCount,
        };
      }),
    );

    // Filter out null entries (deleted chats with no new messages)
    return recentChats
      .filter((chat) => chat !== null)
      .sort(
        (a, b) =>
          new Date(b.lastMessage?.createdAt || 0).getTime() -
          new Date(a.lastMessage?.createdAt || 0).getTime(),
      );
  }
}

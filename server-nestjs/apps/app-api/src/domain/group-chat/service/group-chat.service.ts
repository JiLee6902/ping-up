import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { GroupChatRepository } from '../repository/group-chat.repository';
import { UploadService } from '../../upload/service/upload.service';
import { WebSocketService, SocketEvent } from '@app/external-infra/websocket';
import {
  CreateGroupChatDto,
  UpdateGroupChatDto,
  AddMemberDto,
  RemoveMemberDto,
  SendGroupMessageDto,
  GetGroupMessagesDto,
  UpdateMemberSettingsDto,
  UpdateMemberRoleDto,
} from '../dto';
import { GroupRole, GroupMessageType } from '@app/entity';

@Injectable()
export class GroupChatService {
  constructor(
    private readonly groupChatRepository: GroupChatRepository,
    private readonly uploadService: UploadService,
    private readonly webSocketService: WebSocketService,
  ) {}

  async createGroupChat(userId: string, dto: CreateGroupChatDto, avatarFile?: Express.Multer.File) {
    let avatarUrl: string | undefined;

    if (avatarFile) {
      const result = await this.uploadService.uploadProfileImage(avatarFile);
      avatarUrl = result.url;
    }

    // Create the group
    const group = await this.groupChatRepository.createGroup({
      name: dto.name,
      description: dto.description,
      avatarUrl,
      creatorId: userId,
      memberCount: dto.memberIds.length + 1, // +1 for creator
      isActive: true,
    });

    // Add creator as admin
    await this.groupChatRepository.addMember(group.id, userId, GroupRole.ADMIN);

    // Add other members
    if (dto.memberIds.length > 0) {
      await this.groupChatRepository.addMembers(group.id, dto.memberIds);
    }

    // Create system message
    await this.groupChatRepository.createMessage({
      groupChatId: group.id,
      senderId: userId,
      content: 'created the group',
      messageType: GroupMessageType.SYSTEM,
    });

    // Fetch full group with members
    const fullGroup = await this.groupChatRepository.findGroupById(group.id);

    // Notify all members via WebSocket
    const allMemberIds = [userId, ...dto.memberIds];
    for (const memberId of allMemberIds) {
      this.webSocketService.sendToUser(memberId, SocketEvent.GROUP_CREATED, {
        group: this.formatGroupResponse(fullGroup),
      });
    }

    return {
      success: true,
      message: 'Group created successfully',
      data: this.formatGroupResponse(fullGroup),
    };
  }

  async updateGroupChat(userId: string, dto: UpdateGroupChatDto, avatarFile?: Express.Multer.File) {
    const group = await this.groupChatRepository.findGroupByIdSimple(dto.groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Only admins can update group
    const isAdmin = await this.groupChatRepository.isUserAdmin(dto.groupId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can update group settings');
    }

    const updateData: any = {};
    if (dto.name) updateData.name = dto.name;
    if (dto.description !== undefined) updateData.description = dto.description;

    if (avatarFile) {
      const result = await this.uploadService.uploadProfileImage(avatarFile);
      updateData.avatarUrl = result.url;
    }

    const updatedGroup = await this.groupChatRepository.updateGroup(dto.groupId, updateData);

    // Create system message for name change
    if (dto.name && dto.name !== group.name) {
      await this.groupChatRepository.createMessage({
        groupChatId: dto.groupId,
        senderId: userId,
        content: `changed the group name to "${dto.name}"`,
        messageType: GroupMessageType.SYSTEM,
      });
    }

    // Notify all members
    const members = await this.groupChatRepository.getGroupMembers(dto.groupId);
    for (const member of members) {
      this.webSocketService.sendToUser(member.userId, SocketEvent.GROUP_UPDATED, {
        group: this.formatGroupResponse(updatedGroup),
      });
    }

    return {
      success: true,
      message: 'Group updated successfully',
      data: this.formatGroupResponse(updatedGroup),
    };
  }

  async getGroup(userId: string, groupId: string) {
    const isMember = await this.groupChatRepository.isUserMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    const group = await this.groupChatRepository.findGroupById(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    return {
      success: true,
      data: this.formatGroupResponse(group),
    };
  }

  async getMyGroups(userId: string) {
    const groupsWithMessages = await this.groupChatRepository.getUserGroupsWithLastMessage(userId);

    return {
      success: true,
      data: groupsWithMessages.map(item => ({
        ...this.formatGroupResponse(item.group),
        lastMessage: item.lastMessage ? this.formatMessageResponse(item.lastMessage) : null,
        unreadCount: item.unreadCount,
        isMuted: item.isMuted,
        role: item.role,
      })),
    };
  }

  async addMembers(userId: string, dto: AddMemberDto) {
    const group = await this.groupChatRepository.findGroupByIdSimple(dto.groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const isAdmin = await this.groupChatRepository.isUserAdmin(dto.groupId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can add members');
    }

    // Filter out users who are already members
    const existingMembers = await Promise.all(
      dto.userIds.map(uid => this.groupChatRepository.isUserMember(dto.groupId, uid))
    );
    const newUserIds = dto.userIds.filter((_, i) => !existingMembers[i]);

    if (newUserIds.length === 0) {
      throw new BadRequestException('All users are already members');
    }

    // Add new members
    await this.groupChatRepository.addMembers(dto.groupId, newUserIds);
    await this.groupChatRepository.updateMemberCount(dto.groupId);

    // Get user names for system message
    const newUsers = await this.groupChatRepository.findUsersByIds(newUserIds);
    const userNames = newUsers.map(u => u.fullName || u.username).join(', ');

    // Create system message
    await this.groupChatRepository.createMessage({
      groupChatId: dto.groupId,
      senderId: userId,
      content: `added ${userNames} to the group`,
      messageType: GroupMessageType.SYSTEM,
    });

    const updatedGroup = await this.groupChatRepository.findGroupById(dto.groupId);

    // Notify all members including new ones
    const allMembers = await this.groupChatRepository.getGroupMembers(dto.groupId);
    for (const member of allMembers) {
      this.webSocketService.sendToUser(member.userId, SocketEvent.GROUP_MEMBER_ADDED, {
        groupId: dto.groupId,
        newMembers: newUsers.map(u => ({
          id: u.id,
          fullName: u.fullName,
          username: u.username,
          profilePicture: u.profilePicture,
        })),
        group: this.formatGroupResponse(updatedGroup),
      });
    }

    return {
      success: true,
      message: 'Members added successfully',
      data: this.formatGroupResponse(updatedGroup),
    };
  }

  async removeMember(userId: string, dto: RemoveMemberDto) {
    const group = await this.groupChatRepository.findGroupByIdSimple(dto.groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const isAdmin = await this.groupChatRepository.isUserAdmin(dto.groupId, userId);
    const isSelfLeave = dto.userId === userId;

    if (!isAdmin && !isSelfLeave) {
      throw new ForbiddenException('Only admins can remove members');
    }

    // Cannot remove creator unless they're leaving themselves
    if (dto.userId === group.creatorId && !isSelfLeave) {
      throw new ForbiddenException('Cannot remove the group creator');
    }

    // If admin is leaving, ensure there's another admin
    if (isSelfLeave && isAdmin) {
      const adminCount = await this.groupChatRepository.getAdminCount(dto.groupId);
      if (adminCount <= 1) {
        throw new BadRequestException('Please assign another admin before leaving');
      }
    }

    const removedUser = await this.groupChatRepository.findUserById(dto.userId);
    await this.groupChatRepository.removeMember(dto.groupId, dto.userId);
    await this.groupChatRepository.updateMemberCount(dto.groupId);

    // Create system message
    const actionWord = isSelfLeave ? 'left' : 'removed';
    const targetName = removedUser?.fullName || removedUser?.username || 'Someone';
    await this.groupChatRepository.createMessage({
      groupChatId: dto.groupId,
      senderId: userId,
      content: isSelfLeave ? 'left the group' : `removed ${targetName} from the group`,
      messageType: GroupMessageType.SYSTEM,
    });

    const updatedGroup = await this.groupChatRepository.findGroupById(dto.groupId);

    // Notify remaining members
    const members = await this.groupChatRepository.getGroupMembers(dto.groupId);
    for (const member of members) {
      this.webSocketService.sendToUser(member.userId, SocketEvent.GROUP_MEMBER_REMOVED, {
        groupId: dto.groupId,
        removedUserId: dto.userId,
        group: this.formatGroupResponse(updatedGroup),
      });
    }

    // Notify removed user
    this.webSocketService.sendToUser(dto.userId, SocketEvent.GROUP_MEMBER_REMOVED, {
      groupId: dto.groupId,
      removedUserId: dto.userId,
      wasRemoved: true,
    });

    return {
      success: true,
      message: isSelfLeave ? 'Left group successfully' : 'Member removed successfully',
    };
  }

  async updateMemberRole(userId: string, dto: UpdateMemberRoleDto) {
    const group = await this.groupChatRepository.findGroupByIdSimple(dto.groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    const isAdmin = await this.groupChatRepository.isUserAdmin(dto.groupId, userId);
    if (!isAdmin) {
      throw new ForbiddenException('Only admins can change member roles');
    }

    // Cannot change creator's role
    if (dto.userId === group.creatorId) {
      throw new ForbiddenException('Cannot change the creator\'s role');
    }

    await this.groupChatRepository.updateMember(dto.groupId, dto.userId, { role: dto.role });

    const targetUser = await this.groupChatRepository.findUserById(dto.userId);
    const targetName = targetUser?.fullName || targetUser?.username || 'Someone';

    // Create system message
    await this.groupChatRepository.createMessage({
      groupChatId: dto.groupId,
      senderId: userId,
      content: dto.role === GroupRole.ADMIN
        ? `made ${targetName} an admin`
        : `removed ${targetName} as admin`,
      messageType: GroupMessageType.SYSTEM,
    });

    // Notify all members
    const members = await this.groupChatRepository.getGroupMembers(dto.groupId);
    for (const member of members) {
      this.webSocketService.sendToUser(member.userId, SocketEvent.GROUP_MEMBER_ROLE_UPDATED, {
        groupId: dto.groupId,
        userId: dto.userId,
        role: dto.role,
      });
    }

    return {
      success: true,
      message: 'Member role updated successfully',
    };
  }

  async updateMemberSettings(userId: string, dto: UpdateMemberSettingsDto) {
    const isMember = await this.groupChatRepository.isUserMember(dto.groupId, userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    await this.groupChatRepository.updateMember(dto.groupId, userId, {
      isMuted: dto.isMuted,
    });

    return {
      success: true,
      message: 'Settings updated successfully',
    };
  }

  async sendMessage(userId: string, dto: SendGroupMessageDto, file?: Express.Multer.File) {
    const isMember = await this.groupChatRepository.isUserMember(dto.groupId, userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    if (!dto.content && !file) {
      throw new BadRequestException('Message must have content or image');
    }

    let mediaUrl: string | undefined;
    let messageType = dto.messageType || GroupMessageType.TEXT;

    if (file) {
      const result = await this.uploadService.uploadMessageImage(file);
      mediaUrl = result.url;
      messageType = GroupMessageType.IMAGE;
    }

    const message = await this.groupChatRepository.createMessage({
      groupChatId: dto.groupId,
      senderId: userId,
      content: dto.content,
      mediaUrl,
      messageType,
    });

    // Update sender's last read
    await this.groupChatRepository.updateLastReadAt(dto.groupId, userId);

    const fullMessage = await this.groupChatRepository.findMessageById(message.id);

    // Notify all members except sender
    const members = await this.groupChatRepository.getGroupMembers(dto.groupId);
    for (const member of members) {
      if (member.userId !== userId && !member.isMuted) {
        this.webSocketService.sendToUser(member.userId, SocketEvent.GROUP_MESSAGE, {
          groupId: dto.groupId,
          message: this.formatMessageResponse(fullMessage),
        });
      }
    }

    return {
      success: true,
      message: 'Message sent',
      data: this.formatMessageResponse(fullMessage),
    };
  }

  async getMessages(userId: string, dto: GetGroupMessagesDto) {
    const isMember = await this.groupChatRepository.isUserMember(dto.groupId, userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    // Mark messages as read
    await this.groupChatRepository.updateLastReadAt(dto.groupId, userId);

    const messages = await this.groupChatRepository.getGroupMessages(
      dto.groupId,
      dto.limit,
      dto.offset,
      userId,
    );

    return {
      success: true,
      data: messages.map(m => this.formatMessageResponse(m)),
    };
  }

  async markAsRead(userId: string, groupId: string) {
    const isMember = await this.groupChatRepository.isUserMember(groupId, userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    await this.groupChatRepository.updateLastReadAt(groupId, userId);

    return {
      success: true,
      message: 'Marked as read',
    };
  }

  async deleteGroup(userId: string, groupId: string) {
    const group = await this.groupChatRepository.findGroupByIdSimple(groupId);
    if (!group) {
      throw new NotFoundException('Group not found');
    }

    // Only creator can delete group
    if (group.creatorId !== userId) {
      throw new ForbiddenException('Only the creator can delete the group');
    }

    // Notify all members before deletion
    const members = await this.groupChatRepository.getGroupMembers(groupId);
    for (const member of members) {
      this.webSocketService.sendToUser(member.userId, SocketEvent.GROUP_DELETED, {
        groupId,
      });
    }

    await this.groupChatRepository.deleteGroup(groupId);

    return {
      success: true,
      message: 'Group deleted successfully',
    };
  }

  async deleteMessage(userId: string, messageId: string) {
    const message = await this.groupChatRepository.findMessageById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Verify user is a member of the group
    const isMember = await this.groupChatRepository.isUserMember(message.groupChatId, userId);
    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group');
    }

    await this.groupChatRepository.deleteMessageForUser(messageId, userId);

    return {
      success: true,
      message: 'Message deleted',
    };
  }

  async unsendMessage(userId: string, messageId: string) {
    const message = await this.groupChatRepository.findMessageById(messageId);
    if (!message) {
      throw new NotFoundException('Message not found');
    }

    // Only the sender can unsend
    if (message.senderId !== userId) {
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

    const updatedMessage = await this.groupChatRepository.unsendMessage(messageId);

    // Notify all group members except sender
    const members = await this.groupChatRepository.getGroupMembers(message.groupChatId);
    for (const member of members) {
      if (member.userId !== userId) {
        this.webSocketService.sendToUser(member.userId, SocketEvent.GROUP_MESSAGE_UNSENT, {
          groupId: message.groupChatId,
          messageId,
          unsentByUserId: userId,
          unsentAt: updatedMessage.unsentAt,
        });
      }
    }

    return {
      success: true,
      message: 'Message unsent',
      data: this.formatMessageResponse(updatedMessage),
    };
  }

  private formatGroupResponse(group: any) {
    if (!group) return null;
    return {
      id: group.id,
      name: group.name,
      description: group.description,
      avatarUrl: group.avatarUrl,
      creatorId: group.creatorId,
      creator: group.creator ? {
        id: group.creator.id,
        fullName: group.creator.fullName,
        username: group.creator.username,
        profilePicture: group.creator.profilePicture,
      } : null,
      memberCount: group.memberCount,
      members: group.members?.map((m: any) => ({
        id: m.user?.id,
        fullName: m.user?.fullName,
        username: m.user?.username,
        profilePicture: m.user?.profilePicture,
        role: m.role,
        joinedAt: m.joinedAt,
      })) || [],
      isActive: group.isActive,
      createdAt: group.createdAt,
      updatedAt: group.updatedAt,
    };
  }

  private formatMessageResponse(message: any) {
    if (!message) return null;
    return {
      id: message.id,
      groupChatId: message.groupChatId,
      content: message.isUnsent ? null : message.content,
      mediaUrl: message.isUnsent ? null : message.mediaUrl,
      messageType: message.messageType,
      isUnsent: message.isUnsent || false,
      unsentAt: message.unsentAt ? new Date(message.unsentAt).toISOString() : null,
      sender: message.sender ? {
        id: message.sender.id,
        fullName: message.sender.fullName,
        username: message.sender.username,
        profilePicture: message.sender.profilePicture,
      } : null,
      createdAt: message.createdAt,
    };
  }
}

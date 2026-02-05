import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { GroupChat, GroupMember, GroupMessage, User, GroupRole, GroupMessageType, GroupMessageDeletion } from '@app/entity';

@Injectable()
export class GroupChatRepository {
  constructor(
    @InjectRepository(GroupChat)
    private readonly groupChatRepository: Repository<GroupChat>,
    @InjectRepository(GroupMember)
    private readonly groupMemberRepository: Repository<GroupMember>,
    @InjectRepository(GroupMessage)
    private readonly groupMessageRepository: Repository<GroupMessage>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(GroupMessageDeletion)
    private readonly groupMessageDeletionRepository: Repository<GroupMessageDeletion>,
  ) {}

  // Group Chat methods
  async createGroup(data: Partial<GroupChat>): Promise<GroupChat> {
    const group = this.groupChatRepository.create(data);
    return this.groupChatRepository.save(group);
  }

  async findGroupById(id: string): Promise<GroupChat | null> {
    return this.groupChatRepository.findOne({
      where: { id },
      relations: ['creator', 'members', 'members.user'],
    });
  }

  async findGroupByIdSimple(id: string): Promise<GroupChat | null> {
    return this.groupChatRepository.findOne({
      where: { id },
    });
  }

  async updateGroup(id: string, data: Partial<GroupChat>): Promise<GroupChat | null> {
    await this.groupChatRepository.update(id, data);
    return this.findGroupById(id);
  }

  async deleteGroup(id: string): Promise<void> {
    await this.groupChatRepository.delete(id);
  }

  async getUserGroups(userId: string): Promise<GroupChat[]> {
    const memberships = await this.groupMemberRepository.find({
      where: { userId },
      relations: ['groupChat', 'groupChat.creator'],
    });

    return memberships.map(m => m.groupChat).filter(g => g.isActive);
  }

  // Group Member methods
  async addMember(groupId: string, userId: string, role: GroupRole = GroupRole.MEMBER): Promise<GroupMember> {
    const member = this.groupMemberRepository.create({
      groupChatId: groupId,
      userId,
      role,
      joinedAt: new Date(),
    });
    return this.groupMemberRepository.save(member);
  }

  async addMembers(groupId: string, userIds: string[]): Promise<GroupMember[]> {
    const members = userIds.map(userId =>
      this.groupMemberRepository.create({
        groupChatId: groupId,
        userId,
        role: GroupRole.MEMBER,
        joinedAt: new Date(),
      })
    );
    return this.groupMemberRepository.save(members);
  }

  async removeMember(groupId: string, userId: string): Promise<void> {
    await this.groupMemberRepository.delete({ groupChatId: groupId, userId });
  }

  async findMember(groupId: string, userId: string): Promise<GroupMember | null> {
    return this.groupMemberRepository.findOne({
      where: { groupChatId: groupId, userId },
      relations: ['user'],
    });
  }

  async getGroupMembers(groupId: string): Promise<GroupMember[]> {
    return this.groupMemberRepository.find({
      where: { groupChatId: groupId },
      relations: ['user'],
      order: { joinedAt: 'ASC' },
    });
  }

  async updateMember(groupId: string, userId: string, data: Partial<GroupMember>): Promise<GroupMember | null> {
    await this.groupMemberRepository.update({ groupChatId: groupId, userId }, data);
    return this.findMember(groupId, userId);
  }

  async updateMemberCount(groupId: string): Promise<void> {
    const count = await this.groupMemberRepository.count({ where: { groupChatId: groupId } });
    await this.groupChatRepository.update(groupId, { memberCount: count });
  }

  async isUserAdmin(groupId: string, userId: string): Promise<boolean> {
    const member = await this.groupMemberRepository.findOne({
      where: { groupChatId: groupId, userId },
    });
    return member?.role === GroupRole.ADMIN;
  }

  async isUserMember(groupId: string, userId: string): Promise<boolean> {
    const member = await this.groupMemberRepository.findOne({
      where: { groupChatId: groupId, userId },
    });
    return !!member;
  }

  async getAdminCount(groupId: string): Promise<number> {
    return this.groupMemberRepository.count({
      where: { groupChatId: groupId, role: GroupRole.ADMIN },
    });
  }

  // Group Message methods
  async createMessage(data: Partial<GroupMessage>): Promise<GroupMessage> {
    const message = this.groupMessageRepository.create(data);
    return this.groupMessageRepository.save(message);
  }

  async findMessageById(id: string): Promise<GroupMessage | null> {
    return this.groupMessageRepository.findOne({
      where: { id },
      relations: ['sender', 'groupChat'],
    });
  }

  async getGroupMessages(
    groupId: string,
    limit = 50,
    offset = 0,
    userId?: string,
  ): Promise<GroupMessage[]> {
    if (userId) {
      // Filter out messages deleted by current user
      return this.groupMessageRepository
        .createQueryBuilder('message')
        .leftJoinAndSelect('message.sender', 'sender')
        .leftJoin(
          'group_message_deletions', 'gmd',
          'gmd.group_message_id = message.id AND gmd.user_id = :userId',
          { userId },
        )
        .where('message.groupChatId = :groupId', { groupId })
        .andWhere('gmd.id IS NULL')
        .orderBy('message.createdAt', 'DESC')
        .take(limit)
        .skip(offset)
        .getMany();
    }

    return this.groupMessageRepository.find({
      where: { groupChatId: groupId },
      relations: ['sender'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async deleteMessage(id: string): Promise<void> {
    await this.groupMessageRepository.delete(id);
  }

  // Delete message for current user only (soft delete via junction table)
  async deleteMessageForUser(messageId: string, userId: string): Promise<void> {
    const deletion = this.groupMessageDeletionRepository.create({
      groupMessageId: messageId,
      userId,
    });
    await this.groupMessageDeletionRepository.save(deletion);
  }

  // Unsend (recall) a group message - sets global isUnsent flag
  async unsendMessage(messageId: string): Promise<GroupMessage | null> {
    await this.groupMessageRepository.update(messageId, {
      isUnsent: true,
      unsentAt: new Date(),
    });
    return this.findMessageById(messageId);
  }

  async updateLastReadAt(groupId: string, userId: string): Promise<void> {
    await this.groupMemberRepository.update(
      { groupChatId: groupId, userId },
      { lastReadAt: new Date() },
    );
  }

  async getUnreadCount(groupId: string, userId: string): Promise<number> {
    const member = await this.findMember(groupId, userId);
    if (!member) return 0;

    const queryBuilder = this.groupMessageRepository
      .createQueryBuilder('message')
      .where('message.group_chat_id = :groupId', { groupId })
      .andWhere('message.sender_id != :userId', { userId });

    if (member.lastReadAt) {
      queryBuilder.andWhere('message.created_at > :lastReadAt', { lastReadAt: member.lastReadAt });
    }

    return queryBuilder.getCount();
  }

  // User methods
  async findUserById(userId: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id: userId } });
  }

  async findUsersByIds(userIds: string[]): Promise<User[]> {
    return this.userRepository.find({ where: { id: In(userIds) } });
  }

  // Get groups with last message for chat list
  async getUserGroupsWithLastMessage(userId: string): Promise<any[]> {
    const memberships = await this.groupMemberRepository.find({
      where: { userId },
      relations: ['groupChat', 'groupChat.creator'],
    });

    const groupsWithMessages = await Promise.all(
      memberships
        .filter(m => m.groupChat?.isActive)
        .map(async (membership) => {
          const lastMessage = await this.groupMessageRepository.findOne({
            where: { groupChatId: membership.groupChatId },
            relations: ['sender'],
            order: { createdAt: 'DESC' },
          });

          const unreadCount = await this.getUnreadCount(membership.groupChatId, userId);

          return {
            group: membership.groupChat,
            lastMessage,
            unreadCount,
            isMuted: membership.isMuted,
            role: membership.role,
          };
        })
    );

    return groupsWithMessages.sort((a, b) => {
      const aTime = a.lastMessage?.createdAt || a.group.createdAt;
      const bTime = b.lastMessage?.createdAt || b.group.createdAt;
      return new Date(bTime).getTime() - new Date(aTime).getTime();
    });
  }
}

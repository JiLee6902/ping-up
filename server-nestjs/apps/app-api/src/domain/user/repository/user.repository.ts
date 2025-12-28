import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm';
import { User, Connection, BlockedUser } from '@app/entity';
import { ConnectionStatus } from '@app/enum';

@Injectable()
export class UserRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
    @InjectRepository(BlockedUser)
    private readonly blockedUserRepository: Repository<BlockedUser>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: ['followers', 'following'],
    });
  }

  async findByIdWithPosts(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
      relations: [
        'followers',
        'following',
        'posts',
        'posts.likes',
        'posts.originalPost',
        'posts.originalPost.user',
      ],
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findByUsernameWithPosts(username: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { username },
      relations: [
        'followers',
        'following',
        'posts',
        'posts.likes',
        'posts.originalPost',
        'posts.originalPost.user',
      ],
    });
  }

  async update(id: string, data: Partial<User>): Promise<User | null> {
    await this.userRepository.update(id, data);
    return this.findById(id);
  }

  async discoverUsers(
    query: string,
    excludeUserId: string,
    limit = 20,
  ): Promise<User[]> {
    // Sanitize and prepare search query for PostgreSQL full-text search
    const sanitizedQuery = query.trim();
    if (!sanitizedQuery) {
      return [];
    }

    // Build tsquery: split words and add prefix matching (:*)
    const tsQueryString = sanitizedQuery
      .split(/\s+/)
      .filter((term) => term.length > 0)
      .map((term) => term.replace(/[^\w\u00C0-\u024F]/g, '')) // Remove special chars
      .filter((term) => term.length > 0)
      .map((term) => `${term}:*`)
      .join(' & ');

    if (!tsQueryString) {
      // Fallback to ILIKE if no valid search terms
      return this.userRepository
        .createQueryBuilder('user')
        .where('user.id != :excludeUserId', { excludeUserId })
        .andWhere(
          `(
            user.username ILIKE :likeQuery
            OR user.full_name ILIKE :likeQuery
            OR user.email ILIKE :likeQuery
          )`,
          { likeQuery: `%${sanitizedQuery}%` },
        )
        .take(limit)
        .getMany();
    }

    // Use PostgreSQL full-text search with tsvector
    // After running migration, the search_vector column will be indexed for faster queries
    return this.userRepository
      .createQueryBuilder('user')
      .where('user.id != :excludeUserId', { excludeUserId })
      .andWhere(
        `(
          to_tsvector('simple', COALESCE(user.username, '') || ' ' || COALESCE(user.full_name, '') || ' ' || COALESCE(user.email, '') || ' ' || COALESCE(user.location, ''))
          @@ to_tsquery('simple', :tsQuery)
          OR user.username ILIKE :likeQuery
          OR user.full_name ILIKE :likeQuery
          OR user.email ILIKE :likeQuery
        )`,
        {
          tsQuery: tsQueryString,
          likeQuery: `%${sanitizedQuery}%`,
        },
      )
      .orderBy(
        `ts_rank(
          to_tsvector('simple', COALESCE(user.username, '') || ' ' || COALESCE(user.full_name, '') || ' ' || COALESCE(user.email, '') || ' ' || COALESCE(user.location, '')),
          to_tsquery('simple', :tsQuery)
        )`,
        'DESC',
      )
      .setParameter('tsQuery', tsQueryString)
      .take(limit)
      .getMany();
  }

  async addFollower(userId: string, followerId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['followers'],
    });
    const follower = await this.userRepository.findOne({ where: { id: followerId } });

    if (user && follower) {
      user.followers = [...(user.followers || []), follower];
      await this.userRepository.save(user);
    }
  }

  async removeFollower(userId: string, followerId: string): Promise<void> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['followers'],
    });

    if (user) {
      user.followers = (user.followers || []).filter((f) => f.id !== followerId);
      await this.userRepository.save(user);
    }
  }

  async getFollowers(userId: string): Promise<User[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['followers'],
    });
    return user?.followers || [];
  }

  async getFollowing(userId: string): Promise<User[]> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });
    return user?.following || [];
  }

  // Connection methods
  async createConnection(fromUserId: string, toUserId: string): Promise<Connection> {
    const connection = this.connectionRepository.create({
      fromUser: { id: fromUserId } as User,
      toUser: { id: toUserId } as User,
      status: ConnectionStatus.PENDING,
    });
    return this.connectionRepository.save(connection);
  }

  async findConnection(fromUserId: string, toUserId: string): Promise<Connection | null> {
    return this.connectionRepository.findOne({
      where: [
        { fromUser: { id: fromUserId }, toUser: { id: toUserId } },
        { fromUser: { id: toUserId }, toUser: { id: fromUserId } },
      ],
      relations: ['fromUser', 'toUser'],
    });
  }

  async acceptConnection(connectionId: string): Promise<Connection | null> {
    await this.connectionRepository.update(connectionId, {
      status: ConnectionStatus.ACCEPTED,
    });
    return this.connectionRepository.findOne({
      where: { id: connectionId },
      relations: ['fromUser', 'toUser'],
    });
  }

  async getConnectionsForUser(userId: string): Promise<Connection[]> {
    return this.connectionRepository.find({
      where: [
        { fromUser: { id: userId }, status: ConnectionStatus.ACCEPTED },
        { toUser: { id: userId }, status: ConnectionStatus.ACCEPTED },
      ],
      relations: ['fromUser', 'toUser'],
    });
  }

  async getPendingConnectionsReceived(userId: string): Promise<Connection[]> {
    return this.connectionRepository.find({
      where: {
        toUser: { id: userId },
        status: ConnectionStatus.PENDING,
      },
      relations: ['fromUser', 'toUser'],
    });
  }

  async getPendingConnectionsSent(userId: string): Promise<Connection[]> {
    return this.connectionRepository.find({
      where: {
        fromUser: { id: userId },
        status: ConnectionStatus.PENDING,
      },
      relations: ['fromUser', 'toUser'],
    });
  }

  async countConnectionRequestsInLast24Hours(userId: string): Promise<number> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.connectionRepository.count({
      where: {
        fromUser: { id: userId },
        createdAt: MoreThan(oneDayAgo),
      },
    });
  }

  async deleteConnection(connectionId: string): Promise<void> {
    await this.connectionRepository.delete(connectionId);
  }

  async findConnectionById(connectionId: string): Promise<Connection | null> {
    return this.connectionRepository.findOne({
      where: { id: connectionId },
      relations: ['fromUser', 'toUser'],
    });
  }

  // Follow request methods (for private accounts)
  async isFollowing(followerId: string, targetUserId: string): Promise<boolean> {
    const targetUser = await this.userRepository.findOne({
      where: { id: targetUserId },
      relations: ['followers'],
    });
    return targetUser?.followers?.some((f) => f.id === followerId) || false;
  }

  async findPendingFollowRequest(fromUserId: string, toUserId: string): Promise<Connection | null> {
    return this.connectionRepository.findOne({
      where: {
        fromUser: { id: fromUserId },
        toUser: { id: toUserId },
        status: ConnectionStatus.PENDING,
      },
      relations: ['fromUser', 'toUser'],
    });
  }

  async createFollowRequest(fromUserId: string, toUserId: string): Promise<Connection> {
    const request = this.connectionRepository.create({
      fromUser: { id: fromUserId } as User,
      toUser: { id: toUserId } as User,
      status: ConnectionStatus.PENDING,
    });
    return this.connectionRepository.save(request);
  }

  async acceptFollowRequest(connectionId: string): Promise<Connection | null> {
    const connection = await this.connectionRepository.findOne({
      where: { id: connectionId },
      relations: ['fromUser', 'toUser'],
    });

    if (!connection) return null;

    // Add to followers
    await this.addFollower(connection.toUserId, connection.fromUserId);

    // Delete the follow request
    await this.connectionRepository.delete(connectionId);

    return connection;
  }

  async rejectFollowRequest(connectionId: string): Promise<void> {
    await this.connectionRepository.delete(connectionId);
  }

  async cancelFollowRequest(fromUserId: string, toUserId: string): Promise<void> {
    await this.connectionRepository.delete({
      fromUser: { id: fromUserId },
      toUser: { id: toUserId },
      status: ConnectionStatus.PENDING,
    });
  }

  async hasPendingFollowRequest(fromUserId: string, toUserId: string): Promise<boolean> {
    const count = await this.connectionRepository.count({
      where: {
        fromUser: { id: fromUserId },
        toUser: { id: toUserId },
        status: ConnectionStatus.PENDING,
      },
    });
    return count > 0;
  }

  // Block user methods
  async blockUser(blockerId: string, blockedId: string, reason?: string): Promise<BlockedUser> {
    const block = this.blockedUserRepository.create({
      blockerId,
      blockedId,
      reason,
    });
    return this.blockedUserRepository.save(block);
  }

  async unblockUser(blockerId: string, blockedId: string): Promise<void> {
    await this.blockedUserRepository.delete({
      blockerId,
      blockedId,
    });
  }

  async isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
    const count = await this.blockedUserRepository.count({
      where: { blockerId, blockedId },
    });
    return count > 0;
  }

  async isBlockedByUser(userId: string, blockerId: string): Promise<boolean> {
    const count = await this.blockedUserRepository.count({
      where: { blockerId, blockedId: userId },
    });
    return count > 0;
  }

  async getBlockedUsers(userId: string): Promise<User[]> {
    const blocks = await this.blockedUserRepository.find({
      where: { blockerId: userId },
      relations: ['blocked'],
      order: { createdAt: 'DESC' },
    });
    return blocks.map((b) => b.blocked);
  }

  async getBlockedUserIds(userId: string): Promise<string[]> {
    const blocks = await this.blockedUserRepository.find({
      where: { blockerId: userId },
      select: ['blockedId'],
    });
    return blocks.map((b) => b.blockedId);
  }

  async getUsersWhoBlockedMe(userId: string): Promise<string[]> {
    const blocks = await this.blockedUserRepository.find({
      where: { blockedId: userId },
      select: ['blockerId'],
    });
    return blocks.map((b) => b.blockerId);
  }
}

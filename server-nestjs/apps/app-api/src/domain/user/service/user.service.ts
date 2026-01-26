import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Queue } from 'bull';
import { UserRepository } from '../repository/user.repository';
import { UploadService } from '../../upload/service/upload.service';
import { EmailService } from '@app/external-infra/email';
import { WebSocketService } from '@app/external-infra/websocket';
import { NotificationService } from '../../notification/service/notification.service';
import { Message } from '@app/entity';
import {
  UpdateUserDto,
  DiscoverDto,
  FollowDto,
  ConnectionRequestDto,
  AcceptConnectionDto,
} from '../dto';

const CONNECTION_RATE_LIMIT = 20;

@Injectable()
export class UserService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly uploadService: UploadService,
    private readonly emailService: EmailService,
    private readonly webSocketService: WebSocketService,
    @InjectQueue('connection') private readonly connectionQueue: Queue,
    @InjectRepository(Message)
    private readonly messageRepository: Repository<Message>,
    @Inject(forwardRef(() => NotificationService))
    private readonly notificationService: NotificationService,
  ) {}

  async getUserData(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get user's accepted connections
    const connections = await this.userRepository.getConnectionsForUser(userId);
    const connectionIds = connections.map((c) =>
      c.fromUser.id === userId ? c.toUser.id : c.fromUser.id,
    );

    return {
      success: true,
      data: {
        ...this.formatUserResponse(user, true),
        connections: connectionIds,
      },
    };
  }

  async updateUserData(
    userId: string,
    dto: UpdateUserDto,
    files?: { profile_picture?: Express.Multer.File[]; cover_photo?: Express.Multer.File[] },
  ) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: Partial<any> = {};

    // Handle username change
    if (dto.username && dto.username !== user.username) {
      const existingUser = await this.userRepository.findByUsername(dto.username);
      if (existingUser && existingUser.id !== userId) {
        // Username taken, keep old username
        updateData.username = user.username;
      } else {
        updateData.username = dto.username;
      }
    }

    if (dto.fullName) updateData.fullName = dto.fullName;
    if (dto.bio !== undefined) updateData.bio = dto.bio;
    if (dto.location !== undefined) updateData.location = dto.location;

    // Handle profile picture upload
    if (files?.profile_picture?.[0]) {
      const result = await this.uploadService.uploadProfileImage(files.profile_picture[0]);
      updateData.profilePicture = result.url;
    }

    // Handle cover photo upload
    if (files?.cover_photo?.[0]) {
      const result = await this.uploadService.uploadCoverPhoto(files.cover_photo[0]);
      updateData.coverPhoto = result.url;
    }

    const updatedUser = await this.userRepository.update(userId, updateData);

    // Get connections for the updated response
    const connections = await this.userRepository.getConnectionsForUser(userId);
    const connectionIds = connections.map((c) =>
      c.fromUser.id === userId ? c.toUser.id : c.fromUser.id,
    );

    return {
      success: true,
      message: 'Profile updated successfully',
      data: {
        ...this.formatUserResponse(updatedUser, true),
        connections: connectionIds,
      },
    };
  }

  async discoverUsers(userId: string, dto: DiscoverDto) {
    const users = await this.userRepository.discoverUsers(
      dto.query,
      userId,
      dto.limit || 20,
    );

    return {
      success: true,
      data: users
        .filter((u) => u.id !== userId)
        .map((u) => this.formatUserResponse(u)),
    };
  }

  async followUser(userId: string, dto: FollowDto) {
    if (userId === dto.userId) {
      throw new BadRequestException('Cannot follow yourself');
    }

    const targetUser = await this.userRepository.findById(dto.userId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already following
    const isAlreadyFollowing = await this.userRepository.isFollowing(userId, dto.userId);
    if (isAlreadyFollowing) {
      throw new BadRequestException('Already following this user');
    }

    // Check if there's a pending follow request
    const existingRequest = await this.userRepository.findPendingFollowRequest(userId, dto.userId);
    if (existingRequest) {
      throw new BadRequestException('Follow request already sent');
    }

    // Get current user for notification
    const currentUser = await this.userRepository.findById(userId);

    // If target user is private, create pending follow request
    if (targetUser.isPrivate) {
      await this.userRepository.createFollowRequest(userId, dto.userId);

      // Create follow request notification
      this.notificationService.createFollowNotification(
        dto.userId,
        userId,
        currentUser?.fullName || 'Someone',
        true, // isRequest
      );

      return {
        success: true,
        message: 'Follow request sent',
        isPending: true,
      };
    }

    // Public account - add follower directly
    await this.userRepository.addFollower(dto.userId, userId);

    // Create follow notification
    this.notificationService.createFollowNotification(
      dto.userId,
      userId,
      currentUser?.fullName || 'Someone',
      false, // isRequest
    );

    return {
      success: true,
      message: 'User followed successfully',
      isPending: false,
    };
  }

  async unfollowUser(userId: string, dto: FollowDto) {
    if (userId === dto.userId) {
      throw new BadRequestException('Cannot unfollow yourself');
    }

    await this.userRepository.removeFollower(dto.userId, userId);

    return {
      success: true,
      message: 'User unfollowed successfully',
    };
  }

  async acceptFollowRequest(userId: string, dto: AcceptConnectionDto) {
    const connection = await this.userRepository.findConnectionById(dto.connectionId);
    if (!connection || connection.toUserId !== userId) {
      throw new NotFoundException('Follow request not found');
    }

    await this.userRepository.acceptFollowRequest(dto.connectionId);

    // Create notification for the requester
    const currentUser = await this.userRepository.findById(userId);
    this.notificationService.createFollowAcceptedNotification(
      connection.fromUserId,
      userId,
      currentUser?.fullName || 'Someone',
    );

    return {
      success: true,
      message: 'Follow request accepted',
    };
  }

  async rejectFollowRequest(userId: string, dto: AcceptConnectionDto) {
    const connection = await this.userRepository.findConnectionById(dto.connectionId);
    if (!connection || connection.toUserId !== userId) {
      throw new NotFoundException('Follow request not found');
    }

    await this.userRepository.rejectFollowRequest(dto.connectionId);

    return {
      success: true,
      message: 'Follow request rejected',
    };
  }

  async cancelFollowRequest(userId: string, dto: FollowDto) {
    await this.userRepository.cancelFollowRequest(userId, dto.userId);

    return {
      success: true,
      message: 'Follow request cancelled',
    };
  }

  async removeFollower(userId: string, dto: FollowDto) {
    // Remove the follower from current user's followers list
    // userId = current user (A), dto.userId = follower to remove (B)
    await this.userRepository.removeFollower(userId, dto.userId);

    return {
      success: true,
      message: 'Follower removed',
    };
  }

  async sendConnectionRequest(userId: string, dto: ConnectionRequestDto) {
    if (userId === dto.userId) {
      throw new BadRequestException('Cannot connect with yourself');
    }

    // Check rate limit
    const requestCount = await this.userRepository.countConnectionRequestsInLast24Hours(userId);
    if (requestCount >= CONNECTION_RATE_LIMIT) {
      throw new BadRequestException(
        `Connection request limit reached. Maximum ${CONNECTION_RATE_LIMIT} requests per 24 hours.`,
      );
    }

    // Check if connection already exists
    const existingConnection = await this.userRepository.findConnection(userId, dto.userId);
    if (existingConnection) {
      throw new ConflictException('Connection already exists');
    }

    const currentUser = await this.userRepository.findById(userId);
    const targetUser = await this.userRepository.findById(dto.userId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const connection = await this.userRepository.createConnection(userId, dto.userId);

    // Send immediate connection request email
    try {
      await this.emailService.sendConnectionRequestEmail(
        targetUser.email,
        targetUser.fullName,
        currentUser?.fullName || 'Someone',
      );
    } catch (error) {
      // Don't fail the request if email fails
      console.error('Failed to send connection request email:', error);
    }

    // Queue 24-hour reminder job
    await this.connectionQueue.add(
      'connection-reminder',
      { connectionId: connection.id },
      { delay: 24 * 60 * 60 * 1000 }, // 24 hours
    );

    return {
      success: true,
      message: 'Connection request sent',
      data: { connectionId: connection.id },
    };
  }

  async acceptConnectionRequest(userId: string, dto: AcceptConnectionDto) {
    const connection = await this.userRepository.acceptConnection(dto.connectionId);
    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    // Send connection accepted email to the requester
    try {
      const accepter = await this.userRepository.findById(userId);
      await this.emailService.sendConnectionAcceptedEmail(
        connection.fromUser.email,
        connection.fromUser.fullName,
        accepter?.fullName || 'Someone',
      );
    } catch (error) {
      console.error('Failed to send connection accepted email:', error);
    }

    return {
      success: true,
      message: 'Connection accepted',
    };
  }

  async cancelConnectionRequest(userId: string, dto: AcceptConnectionDto) {
    const connection = await this.userRepository.findConnectionById(dto.connectionId);

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    // Only the sender can cancel their own request
    if (connection.fromUser.id !== userId) {
      throw new ForbiddenException('You can only cancel your own connection requests');
    }

    await this.userRepository.deleteConnection(dto.connectionId);

    return {
      success: true,
      message: 'Connection request cancelled',
    };
  }

  async rejectConnectionRequest(userId: string, dto: AcceptConnectionDto) {
    const connection = await this.userRepository.findConnectionById(dto.connectionId);

    if (!connection) {
      throw new NotFoundException('Connection request not found');
    }

    // Only the receiver can reject the request
    if (connection.toUser.id !== userId) {
      throw new ForbiddenException('You can only reject requests sent to you');
    }

    await this.userRepository.deleteConnection(dto.connectionId);

    return {
      success: true,
      message: 'Connection request rejected',
    };
  }

  async removeConnection(userId: string, dto: AcceptConnectionDto) {
    const connection = await this.userRepository.findConnectionById(dto.connectionId);

    if (!connection) {
      throw new NotFoundException('Connection not found');
    }

    // Either party can remove the connection
    if (connection.fromUser.id !== userId && connection.toUser.id !== userId) {
      throw new ForbiddenException('You are not part of this connection');
    }

    await this.userRepository.deleteConnection(dto.connectionId);

    return {
      success: true,
      message: 'Connection removed',
    };
  }

  async getUserConnections(userId: string) {
    const [connections, followers, following, pendingReceived, pendingSent] =
      await Promise.all([
        this.userRepository.getConnectionsForUser(userId),
        this.userRepository.getFollowers(userId),
        this.userRepository.getFollowing(userId),
        this.userRepository.getPendingConnectionsReceived(userId),
        this.userRepository.getPendingConnectionsSent(userId),
      ]);

    return {
      success: true,
      data: {
        connections: connections.map((c) => ({
          id: c.id,
          user: this.formatUserResponse(
            c.fromUser.id === userId ? c.toUser : c.fromUser,
          ),
        })),
        followers: followers.map((u) => this.formatUserResponse(u)),
        following: following.map((u) => this.formatUserResponse(u)),
        pendingReceived: pendingReceived.map((c) => ({
          id: c.id,
          user: this.formatUserResponse(c.fromUser),
          createdAt: c.createdAt,
        })),
        pendingSent: pendingSent.map((c) => ({
          id: c.id,
          user: this.formatUserResponse(c.toUser),
          createdAt: c.createdAt,
        })),
      },
    };
  }

  async getUserProfile(userId?: string, viewerId?: string, username?: string) {
    let user;

    if (username) {
      // Find by username
      user = await this.userRepository.findByUsernameWithPosts(username);
    } else if (userId && userId !== 'undefined') {
      // Find by userId
      user = await this.userRepository.findByIdWithPosts(userId);
    } else {
      throw new BadRequestException('User ID or username is required');
    }
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if viewer can see content
    let canViewContent = true;
    let isFollowing = false;
    let hasPendingRequest = false;
    const profileUserId = user.id;

    if (user.isPrivate && viewerId && viewerId !== profileUserId) {
      isFollowing = await this.userRepository.isFollowing(viewerId, profileUserId);
      hasPendingRequest = await this.userRepository.hasPendingFollowRequest(viewerId, profileUserId);
      canViewContent = isFollowing;
    }

    // If private and not following, return limited data
    if (!canViewContent) {
      return {
        success: true,
        data: {
          user: this.formatUserResponse(user),
          posts: [],
          isPrivate: true,
          isFollowing: false,
          hasPendingRequest,
          canViewContent: false,
        },
      };
    }

    // Sort posts by createdAt DESC and format them
    const posts = (user.posts || [])
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .map((post) => this.formatPostResponse(post, user));

    return {
      success: true,
      data: {
        user: this.formatUserResponse(user),
        posts,
        isPrivate: user.isPrivate || false,
        isFollowing,
        hasPendingRequest,
        canViewContent: true,
      },
    };
  }

  // Get recent unseen messages for user (moved from message controller)
  async getRecentMessages(userId: string) {
    const unseenMessages = await this.messageRepository.find({
      where: {
        toUser: { id: userId },
        seen: false,
      },
      relations: ['fromUser', 'toUser'],
      order: { createdAt: 'DESC' },
    });

    return {
      success: true,
      data: {
        count: unseenMessages.length,
        messages: unseenMessages.map((m) => ({
          id: m.id,
          text: m.text,
          mediaUrl: m.mediaUrl,
          messageType: m.messageType,
          seen: m.seen,
          fromUser: {
            id: m.fromUser.id,
            fullName: m.fromUser.fullName,
            username: m.fromUser.username,
            profilePicture: m.fromUser.profilePicture,
          },
          createdAt: m.createdAt,
        })),
      },
    };
  }

  async getOnlineStatus(userIds: string[]) {
    const onlineStatus = this.webSocketService.getOnlineStatusForUsers(userIds);
    return {
      success: true,
      data: onlineStatus,
    };
  }

  isUserOnline(userId: string): boolean {
    return this.webSocketService.isOnline(userId);
  }

  private formatPostResponse(post: any, user: any) {
    const formattedPost: any = {
      id: post.id,
      content: post.content,
      postType: post.postType,
      imageUrls: post.imageUrls || [],
      likesCount: post.likesCount || 0,
      commentsCount: post.commentsCount || 0,
      sharesCount: post.sharesCount || 0,
      createdAt: post.createdAt,
      user: {
        id: user.id,
        fullName: user.fullName,
        username: user.username,
        profilePicture: user.profilePicture,
      },
      likes: post.likes?.map((u: any) => ({ id: u.id })) || [],
    };

    // Include originalPost for reposts
    if (post.originalPost) {
      formattedPost.originalPost = {
        id: post.originalPost.id,
        content: post.originalPost.content,
        postType: post.originalPost.postType,
        imageUrls: post.originalPost.imageUrls || [],
        likesCount: post.originalPost.likesCount || 0,
        commentsCount: post.originalPost.commentsCount || 0,
        sharesCount: post.originalPost.sharesCount || 0,
        createdAt: post.originalPost.createdAt,
        user: post.originalPost.user
          ? {
              id: post.originalPost.user.id,
              fullName: post.originalPost.user.fullName,
              username: post.originalPost.user.username,
              profilePicture: post.originalPost.user.profilePicture,
            }
          : null,
      };
    }

    return formattedPost;
  }

  private formatUserResponse(user: any, includeRelations = false) {
    const response: any = {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      username: user.username,
      bio: user.bio,
      location: user.location,
      profilePicture: user.profilePicture,
      coverPhoto: user.coverPhoto,
      isPrivate: user.isPrivate || false,
      followersCount: user.followers?.length || 0,
      followingCount: user.following?.length || 0,
      lastActivityAt: user.lastActivityAt,
    };

    if (includeRelations) {
      response.followers = user.followers?.map((f: any) => f.id) || [];
      response.following = user.following?.map((f: any) => f.id) || [];
    }

    return response;
  }

  async togglePrivacy(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const newPrivacyStatus = !user.isPrivate;
    await this.userRepository.update(userId, { isPrivate: newPrivacyStatus });

    return {
      success: true,
      message: newPrivacyStatus ? 'Account is now private' : 'Account is now public',
      data: { isPrivate: newPrivacyStatus },
    };
  }

  // Block user methods
  async blockUser(userId: string, targetUserId: string, reason?: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('Cannot block yourself');
    }

    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already blocked
    const isAlreadyBlocked = await this.userRepository.isBlocked(userId, targetUserId);
    if (isAlreadyBlocked) {
      throw new BadRequestException('User is already blocked');
    }

    // Block the user
    await this.userRepository.blockUser(userId, targetUserId, reason);

    // Unfollow each other
    await this.userRepository.removeFollower(userId, targetUserId); // Remove them from our followers
    await this.userRepository.removeFollower(targetUserId, userId); // Remove us from their followers

    // Cancel any pending follow requests between them
    await this.userRepository.cancelFollowRequest(userId, targetUserId);
    await this.userRepository.cancelFollowRequest(targetUserId, userId);

    // Remove any existing connection
    const connection = await this.userRepository.findConnection(userId, targetUserId);
    if (connection) {
      await this.userRepository.deleteConnection(connection.id);
    }

    return {
      success: true,
      message: 'User blocked successfully',
    };
  }

  async unblockUser(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('Cannot unblock yourself');
    }

    const isBlocked = await this.userRepository.isBlocked(userId, targetUserId);
    if (!isBlocked) {
      throw new BadRequestException('User is not blocked');
    }

    await this.userRepository.unblockUser(userId, targetUserId);

    return {
      success: true,
      message: 'User unblocked successfully',
    };
  }

  async getBlockedUsers(userId: string) {
    const blockedUsers = await this.userRepository.getBlockedUsers(userId);

    return {
      success: true,
      data: blockedUsers.map((u) => this.formatUserResponse(u)),
    };
  }

  async isBlocked(userId: string, targetUserId: string) {
    const isBlocked = await this.userRepository.isBlocked(userId, targetUserId);
    const isBlockedByTarget = await this.userRepository.isBlockedByUser(userId, targetUserId);

    return {
      success: true,
      data: {
        isBlocked,
        isBlockedByTarget,
      },
    };
  }

  async getFollowersList(viewerId: string, targetUserId: string, search?: string) {
    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if viewer can see followers (for private accounts)
    if (targetUser.isPrivate && viewerId !== targetUserId) {
      const isFollowing = await this.userRepository.isFollowing(viewerId, targetUserId);
      if (!isFollowing) {
        throw new ForbiddenException('This account is private');
      }
    }

    let followers = await this.userRepository.getFollowers(targetUserId);

    // Filter by search query if provided
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      followers = followers.filter(
        (u) =>
          u.username?.toLowerCase().includes(searchLower) ||
          u.fullName?.toLowerCase().includes(searchLower),
      );
    }

    // Check which followers the viewer is following
    const viewerFollowing = await this.userRepository.getFollowing(viewerId);
    const viewerFollowingIds = new Set(viewerFollowing.map((u) => u.id));

    return {
      success: true,
      data: followers.map((u) => ({
        ...this.formatUserResponse(u),
        isFollowing: viewerFollowingIds.has(u.id),
        isOwnProfile: u.id === viewerId,
      })),
    };
  }

  async getFollowingList(viewerId: string, targetUserId: string, search?: string) {
    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if viewer can see following list (for private accounts)
    if (targetUser.isPrivate && viewerId !== targetUserId) {
      const isFollowing = await this.userRepository.isFollowing(viewerId, targetUserId);
      if (!isFollowing) {
        throw new ForbiddenException('This account is private');
      }
    }

    let following = await this.userRepository.getFollowing(targetUserId);

    // Filter by search query if provided
    if (search && search.trim()) {
      const searchLower = search.toLowerCase();
      following = following.filter(
        (u) =>
          u.username?.toLowerCase().includes(searchLower) ||
          u.fullName?.toLowerCase().includes(searchLower),
      );
    }

    // Check which of these users the viewer is following
    const viewerFollowing = await this.userRepository.getFollowing(viewerId);
    const viewerFollowingIds = new Set(viewerFollowing.map((u) => u.id));

    return {
      success: true,
      data: following.map((u) => ({
        ...this.formatUserResponse(u),
        isFollowing: viewerFollowingIds.has(u.id),
        isOwnProfile: u.id === viewerId,
      })),
    };
  }

  // Mute user methods
  async muteUser(userId: string, targetUserId: string, duration?: number) {
    if (userId === targetUserId) {
      throw new BadRequestException('Cannot mute yourself');
    }

    const targetUser = await this.userRepository.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    // Check if already muted
    const isAlreadyMuted = await this.userRepository.isMuted(userId, targetUserId);
    if (isAlreadyMuted) {
      throw new BadRequestException('User is already muted');
    }

    // Calculate mute expiration if duration provided (in hours)
    let muteUntil: Date | undefined;
    if (duration && duration > 0) {
      muteUntil = new Date(Date.now() + duration * 60 * 60 * 1000);
    }

    await this.userRepository.muteUser(userId, targetUserId, muteUntil);

    return {
      success: true,
      message: muteUntil
        ? `User muted for ${duration} hours`
        : 'User muted permanently',
    };
  }

  async unmuteUser(userId: string, targetUserId: string) {
    if (userId === targetUserId) {
      throw new BadRequestException('Cannot unmute yourself');
    }

    const isMuted = await this.userRepository.isMuted(userId, targetUserId);
    if (!isMuted) {
      throw new BadRequestException('User is not muted');
    }

    await this.userRepository.unmuteUser(userId, targetUserId);

    return {
      success: true,
      message: 'User unmuted successfully',
    };
  }

  async getMutedUsers(userId: string) {
    const mutedUsers = await this.userRepository.getMutedUsers(userId);

    return {
      success: true,
      data: mutedUsers.map((u) => this.formatUserResponse(u)),
    };
  }

  async isMuted(userId: string, targetUserId: string) {
    const isMuted = await this.userRepository.isMuted(userId, targetUserId);

    return {
      success: true,
      data: { isMuted },
    };
  }

  async getMutedUserIds(userId: string): Promise<string[]> {
    return this.userRepository.getMutedUserIds(userId);
  }
}

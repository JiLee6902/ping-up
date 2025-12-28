import { Injectable } from '@nestjs/common';
import { NotificationRepository } from '../repository/notification.repository';
import { WebSocketService } from '@app/external-infra/websocket';
import { NotificationType } from '@app/enum';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepository: NotificationRepository,
    private readonly webSocketService: WebSocketService,
  ) {}

  async getNotifications(userId: string, limit?: number | string, offset?: number | string) {
    const parsedLimit = limit ? parseInt(String(limit), 10) : 50;
    const parsedOffset = offset ? parseInt(String(offset), 10) : 0;

    const notifications = await this.notificationRepository.findByRecipient(
      userId,
      parsedLimit,
      parsedOffset,
    );

    return {
      success: true,
      data: notifications.map(this.formatNotification),
    };
  }

  async getUnreadCount(userId: string) {
    const count = await this.notificationRepository.countUnread(userId);
    return {
      success: true,
      data: { count },
    };
  }

  async markAsRead(userId: string, notificationId: string) {
    const success = await this.notificationRepository.markAsRead(notificationId, userId);
    return {
      success,
      message: success ? 'Notification marked as read' : 'Notification not found',
    };
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.markAllAsRead(userId);
    return {
      success: true,
      message: 'All notifications marked as read',
    };
  }

  async deleteNotification(userId: string, notificationId: string) {
    const success = await this.notificationRepository.deleteNotification(notificationId, userId);
    return {
      success,
      message: success ? 'Notification deleted' : 'Notification not found',
    };
  }

  // Methods to create notifications from other services
  async createLikeNotification(
    recipientId: string,
    actorId: string,
    postId: string,
    actorName: string,
  ) {
    // Don't notify if user likes their own post
    if (recipientId === actorId) return;

    // Check if notification already exists
    const existing = await this.notificationRepository.findExisting(
      recipientId,
      actorId,
      NotificationType.LIKE,
      postId,
    );
    if (existing) return;

    const notification = await this.notificationRepository.create({
      recipientId,
      actorId,
      type: NotificationType.LIKE,
      postId,
      message: `${actorName} liked your post`,
    });

    this.sendRealTimeNotification(recipientId, notification);
  }

  async removeLikeNotification(recipientId: string, actorId: string, postId: string) {
    await this.notificationRepository.deleteByActorAndType(
      recipientId,
      actorId,
      NotificationType.LIKE,
      postId,
    );
  }

  async createCommentNotification(
    recipientId: string,
    actorId: string,
    postId: string,
    commentId: string,
    actorName: string,
  ) {
    if (recipientId === actorId) return;

    const notification = await this.notificationRepository.create({
      recipientId,
      actorId,
      type: NotificationType.COMMENT,
      postId,
      commentId,
      message: `${actorName} commented on your post`,
    });

    this.sendRealTimeNotification(recipientId, notification);
  }

  async createFollowNotification(
    recipientId: string,
    actorId: string,
    actorName: string,
    isRequest = false,
  ) {
    const type = isRequest ? NotificationType.FOLLOW_REQUEST : NotificationType.FOLLOW;
    const message = isRequest
      ? `${actorName} requested to follow you`
      : `${actorName} started following you`;

    // Remove any existing follow/follow_request notification from this actor
    await this.notificationRepository.deleteByActorAndType(
      recipientId,
      actorId,
      NotificationType.FOLLOW,
    );
    await this.notificationRepository.deleteByActorAndType(
      recipientId,
      actorId,
      NotificationType.FOLLOW_REQUEST,
    );

    const notification = await this.notificationRepository.create({
      recipientId,
      actorId,
      type,
      message,
    });

    this.sendRealTimeNotification(recipientId, notification);
  }

  async createFollowAcceptedNotification(
    recipientId: string,
    actorId: string,
    actorName: string,
  ) {
    const notification = await this.notificationRepository.create({
      recipientId,
      actorId,
      type: NotificationType.FOLLOW_ACCEPTED,
      message: `${actorName} accepted your follow request`,
    });

    this.sendRealTimeNotification(recipientId, notification);
  }

  async createRepostNotification(
    recipientId: string,
    actorId: string,
    postId: string,
    actorName: string,
  ) {
    if (recipientId === actorId) return;

    const existing = await this.notificationRepository.findExisting(
      recipientId,
      actorId,
      NotificationType.REPOST,
      postId,
    );
    if (existing) return;

    const notification = await this.notificationRepository.create({
      recipientId,
      actorId,
      type: NotificationType.REPOST,
      postId,
      message: `${actorName} shared your post`,
    });

    this.sendRealTimeNotification(recipientId, notification);
  }

  private sendRealTimeNotification(recipientId: string, notification: any) {
    this.webSocketService.sendNotification(recipientId, this.formatNotification(notification));
  }

  private formatNotification(notification: any) {
    return {
      id: notification.id,
      type: notification.type,
      message: notification.message,
      isRead: notification.isRead,
      postId: notification.postId,
      commentId: notification.commentId,
      actor: notification.actor ? {
        id: notification.actor.id,
        fullName: notification.actor.fullName,
        username: notification.actor.username,
        profilePicture: notification.actor.profilePicture,
      } : null,
      createdAt: notification.createdAt,
    };
  }
}

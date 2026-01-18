import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification } from '@app/entity';
import { NotificationType } from '@app/enum';

@Injectable()
export class NotificationRepository {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(data: Partial<Notification>): Promise<Notification> {
    const notification = this.notificationRepository.create(data);
    return this.notificationRepository.save(notification);
  }

  async findByRecipient(
    recipientId: string,
    limit = 50,
    offset = 0,
  ): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { recipientId },
      relations: ['actor', 'post', 'comment'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async countUnread(recipientId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { recipientId, isRead: false },
    });
  }

  async markAsRead(notificationId: string, recipientId: string): Promise<boolean> {
    const result = await this.notificationRepository.update(
      { id: notificationId, recipientId },
      { isRead: true },
    );
    return (result.affected ?? 0) > 0;
  }

  async markAllAsRead(recipientId: string): Promise<void> {
    await this.notificationRepository.update(
      { recipientId, isRead: false },
      { isRead: true },
    );
  }

  async deleteNotification(notificationId: string, recipientId: string): Promise<boolean> {
    const result = await this.notificationRepository.delete({
      id: notificationId,
      recipientId,
    });
    return (result.affected ?? 0) > 0;
  }

  async deleteByActorAndType(
    recipientId: string,
    actorId: string,
    type: NotificationType,
    postId?: string,
  ): Promise<void> {
    const where: any = { recipientId, actorId, type };
    if (postId) {
      where.postId = postId;
    }
    await this.notificationRepository.delete(where);
  }

  async findExisting(
    recipientId: string,
    actorId: string,
    type: NotificationType,
    postId?: string,
    commentId?: string,
  ): Promise<Notification | null> {
    const where: any = { recipientId, actorId, type };
    if (postId) where.postId = postId;
    if (commentId) where.commentId = commentId;
    return this.notificationRepository.findOne({ where });
  }
}

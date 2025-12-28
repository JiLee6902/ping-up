import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { NOTIFICATION_QUEUE } from './queue.module';

export enum NotificationType {
  CONNECTION_REQUEST = 'CONNECTION_REQUEST',
  CONNECTION_ACCEPTED = 'CONNECTION_ACCEPTED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  POST_LIKED = 'POST_LIKED',
  NEW_COMMENT = 'NEW_COMMENT',
  POST_REPOSTED = 'POST_REPOSTED',
  MENTION = 'MENTION',
  STORY_VIEW = 'STORY_VIEW',
}

export class NotificationEventDto {
  type: string;
  userId: string;
  data?: Record<string, unknown>;
  createdAt: Date;

  constructor(
    type: string,
    userId: string,
    data?: Record<string, unknown>,
  ) {
    this.type = type;
    this.userId = userId;
    this.data = data;
    this.createdAt = new Date();
  }
}

@Injectable()
export class NotificationQueueService {
  private readonly logger = new Logger(NotificationQueueService.name);

  constructor(
    @InjectQueue(NOTIFICATION_QUEUE) private readonly notificationQueue: Queue,
  ) {}

  async sendNotification(event: NotificationEventDto): Promise<void> {
    try {
      await this.notificationQueue.add(event.type, event, {
        priority: this.getPriority(event.type),
      });
      this.logger.debug(`Notification queued: ${event.type} for user ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to queue notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  async sendMessage(event: NotificationEventDto): Promise<void> {
    // Messages have higher priority
    try {
      await this.notificationQueue.add('NEW_MESSAGE', event, {
        priority: 1,
      });
      this.logger.debug(`Message notification queued for user ${event.userId}`);
    } catch (error) {
      this.logger.error(`Failed to queue message notification: ${error.message}`, error.stack);
      throw error;
    }
  }

  private getPriority(type: string): number {
    // Lower number = higher priority
    const priorities: Record<string, number> = {
      NEW_MESSAGE: 1,
      CONNECTION_REQUEST: 2,
      CONNECTION_ACCEPTED: 2,
      NEW_FOLLOWER: 3,
      POST_LIKED: 4,
      NEW_COMMENT: 4,
      POST_REPOSTED: 4,
      MENTION: 3,
      STORY_VIEW: 5,
    };
    return priorities[type] || 5;
  }

  // Get queue stats (useful for monitoring)
  async getQueueStats() {
    const [waiting, active, completed, failed] = await Promise.all([
      this.notificationQueue.getWaitingCount(),
      this.notificationQueue.getActiveCount(),
      this.notificationQueue.getCompletedCount(),
      this.notificationQueue.getFailedCount(),
    ]);

    return { waiting, active, completed, failed };
  }
}

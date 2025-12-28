export enum NotificationType {
  CONNECTION_REQUEST = 'CONNECTION_REQUEST',
  CONNECTION_ACCEPTED = 'CONNECTION_ACCEPTED',
  NEW_MESSAGE = 'NEW_MESSAGE',
  NEW_FOLLOWER = 'NEW_FOLLOWER',
  POST_LIKE = 'POST_LIKE',
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

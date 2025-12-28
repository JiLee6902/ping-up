import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
}

@Entity('messages')
export class Message extends BaseEntity {
  @Column({ name: 'from_user_id' })
  @Index()
  fromUserId: string;

  @Column({ name: 'to_user_id' })
  @Index()
  toUserId: string;

  @Column({ type: 'text', nullable: true })
  text?: string;

  @Column({
    name: 'message_type',
    type: 'enum',
    enum: MessageType,
    default: MessageType.TEXT,
  })
  messageType: MessageType;

  @Column({ name: 'media_url', nullable: true })
  mediaUrl?: string;

  @Column({ default: false })
  seen: boolean;

  @Column({ name: 'seen_at', type: 'timestamp', nullable: true })
  seenAt?: Date;

  @ManyToOne(() => User, (user) => user.sentMessages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'from_user_id' })
  fromUser: User;

  @ManyToOne(() => User, (user) => user.receivedMessages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'to_user_id' })
  toUser: User;
}

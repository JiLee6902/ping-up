import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum ChatEventType {
  NICKNAME_CHANGED = 'nickname_changed',
  BACKGROUND_CHANGED = 'background_changed',
  MESSAGE_COLOR_CHANGED = 'message_color_changed',
}

@Entity('chat_events')
export class ChatEvent extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'chat_with_user_id' })
  @Index()
  chatWithUserId: string;

  @Column({ name: 'event_type', type: 'varchar' })
  eventType: ChatEventType;

  @Column({ name: 'event_data', type: 'text', nullable: true })
  eventData?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_with_user_id' })
  chatWithUser: User;
}

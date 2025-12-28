import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('chat_settings')
@Unique(['userId', 'chatWithUserId'])
export class ChatSettings extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'chat_with_user_id' })
  @Index()
  chatWithUserId: string;

  @Column({ nullable: true })
  nickname?: string;

  @Column({ name: 'is_muted', default: false })
  isMuted: boolean;

  @Column({ name: 'is_blocked', default: false })
  isBlocked: boolean;

  @Column({ name: 'background_color', nullable: true })
  backgroundColor?: string;

  @Column({ name: 'background_image', nullable: true })
  backgroundImage?: string;

  @Column({ name: 'message_color', nullable: true })
  messageColor?: string;

  @Column({ name: 'deleted_at', type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_with_user_id' })
  chatWithUser: User;
}

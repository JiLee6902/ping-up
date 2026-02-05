import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Message } from './message.entity';
import { User } from './user.entity';

@Entity('message_deletions')
@Unique(['messageId', 'userId'])
export class MessageDeletion extends BaseEntity {
  @Column({ name: 'message_id', type: 'uuid' })
  @Index()
  messageId: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => Message, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'message_id' })
  message: Message;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

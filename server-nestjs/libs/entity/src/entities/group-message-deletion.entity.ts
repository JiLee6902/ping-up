import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { GroupMessage } from './group-message.entity';
import { User } from './user.entity';

@Entity('group_message_deletions')
@Unique(['groupMessageId', 'userId'])
export class GroupMessageDeletion extends BaseEntity {
  @Column({ name: 'group_message_id', type: 'uuid' })
  @Index()
  groupMessageId: string;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @ManyToOne(() => GroupMessage, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_message_id' })
  groupMessage: GroupMessage;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

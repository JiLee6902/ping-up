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
import { GroupChat } from './group-chat.entity';

export enum GroupRole {
  ADMIN = 'admin',
  MEMBER = 'member',
}

@Entity('group_members')
@Unique(['groupChatId', 'userId'])
export class GroupMember extends BaseEntity {
  @Column({ name: 'group_chat_id', type: 'uuid' })
  @Index()
  groupChatId: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({
    type: 'enum',
    enum: GroupRole,
    default: GroupRole.MEMBER,
  })
  role: GroupRole;

  @Column({ name: 'joined_at', type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  joinedAt: Date;

  @Column({ name: 'last_read_at', type: 'timestamp', nullable: true })
  lastReadAt?: Date;

  @Column({ name: 'is_muted', default: false })
  isMuted: boolean;

  @ManyToOne(() => GroupChat, (groupChat) => groupChat.members, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_chat_id' })
  groupChat: GroupChat;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

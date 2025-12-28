import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { GroupMember } from './group-member.entity';
import { GroupMessage } from './group-message.entity';

@Entity('group_chats')
export class GroupChat extends BaseEntity {
  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'avatar_url', nullable: true })
  avatarUrl?: string;

  @Column({ name: 'creator_id', type: 'uuid' })
  @Index()
  creatorId: string;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'creator_id' })
  creator: User;

  @OneToMany(() => GroupMember, (member) => member.groupChat)
  members: GroupMember[];

  @OneToMany(() => GroupMessage, (message) => message.groupChat)
  messages: GroupMessage[];

  @Column({ name: 'member_count', default: 1 })
  memberCount: number;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;
}

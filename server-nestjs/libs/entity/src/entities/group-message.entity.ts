import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { GroupChat } from './group-chat.entity';

export enum GroupMessageType {
  TEXT = 'text',
  IMAGE = 'image',
  SYSTEM = 'system', // For system messages like "User joined", "User left"
}

@Entity('group_messages')
export class GroupMessage extends BaseEntity {
  @Column({ name: 'group_chat_id', type: 'uuid' })
  @Index()
  groupChatId: string;

  @Column({ name: 'sender_id', type: 'uuid', nullable: true })
  @Index()
  senderId?: string;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({
    name: 'message_type',
    type: 'enum',
    enum: GroupMessageType,
    default: GroupMessageType.TEXT,
  })
  messageType: GroupMessageType;

  @Column({ name: 'media_url', nullable: true })
  mediaUrl?: string;

  @ManyToOne(() => GroupChat, (groupChat) => groupChat.messages, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'group_chat_id' })
  groupChat: GroupChat;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'sender_id' })
  sender?: User;
}

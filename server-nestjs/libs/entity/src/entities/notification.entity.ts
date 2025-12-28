import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';
import { NotificationType } from '@app/enum';

@Entity('notifications')
@Index(['recipientId', 'isRead', 'createdAt'])
export class Notification extends BaseEntity {
  @Column({ name: 'recipient_id', type: 'uuid' })
  @Index()
  recipientId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipient_id' })
  recipient: User;

  @Column({ name: 'actor_id', type: 'uuid' })
  actorId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'actor_id' })
  actor: User;

  @Column({
    name: 'type',
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({ name: 'post_id', type: 'uuid', nullable: true })
  postId?: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'post_id' })
  post?: Post;

  @Column({ name: 'comment_id', type: 'uuid', nullable: true })
  commentId?: string;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'comment_id' })
  comment?: Comment;

  @Column({ name: 'is_read', default: false })
  @Index()
  isRead: boolean;

  @Column({ name: 'message', nullable: true })
  message?: string;
}

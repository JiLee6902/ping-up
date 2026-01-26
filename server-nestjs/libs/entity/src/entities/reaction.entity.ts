import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Post } from './post.entity';
import { ReactionType } from '@app/enum';

@Entity('reactions')
@Unique(['userId', 'postId'])
@Index(['postId', 'reactionType'])
export class Reaction extends BaseEntity {
  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'post_id', type: 'uuid' })
  @Index()
  postId: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({
    name: 'reaction_type',
    type: 'enum',
    enum: ReactionType,
  })
  reactionType: ReactionType;
}

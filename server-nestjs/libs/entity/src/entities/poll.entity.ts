import {
  Entity,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Post } from './post.entity';
import { PollVote } from './poll-vote.entity';

@Entity('polls')
export class Poll extends BaseEntity {
  @Column({ name: 'post_id', type: 'uuid' })
  @Index()
  postId: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post: Post;

  @Column({ type: 'text' })
  question: string;

  @Column({ type: 'jsonb' })
  options: PollOption[];

  @Column({ name: 'ends_at', type: 'timestamptz', nullable: true })
  endsAt?: Date;

  @Column({ name: 'is_multiple_choice', default: false })
  isMultipleChoice: boolean;

  @Column({ name: 'total_votes', default: 0 })
  totalVotes: number;

  @OneToMany(() => PollVote, (vote) => vote.poll)
  votes: PollVote[];
}

export interface PollOption {
  id: number;
  text: string;
  votes: number;
}

import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Poll } from './poll.entity';
import { User } from './user.entity';

@Entity('poll_votes')
@Unique(['pollId', 'userId', 'optionId'])
@Index(['pollId', 'userId'])
export class PollVote extends BaseEntity {
  @Column({ name: 'poll_id', type: 'uuid' })
  pollId: string;

  @ManyToOne(() => Poll, (poll) => poll.votes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'poll_id' })
  poll: Poll;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'option_id' })
  optionId: number;
}

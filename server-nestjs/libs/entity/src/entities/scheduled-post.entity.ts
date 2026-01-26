import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('scheduled_posts')
export class ScheduledPost extends BaseEntity {
  @Column('uuid', { name: 'user_id' })
  @Index()
  userId: string;

  @Column('text')
  content: string;

  @Column('simple-array', { nullable: true })
  images?: string[];

  @Column({ type: 'timestamptz', name: 'scheduled_at' })
  @Index()
  scheduledAt: Date;

  @Column({ name: 'is_published', default: false })
  isPublished: boolean;
}

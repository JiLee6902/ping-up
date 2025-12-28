import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum MediaType {
  TEXT = 'text',
  IMAGE = 'image',
  VIDEO = 'video',
}

@Entity('stories')
export class Story extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ name: 'media_url', nullable: true })
  mediaUrl?: string;

  @Column({
    name: 'media_type',
    type: 'enum',
    enum: MediaType,
    default: MediaType.TEXT,
  })
  mediaType: MediaType;

  @Column({ name: 'background_color', nullable: true })
  backgroundColor?: string;

  @Column({ name: 'expires_at' })
  @Index()
  expiresAt: Date;

  @ManyToOne(() => User, (user) => user.stories, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'story_views',
    joinColumn: { name: 'story_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  views: User[];

  @Column({ name: 'views_count', default: 0 })
  viewsCount: number;
}

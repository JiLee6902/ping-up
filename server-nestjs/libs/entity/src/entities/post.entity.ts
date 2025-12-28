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

export enum PostType {
  TEXT = 'text',
  IMAGE = 'image',
  TEXT_WITH_IMAGE = 'text_with_image',
  REPOST = 'repost',
}

@Entity('posts')
export class Post extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ type: 'text', nullable: true })
  content?: string;

  @Column({ name: 'image_urls', type: 'simple-array', nullable: true })
  imageUrls?: string[];

  @Column({
    name: 'post_type',
    type: 'enum',
    enum: PostType,
    default: PostType.TEXT,
  })
  postType: PostType;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'post_likes',
    joinColumn: { name: 'post_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  likes: User[];

  @Column({ name: 'likes_count', default: 0 })
  likesCount: number;

  @Column({ name: 'original_post_id', nullable: true })
  @Index()
  originalPostId?: string;

  @ManyToOne(() => Post, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'original_post_id' })
  originalPost?: Post;

  @Column({ name: 'shares_count', default: 0 })
  sharesCount: number;

  @Column({ name: 'comments_count', default: 0 })
  commentsCount: number;

  @Column({ name: 'location', nullable: true })
  location?: string;

  @Column({ name: 'location_lat', type: 'decimal', precision: 10, scale: 8, nullable: true })
  locationLat?: number;

  @Column({ name: 'location_lng', type: 'decimal', precision: 11, scale: 8, nullable: true })
  locationLng?: number;

  @Column({ name: 'video_url', nullable: true })
  videoUrl?: string;
}

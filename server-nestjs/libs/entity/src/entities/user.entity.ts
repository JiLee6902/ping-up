import {
  Entity,
  Column,
  OneToMany,
  ManyToMany,
  JoinTable,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { Post } from './post.entity';
import { Story } from './story.entity';
import { Message } from './message.entity';
import { Connection } from './connection.entity';
import { UserRefreshToken } from './user-refresh-token.entity';
import { SubscriptionTier } from '@app/enum';

@Entity('users')
export class User extends BaseEntity {
  @Column({ unique: true })
  @Index()
  email: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({ unique: true })
  @Index()
  username: string;

  @Column()
  password: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ name: 'profile_picture', nullable: true })
  profilePicture?: string;

  @Column({ name: 'cover_photo', nullable: true })
  coverPhoto?: string;

  @Column({ name: 'is_private', default: false })
  isPrivate: boolean;

  @Column({ name: 'is_bot', default: false })
  isBot: boolean;

  @ManyToMany(() => User, (user) => user.following)
  @JoinTable({
    name: 'user_followers',
    joinColumn: { name: 'follower_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'following_id', referencedColumnName: 'id' },
  })
  followers: User[];

  @ManyToMany(() => User, (user) => user.followers)
  following: User[];

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Story, (story) => story.user)
  stories: Story[];

  @OneToMany(() => Message, (message) => message.fromUser)
  sentMessages: Message[];

  @OneToMany(() => Message, (message) => message.toUser)
  receivedMessages: Message[];

  @OneToMany(() => Connection, (connection) => connection.fromUser)
  sentConnections: Connection[];

  @OneToMany(() => Connection, (connection) => connection.toUser)
  receivedConnections: Connection[];

  @OneToMany(() => UserRefreshToken, (token) => token.user)
  refreshTokens: UserRefreshToken[];

  @Column({ name: 'last_activity_at', nullable: true })
  lastActivityAt?: Date;

  // Two-Factor Authentication
  @Column({ name: 'two_factor_secret', nullable: true })
  twoFactorSecret?: string;

  @Column({ name: 'two_factor_enabled', default: false })
  twoFactorEnabled: boolean;

  @Column({ name: 'two_factor_backup_codes', type: 'simple-array', nullable: true })
  twoFactorBackupCodes?: string[];

  // Subscription fields
  @Column({
    type: 'enum',
    enum: SubscriptionTier,
    name: 'subscription_tier',
    default: SubscriptionTier.FREE
  })
  subscriptionTier: SubscriptionTier;

  @Column({ name: 'is_verified', default: false })
  isVerified: boolean;

  @Column({ name: 'profile_theme', nullable: true })
  profileTheme?: string;

  @Column({ name: 'pinned_post_ids', type: 'simple-array', nullable: true })
  pinnedPostIds?: string[];
}

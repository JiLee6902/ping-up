import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Post } from './post.entity';
import { Comment } from './comment.entity';

export enum ReportType {
  POST = 'post',
  USER = 'user',
  COMMENT = 'comment',
}

export enum ReportReason {
  SPAM = 'spam',
  HARASSMENT = 'harassment',
  HATE_SPEECH = 'hate_speech',
  VIOLENCE = 'violence',
  NUDITY = 'nudity',
  FALSE_INFORMATION = 'false_information',
  SCAM = 'scam',
  OTHER = 'other',
}

export enum ReportStatus {
  PENDING = 'pending',
  REVIEWED = 'reviewed',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('reports')
@Index(['reporterId', 'createdAt'])
export class Report extends BaseEntity {
  @Column({ name: 'reporter_id', type: 'uuid' })
  @Index()
  reporterId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reporter_id' })
  reporter: User;

  @Column({ name: 'report_type', type: 'enum', enum: ReportType })
  reportType: ReportType;

  @Column({ name: 'reason', type: 'enum', enum: ReportReason })
  reason: ReportReason;

  @Column({ name: 'description', nullable: true })
  description?: string;

  @Column({ name: 'status', type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  // Target user (for user reports)
  @Column({ name: 'reported_user_id', type: 'uuid', nullable: true })
  @Index()
  reportedUserId?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'reported_user_id' })
  reportedUser?: User;

  // Target post (for post reports)
  @Column({ name: 'reported_post_id', type: 'uuid', nullable: true })
  @Index()
  reportedPostId?: string;

  @ManyToOne(() => Post, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'reported_post_id' })
  reportedPost?: Post;

  // Target comment (for comment reports)
  @Column({ name: 'reported_comment_id', type: 'uuid', nullable: true })
  @Index()
  reportedCommentId?: string;

  @ManyToOne(() => Comment, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'reported_comment_id' })
  reportedComment?: Comment;
}

import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('seller_reviews')
@Unique(['reviewerId', 'sellerId'])
@Index(['sellerId', 'createdAt'])
export class SellerReview extends BaseEntity {
  @Column({ name: 'reviewer_id', type: 'uuid' })
  @Index()
  reviewerId: string;

  @Column({ name: 'seller_id', type: 'uuid' })
  @Index()
  sellerId: string;

  @Column({ type: 'int' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reviewer_id' })
  reviewer: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_id' })
  seller: User;
}

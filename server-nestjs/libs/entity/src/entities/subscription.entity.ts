import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { SubscriptionTier } from '@app/enum';

@Entity('subscriptions')
export class Subscription extends BaseEntity {
  @Column('uuid', { name: 'user_id', unique: true })
  @Index()
  userId: string;

  @Column({ type: 'enum', enum: SubscriptionTier, default: SubscriptionTier.FREE })
  tier: SubscriptionTier;

  @Column({ type: 'timestamptz', name: 'premium_expires_at', nullable: true })
  premiumExpiresAt?: Date;

  @Column('int', { name: 'total_premium_days', default: 0 })
  totalPremiumDays: number;
}

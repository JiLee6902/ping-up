import {
  Injectable,
  Logger,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  PaymentRepository,
  SUBSCRIPTION_PRICE,
} from '../repository/payment.repository';
import { Subscription, User } from '@app/entity';
import { TransactionType, SubscriptionTier } from '@app/enum';

@Injectable()
export class SubscriptionService {
  private readonly logger = new Logger(SubscriptionService.name);

  constructor(
    private readonly paymentRepo: PaymentRepository,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  async getStatus(userId: string): Promise<{
    subscription: Subscription;
    isPremium: boolean;
    daysRemaining: number | null;
  }> {
    const subscription = await this.paymentRepo.getOrCreateSubscription(userId);
    const now = new Date();
    const isPremium =
      subscription.tier === SubscriptionTier.PREMIUM &&
      subscription.premiumExpiresAt !== null &&
      subscription.premiumExpiresAt > now;

    let daysRemaining: number | null = null;
    if (isPremium && subscription.premiumExpiresAt) {
      daysRemaining = Math.ceil(
        (subscription.premiumExpiresAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
      );
    }

    return { subscription, isPremium, daysRemaining };
  }

  async purchasePremium(
    userId: string,
    plan: 'monthly' | 'yearly',
  ): Promise<{
    subscription: Subscription;
    coinsDeducted: number;
  }> {
    const price = SUBSCRIPTION_PRICE[plan];
    const days = plan === 'monthly' ? 30 : 365;

    // Check balance
    const balance = await this.paymentRepo.getWalletBalance(userId);
    if (balance < price) {
      throw new BadRequestException(
        `Insufficient balance. Required: ${price} coins, Available: ${balance} coins`,
      );
    }

    // Deduct coins
    const result = await this.paymentRepo.deductCoins(
      userId,
      price,
      TransactionType.PURCHASE,
      `Mua Premium ${plan} - ${days} ngay`,
    );

    if (!result) {
      throw new BadRequestException('Failed to deduct coins');
    }

    // Upgrade subscription
    const subscription = await this.paymentRepo.upgradeToPremium(userId, days);

    // Update user subscription tier
    await this.userRepo.update(userId, {
      subscriptionTier: SubscriptionTier.PREMIUM,
      isVerified: true, // Premium users get verified badge
    });

    this.logger.log(
      `User ${userId} purchased ${plan} premium, deducted ${price} coins`,
    );

    return { subscription, coinsDeducted: price };
  }

  getPlans() {
    return {
      monthly: {
        price: SUBSCRIPTION_PRICE.monthly,
        days: 30,
        description: 'Premium hang thang',
      },
      yearly: {
        price: SUBSCRIPTION_PRICE.yearly,
        days: 365,
        description: 'Premium hang nam (tiet kiem 17%)',
      },
    };
  }

  async checkPremiumAccess(userId: string): Promise<boolean> {
    const { isPremium } = await this.getStatus(userId);
    return isPremium;
  }

  async requirePremium(userId: string): Promise<void> {
    const isPremium = await this.checkPremiumAccess(userId);
    if (!isPremium) {
      throw new ForbiddenException('Premium subscription required');
    }
  }

  // Background job to downgrade expired subscriptions
  async handleExpiredSubscriptions(): Promise<number> {
    const count = await this.paymentRepo.checkAndDowngradeExpiredSubscriptions();

    if (count > 0) {
      // Update user table as well
      await this.userRepo
        .createQueryBuilder()
        .update(User)
        .set({
          subscriptionTier: SubscriptionTier.FREE,
          isVerified: false,
        })
        .where(
          'id IN (SELECT user_id FROM subscriptions WHERE tier = :tier AND premium_expires_at < :now)',
          { tier: SubscriptionTier.FREE, now: new Date() },
        )
        .execute();

      this.logger.log(`Downgraded ${count} expired subscriptions`);
    }

    return count;
  }
}

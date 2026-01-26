import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, EntityManager } from 'typeorm';
import {
  UserWallet,
  CoinTransaction,
  PaymentOrder,
  Subscription,
} from '@app/entity';
import { TransactionType, PaymentStatus, SubscriptionTier } from '@app/enum';

export interface CoinPackage {
  id: string;
  vnd: number;
  coins: number;
  bonus: number;
}

export const COIN_PACKAGES: CoinPackage[] = [
  { id: 'pack_10k', vnd: 10000, coins: 100, bonus: 0 },
  { id: 'pack_50k', vnd: 50000, coins: 550, bonus: 50 },
  { id: 'pack_100k', vnd: 100000, coins: 1200, bonus: 200 },
  { id: 'pack_500k', vnd: 500000, coins: 6500, bonus: 1500 },
];

export const SUBSCRIPTION_PRICE = {
  monthly: 500,
  yearly: 5000,
};

@Injectable()
export class PaymentRepository {
  constructor(
    @InjectRepository(UserWallet)
    private readonly walletRepo: Repository<UserWallet>,
    @InjectRepository(CoinTransaction)
    private readonly transactionRepo: Repository<CoinTransaction>,
    @InjectRepository(PaymentOrder)
    private readonly orderRepo: Repository<PaymentOrder>,
    @InjectRepository(Subscription)
    private readonly subscriptionRepo: Repository<Subscription>,
    private readonly dataSource: DataSource,
  ) {}

  // Wallet operations
  async getOrCreateWallet(userId: string): Promise<UserWallet> {
    let wallet = await this.walletRepo.findOne({ where: { userId } });
    if (!wallet) {
      wallet = this.walletRepo.create({ userId, balance: 0 });
      await this.walletRepo.save(wallet);
    }
    return wallet;
  }

  async getWalletBalance(userId: string): Promise<number> {
    const wallet = await this.getOrCreateWallet(userId);
    return wallet.balance;
  }

  async addCoins(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    referenceId?: string,
  ): Promise<{ wallet: UserWallet; transaction: CoinTransaction }> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      // Lock wallet row for update
      const wallet = await manager.findOne(UserWallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet) {
        // Create wallet if not exists
        const newWallet = manager.create(UserWallet, {
          userId,
          balance: amount,
          totalTopUp: type === TransactionType.TOP_UP ? amount : 0,
        });
        const savedWallet = await manager.save(UserWallet, newWallet);

        const transaction = manager.create(CoinTransaction, {
          userId,
          type,
          amount,
          balanceAfter: amount,
          description,
          referenceId,
        });
        const savedTransaction = await manager.save(CoinTransaction, transaction);

        return { wallet: savedWallet, transaction: savedTransaction };
      }

      // Update existing wallet
      wallet.balance += amount;
      if (type === TransactionType.TOP_UP) {
        wallet.totalTopUp += amount;
      }
      const savedWallet = await manager.save(UserWallet, wallet);

      // Create transaction record
      const transaction = manager.create(CoinTransaction, {
        userId,
        type,
        amount,
        balanceAfter: wallet.balance,
        description,
        referenceId,
      });
      const savedTransaction = await manager.save(CoinTransaction, transaction);

      return { wallet: savedWallet, transaction: savedTransaction };
    });
  }

  async deductCoins(
    userId: string,
    amount: number,
    type: TransactionType,
    description: string,
    referenceId?: string,
  ): Promise<{ wallet: UserWallet; transaction: CoinTransaction } | null> {
    return this.dataSource.transaction(async (manager: EntityManager) => {
      // Lock wallet row for update
      const wallet = await manager.findOne(UserWallet, {
        where: { userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!wallet || wallet.balance < amount) {
        return null; // Insufficient balance
      }

      wallet.balance -= amount;
      wallet.totalSpent += amount;
      const savedWallet = await manager.save(UserWallet, wallet);

      const transaction = manager.create(CoinTransaction, {
        userId,
        type,
        amount: -amount,
        balanceAfter: wallet.balance,
        description,
        referenceId,
      });
      const savedTransaction = await manager.save(CoinTransaction, transaction);

      return { wallet: savedWallet, transaction: savedTransaction };
    });
  }

  async getTransactions(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<CoinTransaction[]> {
    return this.transactionRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  // Order operations
  async createOrder(
    userId: string,
    orderCode: string,
    amount: number,
    coinAmount: number,
  ): Promise<PaymentOrder> {
    const order = this.orderRepo.create({
      userId,
      orderCode,
      amount,
      coinAmount,
      status: PaymentStatus.PENDING,
    });
    return this.orderRepo.save(order);
  }

  async getOrderByCode(orderCode: string): Promise<PaymentOrder | null> {
    return this.orderRepo.findOne({ where: { orderCode } });
  }

  async updateOrderStatus(
    orderCode: string,
    status: PaymentStatus,
    vnpayData?: {
      transactionNo?: string;
      responseCode?: string;
      rawData?: any;
    },
  ): Promise<PaymentOrder | null> {
    const order = await this.orderRepo.findOne({ where: { orderCode } });
    if (!order) return null;

    order.status = status;
    if (vnpayData) {
      order.vnpayTransactionNo = vnpayData.transactionNo;
      order.vnpayResponseCode = vnpayData.responseCode;
      order.vnpayData = vnpayData.rawData;
    }
    return this.orderRepo.save(order);
  }

  async getOrdersByUser(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<PaymentOrder[]> {
    return this.orderRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  // Subscription operations
  async getOrCreateSubscription(userId: string): Promise<Subscription> {
    let subscription = await this.subscriptionRepo.findOne({ where: { userId } });
    if (!subscription) {
      subscription = this.subscriptionRepo.create({
        userId,
        tier: SubscriptionTier.FREE,
      });
      await this.subscriptionRepo.save(subscription);
    }
    return subscription;
  }

  async upgradeToPremium(userId: string, days: number): Promise<Subscription> {
    const subscription = await this.getOrCreateSubscription(userId);

    const now = new Date();
    let expiresAt: Date;

    if (subscription.premiumExpiresAt && subscription.premiumExpiresAt > now) {
      // Extend existing premium
      expiresAt = new Date(subscription.premiumExpiresAt.getTime() + days * 24 * 60 * 60 * 1000);
    } else {
      // New premium
      expiresAt = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    }

    subscription.tier = SubscriptionTier.PREMIUM;
    subscription.premiumExpiresAt = expiresAt;
    subscription.totalPremiumDays += days;

    return this.subscriptionRepo.save(subscription);
  }

  async checkAndDowngradeExpiredSubscriptions(): Promise<number> {
    const result = await this.subscriptionRepo
      .createQueryBuilder()
      .update(Subscription)
      .set({ tier: SubscriptionTier.FREE })
      .where('tier = :tier', { tier: SubscriptionTier.PREMIUM })
      .andWhere('premium_expires_at < :now', { now: new Date() })
      .execute();

    return result.affected || 0;
  }
}

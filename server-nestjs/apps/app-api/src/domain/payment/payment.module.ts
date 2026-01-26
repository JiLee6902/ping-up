import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  UserWallet,
  CoinTransaction,
  PaymentOrder,
  Subscription,
  User,
} from '@app/entity';

import { PaymentController } from './controller/payment.controller';
import { WalletController } from './controller/wallet.controller';
import { SubscriptionController } from './controller/subscription.controller';

import { PaymentService } from './service/payment.service';
import { WalletService } from './service/wallet.service';
import { SubscriptionService } from './service/subscription.service';

import { PaymentRepository } from './repository/payment.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserWallet,
      CoinTransaction,
      PaymentOrder,
      Subscription,
      User,
    ]),
  ],
  controllers: [
    PaymentController,
    WalletController,
    SubscriptionController,
  ],
  providers: [
    PaymentService,
    WalletService,
    SubscriptionService,
    PaymentRepository,
  ],
  exports: [
    PaymentService,
    WalletService,
    SubscriptionService,
    PaymentRepository,
  ],
})
export class PaymentModule {}

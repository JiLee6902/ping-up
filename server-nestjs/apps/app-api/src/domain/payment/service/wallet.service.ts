import { Injectable, Logger } from '@nestjs/common';
import { PaymentRepository, COIN_PACKAGES } from '../repository/payment.repository';
import { UserWallet, CoinTransaction } from '@app/entity';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(private readonly paymentRepo: PaymentRepository) {}

  async getBalance(userId: string): Promise<{ balance: number; wallet: UserWallet }> {
    const wallet = await this.paymentRepo.getOrCreateWallet(userId);
    return { balance: wallet.balance, wallet };
  }

  async getTransactions(
    userId: string,
    limit = 20,
    offset = 0,
  ): Promise<CoinTransaction[]> {
    return this.paymentRepo.getTransactions(userId, limit, offset);
  }

  getCoinPackages() {
    return COIN_PACKAGES;
  }
}

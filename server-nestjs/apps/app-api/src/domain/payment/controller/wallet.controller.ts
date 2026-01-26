import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, User as CurrentUser } from '@app/shared-libs';
import { WalletService } from '../service/wallet.service';

interface CurrentUserPayload {
  id: string;
  email: string;
  username: string;
}

@Controller('wallet')
@UseGuards(JwtAuthGuard)
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('balance')
  async getBalance(@CurrentUser() user: CurrentUserPayload) {
    return this.walletService.getBalance(user.id);
  }

  @Get('transactions')
  async getTransactions(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.walletService.getTransactions(user.id, limit, offset);
  }
}

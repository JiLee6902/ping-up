import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  Req,
  UseGuards,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { JwtAuthGuard, Public, User as CurrentUser } from '@app/shared-libs';
import { PaymentService } from '../service/payment.service';
import { WalletService } from '../service/wallet.service';
import { CreateOrderDto } from '../dto';
import { VnpayReturnData } from '@app/external-infra/vnpay';
import { ConfigService } from '@nestjs/config';

interface CurrentUserPayload {
  id: string;
  email: string;
  username: string;
}

@Controller('payment')
export class PaymentController {
  constructor(
    private readonly paymentService: PaymentService,
    private readonly walletService: WalletService,
    private readonly configService: ConfigService,
  ) {}

  @Get('packages')
  @UseGuards(JwtAuthGuard)
  async getPackages() {
    return this.walletService.getCoinPackages();
  }

  @Post('create-order')
  @UseGuards(JwtAuthGuard)
  async createOrder(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateOrderDto,
    @Req() req: Request,
  ) {
    const ipAddr =
      req.headers['x-forwarded-for']?.toString().split(',')[0] ||
      req.socket.remoteAddress ||
      '127.0.0.1';

    return this.paymentService.createPaymentOrder(user.id, dto.packageId, ipAddr);
  }

  @Public()
  @Get('return')
  async handleReturn(
    @Query() query: VnpayReturnData,
    @Res() res: Response,
  ) {
    const result = await this.paymentService.handleVnpayReturn(query);

    // Redirect to frontend payment result page
    const frontendUrl = this.configService.get<string>('FRONTEND_URL', 'http://localhost:5173');
    const redirectUrl = `${frontendUrl}/payment/result?success=${result.success}&message=${encodeURIComponent(result.message)}&orderId=${query.vnp_TxnRef}`;

    return res.redirect(redirectUrl);
  }

  @Public()
  @Post('ipn')
  async handleIpn(@Body() body: VnpayReturnData) {
    return this.paymentService.handleVnpayIpn(body);
  }

  @Get('orders')
  @UseGuards(JwtAuthGuard)
  async getOrders(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.paymentService.getOrders(user.id, limit, offset);
  }
}

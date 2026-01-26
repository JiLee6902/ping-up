import {
  Injectable,
  Logger,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import {
  PaymentRepository,
  COIN_PACKAGES,
  CoinPackage,
} from '../repository/payment.repository';
import { VnpayService, VnpayReturnData } from '@app/external-infra/vnpay';
import { PaymentStatus, TransactionType } from '@app/enum';
import { PaymentOrder } from '@app/entity';

@Injectable()
export class PaymentService {
  private readonly logger = new Logger(PaymentService.name);

  constructor(
    private readonly paymentRepo: PaymentRepository,
    private readonly vnpayService: VnpayService,
  ) {}

  async createPaymentOrder(
    userId: string,
    packageId: string,
    ipAddr: string,
  ): Promise<{ order: PaymentOrder; paymentUrl: string }> {
    const coinPackage = this.findPackage(packageId);
    if (!coinPackage) {
      throw new BadRequestException('Invalid package ID');
    }

    const orderCode = `PU${Date.now()}${uuidv4().slice(0, 8)}`.toUpperCase();
    const totalCoins = coinPackage.coins + coinPackage.bonus;

    const order = await this.paymentRepo.createOrder(
      userId,
      orderCode,
      coinPackage.vnd,
      totalCoins,
    );

    const paymentUrl = this.vnpayService.createPaymentUrl({
      orderId: orderCode,
      amount: coinPackage.vnd,
      orderInfo: `Nap ${totalCoins} coins vao PingUp`,
      ipAddr,
    });

    this.logger.log(`Created payment order: ${orderCode} for user: ${userId}`);

    return { order, paymentUrl };
  }

  async handleVnpayReturn(query: VnpayReturnData): Promise<{
    success: boolean;
    message: string;
    order?: PaymentOrder;
  }> {
    const result = this.vnpayService.verifyReturnUrl(query);

    if (!result.isValid) {
      this.logger.warn(`Invalid VNPAY signature for order: ${result.orderId}`);
      return { success: false, message: 'Invalid signature' };
    }

    const order = await this.paymentRepo.getOrderByCode(result.orderId);
    if (!order) {
      this.logger.warn(`Order not found: ${result.orderId}`);
      return { success: false, message: 'Order not found' };
    }

    // Check if already processed
    if (order.status !== PaymentStatus.PENDING) {
      return {
        success: order.status === PaymentStatus.SUCCESS,
        message: order.status === PaymentStatus.SUCCESS
          ? 'Payment already processed'
          : 'Payment failed',
        order,
      };
    }

    const isSuccess = this.vnpayService.isPaymentSuccess(result.responseCode);

    if (isSuccess) {
      // Update order status
      await this.paymentRepo.updateOrderStatus(result.orderId, PaymentStatus.SUCCESS, {
        transactionNo: result.transactionNo,
        responseCode: result.responseCode,
        rawData: result.rawData,
      });

      // Credit coins to user
      await this.paymentRepo.addCoins(
        order.userId,
        order.coinAmount,
        TransactionType.TOP_UP,
        `Nap ${order.coinAmount} coins qua VNPAY`,
        order.id,
      );

      this.logger.log(`Payment successful: ${result.orderId}, credited ${order.coinAmount} coins`);

      return {
        success: true,
        message: result.message,
        order: { ...order, status: PaymentStatus.SUCCESS },
      };
    } else {
      await this.paymentRepo.updateOrderStatus(result.orderId, PaymentStatus.FAILED, {
        transactionNo: result.transactionNo,
        responseCode: result.responseCode,
        rawData: result.rawData,
      });

      this.logger.log(`Payment failed: ${result.orderId}, code: ${result.responseCode}`);

      return {
        success: false,
        message: result.message,
        order: { ...order, status: PaymentStatus.FAILED },
      };
    }
  }

  async handleVnpayIpn(body: VnpayReturnData): Promise<{
    RspCode: string;
    Message: string;
  }> {
    const result = this.vnpayService.verifyIpnCall(body);

    if (!result.isValid) {
      return { RspCode: '97', Message: 'Invalid signature' };
    }

    const order = await this.paymentRepo.getOrderByCode(result.orderId);
    if (!order) {
      return { RspCode: '01', Message: 'Order not found' };
    }

    // Check if already processed
    if (order.status !== PaymentStatus.PENDING) {
      return { RspCode: '02', Message: 'Order already confirmed' };
    }

    // Verify amount
    if (order.amount !== result.amount) {
      return { RspCode: '04', Message: 'Invalid amount' };
    }

    const isSuccess = this.vnpayService.isPaymentSuccess(result.responseCode);

    if (isSuccess) {
      await this.paymentRepo.updateOrderStatus(result.orderId, PaymentStatus.SUCCESS, {
        transactionNo: result.transactionNo,
        responseCode: result.responseCode,
        rawData: result.rawData,
      });

      await this.paymentRepo.addCoins(
        order.userId,
        order.coinAmount,
        TransactionType.TOP_UP,
        `Nap ${order.coinAmount} coins qua VNPAY`,
        order.id,
      );

      return { RspCode: '00', Message: 'Confirm Success' };
    } else {
      await this.paymentRepo.updateOrderStatus(result.orderId, PaymentStatus.FAILED, {
        transactionNo: result.transactionNo,
        responseCode: result.responseCode,
        rawData: result.rawData,
      });

      return { RspCode: '00', Message: 'Confirm Success' };
    }
  }

  async getOrders(userId: string, limit = 20, offset = 0): Promise<PaymentOrder[]> {
    return this.paymentRepo.getOrdersByUser(userId, limit, offset);
  }

  private findPackage(packageId: string): CoinPackage | undefined {
    return COIN_PACKAGES.find((p) => p.id === packageId);
  }
}

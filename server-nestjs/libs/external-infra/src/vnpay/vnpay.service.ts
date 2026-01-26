import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';
import * as querystring from 'qs';

export interface VnpayPaymentParams {
  orderId: string;
  amount: number;
  orderInfo: string;
  ipAddr: string;
  returnUrl?: string;
}

export interface VnpayReturnData {
  vnp_Amount: string;
  vnp_BankCode: string;
  vnp_BankTranNo: string;
  vnp_CardType: string;
  vnp_OrderInfo: string;
  vnp_PayDate: string;
  vnp_ResponseCode: string;
  vnp_TmnCode: string;
  vnp_TransactionNo: string;
  vnp_TransactionStatus: string;
  vnp_TxnRef: string;
  vnp_SecureHash: string;
}

export interface VnpayVerifyResult {
  isValid: boolean;
  orderId: string;
  amount: number;
  responseCode: string;
  transactionNo: string;
  message: string;
  rawData: VnpayReturnData;
}

@Injectable()
export class VnpayService {
  private readonly logger = new Logger(VnpayService.name);
  private readonly tmnCode: string;
  private readonly hashSecret: string;
  private readonly vnpUrl: string;
  private readonly returnUrl: string;

  constructor(private readonly configService: ConfigService) {
    this.tmnCode = this.configService.get<string>('VNPAY_TMN_CODE', '');
    this.hashSecret = this.configService.get<string>('VNPAY_HASH_SECRET', '');
    this.vnpUrl = this.configService.get<string>(
      'VNPAY_URL',
      'https://sandbox.vnpayment.vn/paymentv2/vpcpay.html',
    );
    this.returnUrl = this.configService.get<string>(
      'VNPAY_RETURN_URL',
      'http://localhost:3000/payment/result',
    );
  }

  createPaymentUrl(params: VnpayPaymentParams): string {
    const date = new Date();
    const createDate = this.formatDate(date);
    const expireDate = this.formatDate(new Date(date.getTime() + 15 * 60 * 1000));

    const vnpParams: Record<string, string | number> = {
      vnp_Version: '2.1.0',
      vnp_Command: 'pay',
      vnp_TmnCode: this.tmnCode,
      vnp_Locale: 'vn',
      vnp_CurrCode: 'VND',
      vnp_TxnRef: params.orderId,
      vnp_OrderInfo: params.orderInfo,
      vnp_OrderType: 'other',
      vnp_Amount: params.amount * 100, // VNPay requires amount in smallest currency unit (x100)
      vnp_ReturnUrl: params.returnUrl || this.returnUrl,
      vnp_IpAddr: params.ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    };

    // Sort params alphabetically
    const sortedParams = this.sortObject(vnpParams);

    // Create signature
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    sortedParams['vnp_SecureHash'] = signed;

    const paymentUrl = `${this.vnpUrl}?${querystring.stringify(sortedParams, { encode: false })}`;

    this.logger.debug(`Created VNPAY payment URL for order: ${params.orderId}`);

    return paymentUrl;
  }

  verifyReturnUrl(query: VnpayReturnData): VnpayVerifyResult {
    const secureHash = query.vnp_SecureHash;

    // Remove hash params for verification
    const verifyParams: Record<string, string> = { ...query };
    delete verifyParams['vnp_SecureHash'];
    delete verifyParams['vnp_SecureHashType'];

    // Sort and create signature
    const sortedParams = this.sortObject(verifyParams);
    const signData = querystring.stringify(sortedParams, { encode: false });
    const hmac = crypto.createHmac('sha512', this.hashSecret);
    const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest('hex');

    const isValid = secureHash === signed;

    if (!isValid) {
      this.logger.warn(`Invalid VNPAY signature for order: ${query.vnp_TxnRef}`);
    }

    return {
      isValid,
      orderId: query.vnp_TxnRef,
      amount: parseInt(query.vnp_Amount) / 100, // Convert back from smallest unit
      responseCode: query.vnp_ResponseCode,
      transactionNo: query.vnp_TransactionNo,
      message: this.getResponseMessage(query.vnp_ResponseCode),
      rawData: query,
    };
  }

  verifyIpnCall(body: VnpayReturnData): VnpayVerifyResult {
    // IPN verification is the same as return URL verification
    return this.verifyReturnUrl(body);
  }

  isPaymentSuccess(responseCode: string): boolean {
    return responseCode === '00';
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    return `${year}${month}${day}${hour}${minute}${second}`;
  }

  private sortObject(obj: Record<string, string | number>): Record<string, string | number> {
    const sorted: Record<string, string | number> = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sorted[key] = obj[key];
    }
    return sorted;
  }

  private getResponseMessage(code: string): string {
    const messages: Record<string, string> = {
      '00': 'Giao dich thanh cong',
      '07': 'Tru tien thanh cong. Giao dich bi nghi ngo (lien quan toi lua dao, giao dich bat thuong).',
      '09': 'Giao dich khong thanh cong do: The/Tai khoan chua dang ky dich vu InternetBanking.',
      '10': 'Giao dich khong thanh cong do: Khach hang xac thuc thong tin the/tai khoan khong dung qua 3 lan',
      '11': 'Giao dich khong thanh cong do: Da het han cho thanh toan. Xin quy khach thuc hien lai giao dich.',
      '12': 'Giao dich khong thanh cong do: The/Tai khoan cua khach hang bi khoa.',
      '13': 'Giao dich khong thanh cong do: Quy khach nhap sai mat khau xac thuc giao dich (OTP).',
      '24': 'Giao dich khong thanh cong do: Khach hang huy giao dich',
      '51': 'Giao dich khong thanh cong do: Tai khoan cua quy khach khong du so du de thuc hien giao dich.',
      '65': 'Giao dich khong thanh cong do: Tai khoan cua Quy khach da vuot qua han muc giao dich trong ngay.',
      '75': 'Ngan hang thanh toan dang bao tri.',
      '79': 'Giao dich khong thanh cong do: KH nhap sai mat khau thanh toan qua so lan quy dinh.',
      '99': 'Cac loi khac (loi con lai, khong nam trong danh sach ma loi da liet ke)',
    };
    return messages[code] || 'Loi khong xac dinh';
  }
}

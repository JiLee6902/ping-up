import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { PaymentStatus } from '@app/enum';

@Entity('payment_orders')
export class PaymentOrder extends BaseEntity {
  @Column('uuid', { name: 'user_id' })
  @Index()
  userId: string;

  @Column({ name: 'order_code', unique: true })
  @Index()
  orderCode: string;

  @Column('int')
  amount: number;

  @Column('int', { name: 'coin_amount' })
  coinAmount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ name: 'vnpay_transaction_no', nullable: true })
  vnpayTransactionNo?: string;

  @Column({ name: 'vnpay_response_code', nullable: true })
  vnpayResponseCode?: string;

  @Column({ type: 'jsonb', name: 'vnpay_data', nullable: true })
  vnpayData?: any;
}

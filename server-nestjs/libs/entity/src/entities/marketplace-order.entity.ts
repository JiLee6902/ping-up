import { Entity, Column, ManyToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { Product } from './product.entity';
import { MarketplaceOrderStatus } from '@app/enum';

@Entity('marketplace_orders')
export class MarketplaceOrder extends BaseEntity {
  @Column({ name: 'buyer_id', type: 'uuid' })
  @Index()
  buyerId: string;

  @Column({ name: 'seller_id', type: 'uuid' })
  @Index()
  sellerId: string;

  @Column({ name: 'product_id', type: 'uuid' })
  @Index()
  productId: string;

  @Column({ name: 'order_code', unique: true })
  @Index()
  orderCode: string;

  @Column({ type: 'bigint' })
  amount: number;

  @Column({
    type: 'enum',
    enum: MarketplaceOrderStatus,
    default: MarketplaceOrderStatus.PENDING,
  })
  @Index()
  status: MarketplaceOrderStatus;

  @Column({ name: 'vnpay_transaction_no', nullable: true })
  vnpayTransactionNo?: string;

  @Column({ name: 'vnpay_response_code', nullable: true })
  vnpayResponseCode?: string;

  @Column({ name: 'vnpay_data', type: 'jsonb', nullable: true })
  vnpayData?: Record<string, any>;

  @Column({ name: 'shipping_address', type: 'text', nullable: true })
  shippingAddress?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'buyer_id' })
  buyer: User;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'seller_id' })
  seller: User;

  @ManyToOne(() => Product, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'product_id' })
  product: Product;
}

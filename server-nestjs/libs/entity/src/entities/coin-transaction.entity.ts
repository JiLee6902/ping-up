import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { TransactionType } from '@app/enum';

@Entity('coin_transactions')
export class CoinTransaction extends BaseEntity {
  @Column('uuid', { name: 'user_id' })
  @Index()
  userId: string;

  @Column({ type: 'enum', enum: TransactionType })
  type: TransactionType;

  @Column('int')
  amount: number;

  @Column('int', { name: 'balance_after' })
  balanceAfter: number;

  @Column({ nullable: true })
  description?: string;

  @Column({ name: 'reference_id', nullable: true })
  @Index()
  referenceId?: string;
}

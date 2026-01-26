import {
  Entity,
  Column,
  Index,
  VersionColumn,
} from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('user_wallets')
export class UserWallet extends BaseEntity {
  @Column('uuid', { name: 'user_id', unique: true })
  @Index()
  userId: string;

  @Column('int', { default: 0 })
  balance: number;

  @Column('int', { name: 'total_top_up', default: 0 })
  totalTopUp: number;

  @Column('int', { name: 'total_spent', default: 0 })
  totalSpent: number;

  @VersionColumn()
  version: number;
}

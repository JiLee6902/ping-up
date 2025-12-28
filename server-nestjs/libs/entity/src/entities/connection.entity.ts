import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

export enum ConnectionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
}

@Entity('connections')
@Unique(['fromUserId', 'toUserId'])
export class Connection extends BaseEntity {
  @Column({ name: 'from_user_id' })
  @Index()
  fromUserId: string;

  @Column({ name: 'to_user_id' })
  @Index()
  toUserId: string;

  @Column({
    type: 'enum',
    enum: ConnectionStatus,
    default: ConnectionStatus.PENDING,
  })
  status: ConnectionStatus;

  @ManyToOne(() => User, (user) => user.sentConnections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'from_user_id' })
  fromUser: User;

  @ManyToOne(() => User, (user) => user.receivedConnections, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'to_user_id' })
  toUser: User;
}

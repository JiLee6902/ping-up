import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('blocked_users')
@Unique(['blockerId', 'blockedId'])
@Index(['blockerId', 'createdAt'])
export class BlockedUser extends BaseEntity {
  @Column({ name: 'blocker_id', type: 'uuid' })
  @Index()
  blockerId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocker_id' })
  blocker: User;

  @Column({ name: 'blocked_id', type: 'uuid' })
  @Index()
  blockedId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'blocked_id' })
  blocked: User;

  @Column({ name: 'reason', nullable: true })
  reason?: string;
}

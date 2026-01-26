import { Entity, Column, ManyToOne, JoinColumn, Index, Unique } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('muted_users')
@Unique(['muterId', 'mutedId'])
@Index(['muterId', 'createdAt'])
export class MutedUser extends BaseEntity {
  @Column({ name: 'muter_id', type: 'uuid' })
  @Index()
  muterId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'muter_id' })
  muter: User;

  @Column({ name: 'muted_id', type: 'uuid' })
  @Index()
  mutedId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'muted_id' })
  muted: User;

  @Column({ name: 'mute_until', type: 'timestamptz', nullable: true })
  muteUntil?: Date;
}

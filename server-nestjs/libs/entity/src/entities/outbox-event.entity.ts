import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

@Entity('outbox_events')
export class OutboxEvent {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'aggregate_type', type: 'varchar', length: 50 })
  @Index()
  aggregateType: string;

  @Column({ name: 'aggregate_id', type: 'varchar', length: 255 })
  aggregateId: string;

  @Column({ name: 'event_type', type: 'varchar', length: 100 })
  @Index()
  eventType: string;

  @Column({ type: 'jsonb' })
  payload: Record<string, any>;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  @Index()
  createdAt: Date;
}

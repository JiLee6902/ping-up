import {
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  Column,
  Index,
  ValueTransformer,
} from 'typeorm';

// Transformer to ensure dates are always handled as UTC
const dateTransformer: ValueTransformer = {
  to: (value: Date | null): Date | null => value,
  from: (value: Date | string | null): Date | null => {
    if (!value) return null;
    // If it's already a Date, return as is
    if (value instanceof Date) return value;
    // PostgreSQL returns string like "2024-01-11 10:00:00+00" or "2024-01-11 10:00:00"
    // Ensure we parse it as UTC
    let dateStr = String(value);
    // If no timezone info, append Z to treat as UTC
    if (!dateStr.includes('+') && !dateStr.includes('Z') && !dateStr.match(/-\d{2}:\d{2}$/)) {
      dateStr = dateStr.replace(' ', 'T') + 'Z';
    } else {
      // Replace space with T for ISO format
      dateStr = dateStr.replace(' ', 'T');
    }
    return new Date(dateStr);
  },
};

export abstract class BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
    transformer: dateTransformer,
  })
  @Index()
  createdAt: Date;

  @UpdateDateColumn({
    name: 'updated_at',
    type: 'timestamptz',
    transformer: dateTransformer,
  })
  updatedAt: Date;

  @Column({ name: 'created_by', nullable: true, default: 'SYSTEM' })
  createdBy: string;

  @Column({ name: 'updated_by', nullable: true, default: 'SYSTEM' })
  updatedBy: string;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
    transformer: dateTransformer,
  })
  deletedAt?: Date | null;
}

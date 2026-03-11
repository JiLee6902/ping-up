import {
  Entity,
  Column,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';
import { ProductStatus, ProductCondition, ProductCategory } from '@app/enum';

@Entity('products')
export class Product extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ length: 200 })
  @Index()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  price: number;

  @Column({ default: 'VND', length: 10 })
  currency: string;

  @Column({
    type: 'enum',
    enum: ProductCategory,
    default: ProductCategory.OTHER,
  })
  @Index()
  category: ProductCategory;

  @Column({
    type: 'enum',
    enum: ProductCondition,
    default: ProductCondition.GOOD,
  })
  condition: ProductCondition;

  @Column({
    type: 'enum',
    enum: ProductStatus,
    default: ProductStatus.ACTIVE,
  })
  @Index()
  status: ProductStatus;

  @Column({ name: 'image_urls', type: 'simple-array', nullable: true })
  imageUrls?: string[];

  @Column({ nullable: true })
  location?: string;

  @Column({ name: 'location_lat', type: 'decimal', precision: 10, scale: 8, nullable: true })
  locationLat?: number;

  @Column({ name: 'location_lng', type: 'decimal', precision: 11, scale: 8, nullable: true })
  locationLng?: number;

  @Column({ name: 'views_count', default: 0 })
  viewsCount: number;

  @Column({ name: 'saves_count', default: 0 })
  savesCount: number;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToMany(() => User)
  @JoinTable({
    name: 'product_saves',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'user_id', referencedColumnName: 'id' },
  })
  savedBy: User[];
}

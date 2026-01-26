import {
  Entity,
  Column,
  Index,
} from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity('profile_views')
@Index(['profileOwnerId', 'viewerId', 'createdAt'])
export class ProfileView extends BaseEntity {
  @Column('uuid', { name: 'profile_owner_id' })
  @Index()
  profileOwnerId: string;

  @Column('uuid', { name: 'viewer_id' })
  @Index()
  viewerId: string;
}

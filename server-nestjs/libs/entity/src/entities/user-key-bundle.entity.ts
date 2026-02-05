import { Entity, Column, OneToOne, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from './base.entity';
import { User } from './user.entity';

@Entity('user_key_bundles')
export class UserKeyBundle extends BaseEntity {
  @Column({ name: 'user_id' })
  @Index({ unique: true })
  userId: string;

  @Column({ name: 'identity_public_key', type: 'text' })
  identityPublicKey: string;

  @Column({ name: 'signed_prekey', type: 'text', nullable: true })
  signedPrekey?: string;

  @Column({ name: 'prekey_signature', type: 'text', nullable: true })
  prekeySignature?: string;

  @Column({ name: 'key_version', default: 1 })
  keyVersion: number;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}

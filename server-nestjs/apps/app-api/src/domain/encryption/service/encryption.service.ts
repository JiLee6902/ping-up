import { Injectable } from '@nestjs/common';
import { EncryptionRepository } from '../repository/encryption.repository';
import { UploadKeyBundleDto } from '../dto';

@Injectable()
export class EncryptionService {
  constructor(private readonly encryptionRepository: EncryptionRepository) {}

  async uploadKeyBundle(userId: string, dto: UploadKeyBundleDto) {
    const existing = await this.encryptionRepository.findByUserId(userId);

    if (existing) {
      const updated = await this.encryptionRepository.update(userId, {
        identityPublicKey: dto.identityPublicKey,
        signedPrekey: dto.signedPrekey,
        prekeySignature: dto.prekeySignature,
        keyVersion: existing.keyVersion + 1,
      });
      return {
        success: true,
        message: 'Key bundle updated',
        data: { keyVersion: updated.keyVersion },
      };
    }

    const bundle = await this.encryptionRepository.create(userId, {
      identityPublicKey: dto.identityPublicKey,
      signedPrekey: dto.signedPrekey,
      prekeySignature: dto.prekeySignature,
    });
    return {
      success: true,
      message: 'Key bundle uploaded',
      data: { keyVersion: bundle.keyVersion },
    };
  }

  async getKeyBundle(userId: string) {
    const bundle = await this.encryptionRepository.findByUserId(userId);
    if (!bundle) {
      return { success: true, data: null };
    }
    return {
      success: true,
      data: {
        userId: bundle.userId,
        identityPublicKey: bundle.identityPublicKey,
        signedPrekey: bundle.signedPrekey,
        keyVersion: bundle.keyVersion,
      },
    };
  }

  async hasKeyBundle(userId: string) {
    const bundle = await this.encryptionRepository.findByUserId(userId);
    return { success: true, data: { hasKeys: !!bundle } };
  }
}

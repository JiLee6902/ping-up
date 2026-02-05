import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserKeyBundle } from '@app/entity';

@Injectable()
export class EncryptionRepository {
  constructor(
    @InjectRepository(UserKeyBundle)
    private readonly keyBundleRepository: Repository<UserKeyBundle>,
  ) {}

  async findByUserId(userId: string): Promise<UserKeyBundle | null> {
    return this.keyBundleRepository.findOne({ where: { userId } });
  }

  async create(
    userId: string,
    data: Partial<UserKeyBundle>,
  ): Promise<UserKeyBundle> {
    const bundle = this.keyBundleRepository.create({ userId, ...data });
    return this.keyBundleRepository.save(bundle);
  }

  async update(
    userId: string,
    data: Partial<UserKeyBundle>,
  ): Promise<UserKeyBundle> {
    await this.keyBundleRepository.update({ userId }, data);
    return this.keyBundleRepository.findOneOrFail({ where: { userId } });
  }
}

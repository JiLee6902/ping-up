import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserKeyBundle } from '@app/entity';
import { EncryptionController } from './controller/encryption.controller';
import { EncryptionService } from './service/encryption.service';
import { EncryptionRepository } from './repository/encryption.repository';

@Module({
  imports: [TypeOrmModule.forFeature([UserKeyBundle])],
  controllers: [EncryptionController],
  providers: [EncryptionService, EncryptionRepository],
  exports: [EncryptionService],
})
export class EncryptionModule {}

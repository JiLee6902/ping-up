import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { S3Service } from './service/s3.service';
import { StorageService } from './service/storage.service';
import { ImageKitService } from './service/imagekit.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [S3Service, StorageService, ImageKitService],
  exports: [S3Service, StorageService, ImageKitService],
})
export class StorageModule {}

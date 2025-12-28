import { Module, Global } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StorageModule } from '@app/external-infra/storage';
import { UploadService } from './service/upload.service';

@Global()
@Module({
  imports: [
    StorageModule,
    MulterModule.register({
      storage: memoryStorage(),
    }),
  ],
  providers: [UploadService],
  exports: [UploadService, MulterModule],
})
export class UploadModule {}

import { Injectable } from '@nestjs/common';
import { ImageKitService } from '@app/external-infra/storage';

export interface UploadResult {
  url: string;
  fileId: string;
  name: string;
}

@Injectable()
export class UploadService {
  constructor(private readonly imageKitService: ImageKitService) {}

  async uploadProfileImage(file: Express.Multer.File): Promise<UploadResult> {
    return this.imageKitService.uploadProfileImage(file);
  }

  async uploadCoverPhoto(file: Express.Multer.File): Promise<UploadResult> {
    return this.imageKitService.uploadCoverPhoto(file);
  }

  async uploadPostImage(file: Express.Multer.File): Promise<UploadResult> {
    return this.imageKitService.uploadPostImage(file);
  }

  async uploadPostVideo(file: Express.Multer.File): Promise<UploadResult> {
    return this.imageKitService.uploadPostVideo(file);
  }

  async uploadMessageImage(file: Express.Multer.File): Promise<UploadResult> {
    return this.imageKitService.uploadMessageImage(file);
  }

  async uploadStoryMedia(file: Express.Multer.File): Promise<UploadResult> {
    return this.imageKitService.uploadStoryMedia(file);
  }

  async deleteFile(fileId: string): Promise<void> {
    return this.imageKitService.deleteFile(fileId);
  }
}

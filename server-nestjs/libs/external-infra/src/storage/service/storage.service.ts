import { Injectable } from '@nestjs/common';
import { S3Service, UploadResult } from './s3.service';

export enum StorageFolder {
  PROFILE_PICTURES = 'profiles',
  COVER_PHOTOS = 'covers',
  POST_IMAGES = 'posts',
  STORY_MEDIA = 'stories',
  MESSAGE_MEDIA = 'messages',
}

@Injectable()
export class StorageService {
  constructor(private readonly s3Service: S3Service) {}

  async uploadProfilePicture(file: Express.Multer.File): Promise<UploadResult> {
    return this.s3Service.uploadFile(file, StorageFolder.PROFILE_PICTURES);
  }

  async uploadCoverPhoto(file: Express.Multer.File): Promise<UploadResult> {
    return this.s3Service.uploadFile(file, StorageFolder.COVER_PHOTOS);
  }

  async uploadPostImage(file: Express.Multer.File): Promise<UploadResult> {
    return this.s3Service.uploadFile(file, StorageFolder.POST_IMAGES);
  }

  async uploadPostImages(files: Express.Multer.File[]): Promise<UploadResult[]> {
    return Promise.all(
      files.map((file) => this.s3Service.uploadFile(file, StorageFolder.POST_IMAGES)),
    );
  }

  async uploadStoryMedia(file: Express.Multer.File): Promise<UploadResult> {
    return this.s3Service.uploadFile(file, StorageFolder.STORY_MEDIA);
  }

  async uploadMessageMedia(file: Express.Multer.File): Promise<UploadResult> {
    return this.s3Service.uploadFile(file, StorageFolder.MESSAGE_MEDIA);
  }

  async deleteFile(key: string): Promise<void> {
    return this.s3Service.deleteFile(key);
  }

  getPublicUrl(key: string): string {
    return this.s3Service.getPublicUrl(key);
  }
}

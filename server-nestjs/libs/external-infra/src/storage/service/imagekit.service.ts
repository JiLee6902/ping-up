import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import ImageKit from 'imagekit';

export interface ImageKitUploadResult {
  url: string;
  fileId: string;
  name: string;
}

export interface UploadOptions {
  folder?: string;
  width?: number;
  format?: string;
  quality?: string;
}

@Injectable()
export class ImageKitService {
  private readonly logger = new Logger(ImageKitService.name);
  private imageKit: ImageKit;

  constructor(private readonly configService: ConfigService) {
    this.imageKit = new ImageKit({
      publicKey: this.configService.get('IMAGEKIT_PUBLIC_KEY', ''),
      privateKey: this.configService.get('IMAGEKIT_PRIVATE_KEY', ''),
      urlEndpoint: this.configService.get('IMAGEKIT_URL_ENDPOINT', ''),
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    options: UploadOptions = {},
  ): Promise<ImageKitUploadResult> {
    const {
      folder = 'pingup',
      width = 1280,
      format = 'webp',
      quality = 'auto',
    } = options;

    try {
      const result = await this.imageKit.upload({
        file: file.buffer,
        fileName: `${Date.now()}-${file.originalname}`,
        folder,
        transformation: {
          pre: `w-${width},f-${format},q-${quality}`,
        },
      });

      this.logger.debug(`File uploaded to ImageKit: ${result.url}`);

      return {
        url: result.url,
        fileId: result.fileId,
        name: result.name,
      };
    } catch (error) {
      this.logger.error(`Failed to upload file: ${error.message}`);
      throw error;
    }
  }

  async uploadProfileImage(file: Express.Multer.File): Promise<ImageKitUploadResult> {
    return this.uploadFile(file, {
      folder: 'pingup/profiles',
      width: 512,
    });
  }

  async uploadCoverPhoto(file: Express.Multer.File): Promise<ImageKitUploadResult> {
    return this.uploadFile(file, {
      folder: 'pingup/covers',
      width: 1280,
    });
  }

  async uploadPostImage(file: Express.Multer.File): Promise<ImageKitUploadResult> {
    return this.uploadFile(file, {
      folder: 'pingup/posts',
      width: 1280,
    });
  }

  async uploadMessageImage(file: Express.Multer.File): Promise<ImageKitUploadResult> {
    return this.uploadFile(file, {
      folder: 'pingup/messages',
      width: 1280,
    });
  }

  async uploadStoryMedia(file: Express.Multer.File): Promise<ImageKitUploadResult> {
    return this.uploadFile(file, {
      folder: 'pingup/stories',
      width: 1280,
    });
  }

  async uploadPostVideo(file: Express.Multer.File): Promise<ImageKitUploadResult> {
    // For video files, we don't apply image transformations
    try {
      const result = await this.imageKit.upload({
        file: file.buffer,
        fileName: `${Date.now()}-${file.originalname}`,
        folder: 'pingup/videos',
      });

      this.logger.debug(`Video uploaded to ImageKit: ${result.url}`);

      return {
        url: result.url,
        fileId: result.fileId,
        name: result.name,
      };
    } catch (error) {
      this.logger.error(`Failed to upload video: ${error.message}`);
      throw error;
    }
  }

  async deleteFile(fileId: string): Promise<void> {
    try {
      await this.imageKit.deleteFile(fileId);
      this.logger.debug(`File deleted from ImageKit: ${fileId}`);
    } catch (error) {
      this.logger.error(`Failed to delete file ${fileId}: ${error.message}`);
    }
  }

  getTransformedUrl(url: string, transformations: string): string {
    // Add transformations to ImageKit URL
    const urlObj = new URL(url);
    urlObj.searchParams.set('tr', transformations);
    return urlObj.toString();
  }
}

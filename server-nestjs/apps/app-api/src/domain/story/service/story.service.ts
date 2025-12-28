import { Injectable, BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { StoryRepository } from '../repository/story.repository';
import { UploadService } from '../../upload/service/upload.service';
import { CreateStoryDto } from '../dto';
import { MediaType } from '@app/enum';
import { User } from '@app/entity';

const STORY_EXPIRATION_MS = 24 * 60 * 60 * 1000; // 24 hours

@Injectable()
export class StoryService {
  constructor(
    private readonly storyRepository: StoryRepository,
    private readonly uploadService: UploadService,
    @InjectQueue('story') private readonly storyQueue: Queue,
  ) {}

  async createStory(
    userId: string,
    dto: CreateStoryDto,
    file?: Express.Multer.File,
  ) {
    if (!dto.content && !file) {
      throw new BadRequestException('Story must have content or media');
    }

    let mediaUrl: string | undefined;
    let mediaType = dto.mediaType || MediaType.TEXT;

    // Upload media if provided
    if (file) {
      const result = await this.uploadService.uploadStoryMedia(file);
      mediaUrl = result.url;

      // Determine media type from file mimetype
      if (file.mimetype.startsWith('video/')) {
        mediaType = MediaType.VIDEO;
      } else if (file.mimetype.startsWith('image/')) {
        mediaType = MediaType.IMAGE;
      }
    }

    const expiresAt = new Date(Date.now() + STORY_EXPIRATION_MS);

    const story = await this.storyRepository.create({
      user: { id: userId } as User,
      content: dto.content,
      mediaUrl,
      mediaType,
      backgroundColor: dto.backgroundColor,
      expiresAt,
      viewsCount: 0,
    });

    // Schedule story deletion after 24 hours
    await this.storyQueue.add(
      'delete-story',
      { storyId: story.id },
      { delay: STORY_EXPIRATION_MS },
    );

    return {
      success: true,
      message: 'Story created successfully',
      data: this.formatStoryResponse(story),
    };
  }

  async getStories(userId: string) {
    const stories = await this.storyRepository.getStoriesForUser(userId);
    const myStories = await this.storyRepository.getUserStories(userId);

    // Group stories by user
    const groupedStories = this.groupStoriesByUser([...myStories, ...stories]);

    return {
      success: true,
      data: groupedStories,
    };
  }

  async viewStory(storyId: string, userId: string) {
    await this.storyRepository.addView(storyId, userId);

    return {
      success: true,
      message: 'Story viewed',
    };
  }

  async deleteStory(storyId: string, userId: string) {
    const story = await this.storyRepository.findById(storyId);

    if (!story) {
      throw new NotFoundException('Story not found');
    }

    if (story.user.id !== userId) {
      throw new ForbiddenException('You can only delete your own stories');
    }

    await this.storyRepository.delete(storyId);

    return {
      success: true,
      message: 'Story deleted successfully',
    };
  }

  private groupStoriesByUser(stories: any[]) {
    const grouped = new Map<string, any>();

    for (const story of stories) {
      const storyUserId = story.user.id;

      if (!grouped.has(storyUserId)) {
        grouped.set(storyUserId, {
          user: {
            id: story.user.id,
            fullName: story.user.fullName,
            username: story.user.username,
            profilePicture: story.user.profilePicture,
          },
          stories: [],
        });
      }

      grouped.get(storyUserId).stories.push(this.formatStoryResponse(story));
    }

    return Array.from(grouped.values());
  }

  private formatStoryResponse(story: any) {
    return {
      id: story.id,
      content: story.content,
      mediaUrl: story.mediaUrl,
      mediaType: story.mediaType,
      backgroundColor: story.backgroundColor,
      viewsCount: story.viewsCount,
      createdAt: story.createdAt,
      expiresAt: story.expiresAt,
    };
  }
}

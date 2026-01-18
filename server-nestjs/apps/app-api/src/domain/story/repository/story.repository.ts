import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, MoreThan } from 'typeorm';
import { Story, User, Connection } from '@app/entity';
import { ConnectionStatus } from '@app/enum';

@Injectable()
export class StoryRepository {
  constructor(
    @InjectRepository(Story)
    private readonly storyRepository: Repository<Story>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
  ) {}

  async create(storyData: Partial<Story>): Promise<Story> {
    const story = this.storyRepository.create(storyData);
    return this.storyRepository.save(story);
  }

  async findById(id: string): Promise<Story | null> {
    return this.storyRepository.findOne({
      where: { id },
      relations: ['user', 'views', 'likes'],
    });
  }

  async delete(id: string): Promise<void> {
    await this.storyRepository.delete(id);
  }

  async getStoriesForUser(userId: string): Promise<Story[]> {
    // Get 24 hours ago
    const now = new Date();

    // Get user's following
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['following'],
    });
    const followingIds = user?.following?.map((u) => u.id) || [];

    // Get user's connections
    const connections = await this.connectionRepository.find({
      where: [
        { fromUser: { id: userId }, status: ConnectionStatus.ACCEPTED },
        { toUser: { id: userId }, status: ConnectionStatus.ACCEPTED },
      ],
      relations: ['fromUser', 'toUser'],
    });
    const connectionIds = connections.map((c) =>
      c.fromUser.id === userId ? c.toUser.id : c.fromUser.id,
    );

    // Combine all IDs (following + connections)
    const allUserIds = [...new Set([...followingIds, ...connectionIds])];

    if (allUserIds.length === 0) {
      return [];
    }

    return this.storyRepository.find({
      where: {
        user: { id: In(allUserIds) },
        expiresAt: MoreThan(now),
      },
      relations: ['user', 'views', 'likes'],
      order: { createdAt: 'DESC' },
    });
  }

  async getUserStories(userId: string): Promise<Story[]> {
    const now = new Date();

    return this.storyRepository.find({
      where: {
        user: { id: userId },
        expiresAt: MoreThan(now),
      },
      relations: ['user', 'views', 'likes'],
      order: { createdAt: 'DESC' },
    });
  }

  async addView(storyId: string, userId: string): Promise<void> {
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: ['views'],
    });

    if (story) {
      const views = story.views || [];
      const hasViewed = views.some((u) => u.id === userId);

      if (!hasViewed) {
        const user = await this.userRepository.findOne({ where: { id: userId } });
        if (user) {
          story.views = [...views, user];
          story.viewsCount = story.viewsCount + 1;
          await this.storyRepository.save(story);
        }
      }
    }
  }

  async toggleLike(storyId: string, userId: string): Promise<{ liked: boolean; likesCount: number }> {
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
    });

    if (!story) {
      throw new Error('Story not found');
    }

    const currentLikesCount = story.likesCount || 0;

    // Check if user already liked using raw query
    const existingLike = await this.storyRepository
      .createQueryBuilder()
      .select('1')
      .from('story_likes', 'sl')
      .where('sl.story_id = :storyId', { storyId })
      .andWhere('sl.user_id = :userId', { userId })
      .getRawOne();

    if (existingLike) {
      // Unlike - remove from junction table
      await this.storyRepository
        .createQueryBuilder()
        .delete()
        .from('story_likes')
        .where('story_id = :storyId', { storyId })
        .andWhere('user_id = :userId', { userId })
        .execute();

      // Update likes count
      const newCount = Math.max(0, currentLikesCount - 1);
      await this.storyRepository.update(storyId, { likesCount: newCount });

      return { liked: false, likesCount: newCount };
    } else {
      // Like - insert into junction table
      await this.storyRepository
        .createQueryBuilder()
        .insert()
        .into('story_likes')
        .values({ story_id: storyId, user_id: userId })
        .execute();

      // Update likes count
      const newCount = currentLikesCount + 1;
      await this.storyRepository.update(storyId, { likesCount: newCount });

      return { liked: true, likesCount: newCount };
    }
  }

  async getStoryLikes(storyId: string): Promise<User[]> {
    const story = await this.storyRepository.findOne({
      where: { id: storyId },
      relations: ['likes'],
    });

    return story?.likes || [];
  }
}

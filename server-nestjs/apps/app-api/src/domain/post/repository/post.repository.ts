import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, SelectQueryBuilder } from 'typeorm';
import { Post, User, Connection, Bookmark } from '@app/entity';
import { ConnectionStatus, PostType } from '@app/enum';
import { AdvancedSearchDto, SortBy, SortOrder, MediaFilter } from '../dto';

@Injectable()
export class PostRepository {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Connection)
    private readonly connectionRepository: Repository<Connection>,
    @InjectRepository(Bookmark)
    private readonly bookmarkRepository: Repository<Bookmark>,
  ) {}

  async create(postData: Partial<Post>): Promise<Post> {
    const post = this.postRepository.create(postData);
    return this.postRepository.save(post);
  }

  async findById(id: string): Promise<Post | null> {
    return this.postRepository.findOne({
      where: { id },
      relations: ['user', 'likes', 'originalPost', 'originalPost.user'],
    });
  }

  async getFeedPosts(userId: string, limit = 50, offset = 0): Promise<Post[]> {
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

    // Combine all IDs (user + following + connections)
    const allUserIds = [...new Set([userId, ...followingIds, ...connectionIds])];

    return this.postRepository.find({
      where: { user: { id: In(allUserIds) } },
      relations: ['user', 'likes', 'originalPost', 'originalPost.user'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async findExistingRepost(userId: string, originalPostId: string): Promise<Post | null> {
    return this.postRepository.findOne({
      where: {
        userId,
        originalPostId,
        postType: PostType.REPOST,
      },
    });
  }

  async hasUserReposted(userId: string, originalPostId: string): Promise<boolean> {
    const count = await this.postRepository.count({
      where: {
        userId,
        originalPostId,
        postType: PostType.REPOST,
      },
    });
    return count > 0;
  }

  async getRepostStatusForPosts(userId: string, postIds: string[]): Promise<Map<string, boolean>> {
    if (postIds.length === 0) return new Map();

    const reposts = await this.postRepository.find({
      where: {
        userId,
        postType: PostType.REPOST,
      },
      select: ['originalPostId'],
    });

    const repostedPostIds = new Set(reposts.map(r => r.originalPostId));
    const statusMap = new Map<string, boolean>();

    for (const postId of postIds) {
      statusMap.set(postId, repostedPostIds.has(postId));
    }

    return statusMap;
  }

  async createRepost(userId: string, originalPostId: string): Promise<{ post: Post; reposterUser: User }> {
    const reposterUser = await this.userRepository.findOne({ where: { id: userId } });

    const post = this.postRepository.create({
      user: { id: userId } as User,
      postType: PostType.REPOST,
      originalPostId,
      likesCount: 0,
      sharesCount: 0,
      commentsCount: 0,
    });

    const savedPost = await this.postRepository.save(post);

    // Increment shares count on original post
    await this.postRepository.increment(
      { id: originalPostId },
      'sharesCount',
      1,
    );

    return { post: savedPost, reposterUser };
  }

  async deleteRepost(repostId: string, originalPostId: string): Promise<void> {
    await this.postRepository.delete(repostId);

    // Decrement shares count on original post
    await this.postRepository.decrement(
      { id: originalPostId },
      'sharesCount',
      1,
    );
  }

  async getUserPosts(userId: string): Promise<Post[]> {
    return this.postRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'likes', 'originalPost', 'originalPost.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async getGlobalPosts(limit = 50, offset = 0): Promise<Post[]> {
    return this.postRepository.find({
      relations: ['user', 'likes', 'originalPost', 'originalPost.user'],
      order: { createdAt: 'DESC', likesCount: 'DESC' },
      take: limit,
      skip: offset,
    });
  }

  async getLikedPosts(userId: string, limit = 50, offset = 0): Promise<Post[]> {
    return this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.likes', 'likes')
      .leftJoinAndSelect('post.originalPost', 'originalPost')
      .leftJoinAndSelect('originalPost.user', 'originalPostUser')
      .innerJoin('post.likes', 'likedBy', 'likedBy.id = :userId', { userId })
      .orderBy('post.createdAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();
  }

  async toggleLike(postId: string, userId: string): Promise<{ post: Post; isLiked: boolean; likerUser: User }> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['likes', 'user'],
    });

    if (!post) {
      throw new Error('Post not found');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new Error('User not found');
    }

    const likes = post.likes || [];
    const isCurrentlyLiked = likes.some((u) => u.id === userId);

    if (isCurrentlyLiked) {
      // Unlike
      post.likes = likes.filter((u) => u.id !== userId);
      post.likesCount = Math.max(0, post.likesCount - 1);
    } else {
      // Like
      post.likes = [...likes, user];
      post.likesCount = post.likesCount + 1;
    }

    await this.postRepository.save(post);

    return { post, isLiked: !isCurrentlyLiked, likerUser: user };
  }

  async isLikedByUser(postId: string, userId: string): Promise<boolean> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['likes'],
    });
    return post?.likes?.some((u) => u.id === userId) || false;
  }

  async deletePost(postId: string): Promise<void> {
    // First delete all reposts of this post
    await this.postRepository.delete({ originalPostId: postId });
    // Then delete the post itself
    await this.postRepository.delete(postId);
  }

  async updatePost(postId: string, data: Partial<Post>): Promise<Post> {
    await this.postRepository.update(postId, data);
    return this.findById(postId);
  }

  async searchPosts(query: string, limit = 50, offset = 0): Promise<Post[]> {
    // Use tsvector for full-text search with trigram fallback
    const tsQuery = query.split(' ').filter(w => w.length > 0).join(' & ');

    return this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.likes', 'likes')
      .leftJoinAndSelect('post.originalPost', 'originalPost')
      .leftJoinAndSelect('originalPost.user', 'originalPostUser')
      .where(
        `(post.search_vector @@ to_tsquery('vietnamese', :tsQuery) OR post.content % :query)`,
        { tsQuery, query }
      )
      .orderBy(
        `ts_rank(post.search_vector, to_tsquery('vietnamese', :tsQuery))`,
        'DESC'
      )
      .addOrderBy('post.createdAt', 'DESC')
      .take(limit)
      .skip(offset)
      .getMany();
  }

  // Bookmark methods
  async toggleBookmark(userId: string, postId: string): Promise<{ isBookmarked: boolean }> {
    const existing = await this.bookmarkRepository.findOne({
      where: { userId, postId },
    });

    if (existing) {
      await this.bookmarkRepository.delete(existing.id);
      return { isBookmarked: false };
    }

    await this.bookmarkRepository.save({ userId, postId });
    return { isBookmarked: true };
  }

  async isBookmarked(userId: string, postId: string): Promise<boolean> {
    const count = await this.bookmarkRepository.count({
      where: { userId, postId },
    });
    return count > 0;
  }

  async getBookmarkStatusForPosts(userId: string, postIds: string[]): Promise<Map<string, boolean>> {
    if (postIds.length === 0) return new Map();

    const bookmarks = await this.bookmarkRepository.find({
      where: { userId, postId: In(postIds) },
      select: ['postId'],
    });

    const bookmarkedPostIds = new Set(bookmarks.map(b => b.postId));
    const statusMap = new Map<string, boolean>();

    for (const postId of postIds) {
      statusMap.set(postId, bookmarkedPostIds.has(postId));
    }

    return statusMap;
  }

  async getBookmarkedPosts(userId: string, limit = 50, offset = 0): Promise<Post[]> {
    const bookmarks = await this.bookmarkRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
    });

    const postIds = bookmarks.map(b => b.postId);
    if (postIds.length === 0) return [];

    return this.postRepository.find({
      where: { id: In(postIds) },
      relations: ['user', 'likes', 'originalPost', 'originalPost.user'],
      order: { createdAt: 'DESC' },
    });
  }

  async advancedSearchPosts(dto: AdvancedSearchDto): Promise<Post[]> {
    const limit = dto.limit || 50;
    const offset = dto.offset || 0;

    let query = this.postRepository
      .createQueryBuilder('post')
      .leftJoinAndSelect('post.user', 'user')
      .leftJoinAndSelect('post.likes', 'likes')
      .leftJoinAndSelect('post.originalPost', 'originalPost')
      .leftJoinAndSelect('originalPost.user', 'originalPostUser');

    // Text search with tsvector
    if (dto.query && dto.query.trim()) {
      const tsQuery = dto.query.split(' ').filter(w => w.length > 0).join(' & ');
      query = query.andWhere(
        `(post.search_vector @@ to_tsquery('vietnamese', :tsQuery) OR post.content ILIKE :likeQuery)`,
        { tsQuery, likeQuery: `%${dto.query}%` }
      );
    }

    // Date range filter
    if (dto.dateFrom) {
      query = query.andWhere('post.created_at >= :dateFrom', { dateFrom: new Date(dto.dateFrom) });
    }
    if (dto.dateTo) {
      const endDate = new Date(dto.dateTo);
      endDate.setHours(23, 59, 59, 999);
      query = query.andWhere('post.created_at <= :dateTo', { dateTo: endDate });
    }

    // Media filter
    if (dto.mediaFilter) {
      switch (dto.mediaFilter) {
        case MediaFilter.IMAGES:
          query = query.andWhere(`post.image_urls IS NOT NULL AND array_length(post.image_urls, 1) > 0`);
          break;
        case MediaFilter.VIDEO:
          query = query.andWhere(`post.video_url IS NOT NULL AND post.video_url != ''`);
          break;
        case MediaFilter.NONE:
          query = query.andWhere(`(post.image_urls IS NULL OR array_length(post.image_urls, 1) = 0 OR array_length(post.image_urls, 1) IS NULL)`);
          query = query.andWhere(`(post.video_url IS NULL OR post.video_url = '')`);
          break;
        case MediaFilter.ANY:
          query = query.andWhere(
            `((post.image_urls IS NOT NULL AND array_length(post.image_urls, 1) > 0) OR (post.video_url IS NOT NULL AND post.video_url != ''))`
          );
          break;
      }
    }

    // From specific user
    if (dto.fromUser) {
      query = query.andWhere(
        `(user.username ILIKE :fromUser OR user.id = :fromUserId)`,
        { fromUser: `%${dto.fromUser}%`, fromUserId: dto.fromUser }
      );
    }

    // Hashtag filter (search in content for #hashtag)
    if (dto.hashtag) {
      const hashtagSearch = dto.hashtag.startsWith('#') ? dto.hashtag : `#${dto.hashtag}`;
      query = query.andWhere(`post.content ILIKE :hashtag`, { hashtag: `%${hashtagSearch}%` });
    }

    // Location filter
    if (dto.location) {
      query = query.andWhere(`post.location ILIKE :location`, { location: `%${dto.location}%` });
    }

    // Exclude reposts from search results (show only original content)
    query = query.andWhere(`post.post_type != :repostType`, { repostType: PostType.REPOST });

    // Sorting
    const sortOrder = dto.sortOrder === SortOrder.ASC ? 'ASC' : 'DESC';
    switch (dto.sortBy) {
      case SortBy.LIKES:
        query = query.orderBy('post.likes_count', sortOrder);
        query = query.addOrderBy('post.created_at', 'DESC');
        break;
      case SortBy.COMMENTS:
        query = query.orderBy('post.comments_count', sortOrder);
        query = query.addOrderBy('post.created_at', 'DESC');
        break;
      case SortBy.DATE:
      default:
        query = query.orderBy('post.created_at', sortOrder);
        break;
    }

    // Add text search ranking if query exists
    if (dto.query && dto.query.trim()) {
      const tsQuery = dto.query.split(' ').filter(w => w.length > 0).join(' & ');
      query = query.addOrderBy(
        `ts_rank(post.search_vector, to_tsquery('vietnamese', '${tsQuery.replace(/'/g, "''")}'))`,
        'DESC'
      );
    }

    return query.take(limit).skip(offset).getMany();
  }

  async getSearchSuggestions(query: string, limit = 5): Promise<{ hashtags: string[]; users: { id: string; username: string; fullName: string; profilePicture: string }[] }> {
    // Get trending hashtags matching query
    const hashtagResults = await this.postRepository
      .createQueryBuilder('post')
      .select(`DISTINCT regexp_matches(post.content, '#([a-zA-Z0-9_]+)', 'g')`, 'hashtag')
      .where(`post.content ILIKE :query`, { query: `%#${query}%` })
      .limit(limit)
      .getRawMany();

    const hashtags = hashtagResults
      .map(r => r.hashtag?.[0])
      .filter(h => h && h.toLowerCase().includes(query.toLowerCase()));

    // Get users matching query
    const users = await this.userRepository
      .createQueryBuilder('user')
      .select(['user.id', 'user.username', 'user.fullName', 'user.profilePicture'])
      .where(`user.username ILIKE :query OR user.full_name ILIKE :query`, { query: `%${query}%` })
      .limit(limit)
      .getMany();

    return {
      hashtags: [...new Set(hashtags)].slice(0, limit),
      users: users.map(u => ({
        id: u.id,
        username: u.username,
        fullName: u.fullName,
        profilePicture: u.profilePicture,
      })),
    };
  }
}

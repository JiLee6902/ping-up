import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Post, User, Connection, Bookmark, Reaction, Poll, PollVote, PollOption } from '@app/entity';
import { ConnectionStatus, PostType, ReactionType } from '@app/enum';
import { AdvancedSearchDto, SortBy, SortOrder, MediaFilter } from '../dto';
import { RedisLikeService } from '@app/external-infra/redis';

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
    @InjectRepository(Reaction)
    private readonly reactionRepository: Repository<Reaction>,
    @InjectRepository(Poll)
    private readonly pollRepository: Repository<Poll>,
    @InjectRepository(PollVote)
    private readonly pollVoteRepository: Repository<PollVote>,
    private readonly redisLikeService: RedisLikeService,
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

  async getFeedPosts(userId: string, limit = 50, offset = 0, excludeUserIds: string[] = []): Promise<Post[]> {
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

    // Combine all IDs (user + following + connections), excluding muted/blocked users
    const excludeSet = new Set(excludeUserIds);
    const allUserIds = [...new Set([userId, ...followingIds, ...connectionIds])]
      .filter((id) => !excludeSet.has(id));

    if (allUserIds.length === 0) {
      return [];
    }

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

    if (!reposterUser) {
      throw new Error('User not found');
    }

    const post = this.postRepository.create({
      userId,
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

    // Check if Redis has the likes data, if not, warm the cache
    const hasRedisData = await this.redisLikeService.hasLikesData(postId);
    if (!hasRedisData) {
      const likerIds = (post.likes || []).map((u) => u.id);
      await this.redisLikeService.syncLikesFromDb(postId, likerIds);
    }

    // Use Redis Lua script for atomic toggle
    const result = await this.redisLikeService.toggleLike(postId, userId);

    // Persist to database
    if (result.isLiked) {
      // Add like to DB
      post.likes = [...(post.likes || []), user];
      post.likesCount = result.likesCount;
    } else {
      // Remove like from DB
      post.likes = (post.likes || []).filter((u) => u.id !== userId);
      post.likesCount = Math.max(0, result.likesCount);
    }

    await this.postRepository.save(post);

    return { post, isLiked: result.isLiked, likerUser: user };
  }

  async isLikedByUser(postId: string, userId: string): Promise<boolean> {
    // Check Redis first
    const hasRedisData = await this.redisLikeService.hasLikesData(postId);
    if (hasRedisData) {
      return this.redisLikeService.isLiked(postId, userId);
    }

    // Fall back to DB and warm cache
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['likes'],
    });

    if (post?.likes) {
      const likerIds = post.likes.map((u) => u.id);
      await this.redisLikeService.syncLikesFromDb(postId, likerIds);
      return likerIds.includes(userId);
    }

    return false;
  }

  /**
   * Get like status for multiple posts using Redis batch check
   */
  async getLikeStatusForPosts(
    userId: string,
    postIds: string[],
  ): Promise<Map<string, boolean>> {
    if (postIds.length === 0) {
      return new Map();
    }

    // First, check which posts have Redis data
    const postsNeedingSync: string[] = [];
    for (const postId of postIds) {
      const hasData = await this.redisLikeService.hasLikesData(postId);
      if (!hasData) {
        postsNeedingSync.push(postId);
      }
    }

    // Warm cache for posts that don't have Redis data
    if (postsNeedingSync.length > 0) {
      const posts = await this.postRepository.find({
        where: { id: In(postsNeedingSync) },
        relations: ['likes'],
      });

      for (const post of posts) {
        const likerIds = (post.likes || []).map((u) => u.id);
        await this.redisLikeService.syncLikesFromDb(post.id, likerIds);
      }
    }

    // Now use Redis batch check
    return this.redisLikeService.checkLikesForPosts(postIds, userId);
  }

  async deletePost(postId: string): Promise<void> {
    // First delete all reposts of this post
    await this.postRepository.delete({ originalPostId: postId });
    // Then delete the post itself
    await this.postRepository.delete(postId);
    // Invalidate Redis likes cache
    await this.redisLikeService.invalidateLikesCache(postId);
  }

  async updatePost(postId: string, data: Partial<Post>): Promise<Post> {
    await this.postRepository.update(postId, data);
    const post = await this.findById(postId);
    if (!post) {
      throw new Error('Post not found after update');
    }
    return post;
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
        profilePicture: u.profilePicture || '',
      })),
    };
  }

  // Reaction methods
  async setReaction(
    postId: string,
    userId: string,
    reactionType: ReactionType,
  ): Promise<{ reaction: Reaction; isNew: boolean; previousReaction?: ReactionType }> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      relations: ['user'],
    });

    if (!post) {
      throw new Error('Post not found');
    }

    // Check for existing reaction
    const existingReaction = await this.reactionRepository.findOne({
      where: { postId, userId },
    });

    let isNew = true;
    let previousReaction: ReactionType | undefined;

    if (existingReaction) {
      previousReaction = existingReaction.reactionType;
      if (existingReaction.reactionType === reactionType) {
        // Same reaction - remove it (toggle off)
        await this.reactionRepository.delete(existingReaction.id);

        // Update reactions count
        const reactionsCount = { ...post.reactionsCount };
        if (reactionsCount[reactionType]) {
          reactionsCount[reactionType] = Math.max(0, reactionsCount[reactionType] - 1);
          if (reactionsCount[reactionType] === 0) {
            delete reactionsCount[reactionType];
          }
        }
        post.reactionsCount = reactionsCount;
        post.likesCount = Math.max(0, post.likesCount - 1);
        await this.postRepository.save(post);

        return { reaction: existingReaction, isNew: false, previousReaction };
      } else {
        // Different reaction - update it
        existingReaction.reactionType = reactionType;
        await this.reactionRepository.save(existingReaction);
        isNew = false;

        // Update reactions count
        const reactionsCount = { ...post.reactionsCount };
        // Decrease old reaction count
        if (reactionsCount[previousReaction]) {
          reactionsCount[previousReaction] = Math.max(0, reactionsCount[previousReaction] - 1);
          if (reactionsCount[previousReaction] === 0) {
            delete reactionsCount[previousReaction];
          }
        }
        // Increase new reaction count
        reactionsCount[reactionType] = (reactionsCount[reactionType] || 0) + 1;
        post.reactionsCount = reactionsCount;
        await this.postRepository.save(post);

        existingReaction.post = post;
        return { reaction: existingReaction, isNew: false, previousReaction };
      }
    }

    // Create new reaction
    const reaction = this.reactionRepository.create({
      postId,
      userId,
      reactionType,
    });
    await this.reactionRepository.save(reaction);

    // Update reactions count
    const reactionsCount = { ...post.reactionsCount };
    reactionsCount[reactionType] = (reactionsCount[reactionType] || 0) + 1;
    post.reactionsCount = reactionsCount;
    post.likesCount = post.likesCount + 1;
    await this.postRepository.save(post);

    reaction.post = post;
    return { reaction, isNew: true };
  }

  async removeReaction(postId: string, userId: string): Promise<boolean> {
    const reaction = await this.reactionRepository.findOne({
      where: { postId, userId },
    });

    if (!reaction) {
      return false;
    }

    const post = await this.postRepository.findOne({ where: { id: postId } });
    if (post) {
      // Update reactions count
      const reactionsCount = { ...post.reactionsCount };
      if (reactionsCount[reaction.reactionType]) {
        reactionsCount[reaction.reactionType] = Math.max(0, reactionsCount[reaction.reactionType] - 1);
        if (reactionsCount[reaction.reactionType] === 0) {
          delete reactionsCount[reaction.reactionType];
        }
      }
      post.reactionsCount = reactionsCount;
      post.likesCount = Math.max(0, post.likesCount - 1);
      await this.postRepository.save(post);
    }

    await this.reactionRepository.delete(reaction.id);
    return true;
  }

  async getUserReactionForPost(postId: string, userId: string): Promise<ReactionType | null> {
    const reaction = await this.reactionRepository.findOne({
      where: { postId, userId },
      select: ['reactionType'],
    });
    return reaction?.reactionType || null;
  }

  async getReactionStatusForPosts(userId: string, postIds: string[]): Promise<Map<string, ReactionType | null>> {
    if (postIds.length === 0) return new Map();

    const reactions = await this.reactionRepository.find({
      where: { userId, postId: In(postIds) },
      select: ['postId', 'reactionType'],
    });

    const statusMap = new Map<string, ReactionType | null>();
    for (const postId of postIds) {
      const reaction = reactions.find(r => r.postId === postId);
      statusMap.set(postId, reaction?.reactionType || null);
    }

    return statusMap;
  }

  async getReactionSummary(postId: string): Promise<Record<string, number>> {
    const post = await this.postRepository.findOne({
      where: { id: postId },
      select: ['reactionsCount'],
    });
    return post?.reactionsCount || {};
  }

  // Poll methods
  async createPoll(
    postId: string,
    question: string,
    options: { text: string }[],
    endsAt?: Date,
    isMultipleChoice = false,
  ): Promise<Poll> {
    const pollOptions: PollOption[] = options.map((opt, idx) => ({
      id: idx,
      text: opt.text,
      votes: 0,
    }));

    const poll = this.pollRepository.create({
      postId,
      question,
      options: pollOptions,
      endsAt,
      isMultipleChoice,
      totalVotes: 0,
    });

    return this.pollRepository.save(poll);
  }

  async getPollByPostId(postId: string): Promise<Poll | null> {
    return this.pollRepository.findOne({
      where: { postId },
    });
  }

  async votePoll(
    pollId: string,
    userId: string,
    optionId: number,
  ): Promise<{ poll: Poll; isNewVote: boolean }> {
    const poll = await this.pollRepository.findOne({
      where: { id: pollId },
    });

    if (!poll) {
      throw new Error('Poll not found');
    }

    // Check if poll has ended
    if (poll.endsAt && new Date() > poll.endsAt) {
      throw new Error('Poll has ended');
    }

    // Check if option exists
    if (!poll.options.find((opt) => opt.id === optionId)) {
      throw new Error('Invalid option');
    }

    // Check if user already voted (for single choice polls)
    if (!poll.isMultipleChoice) {
      const existingVote = await this.pollVoteRepository.findOne({
        where: { pollId, userId },
      });

      if (existingVote) {
        // Remove old vote
        const oldOptionId = existingVote.optionId;
        await this.pollVoteRepository.delete(existingVote.id);

        // Update poll options
        const options = poll.options.map((opt) => ({
          ...opt,
          votes: opt.id === oldOptionId ? Math.max(0, opt.votes - 1) : opt.votes,
        }));

        poll.options = options;
        poll.totalVotes = Math.max(0, poll.totalVotes - 1);
      }
    } else {
      // For multiple choice, check if already voted for this specific option
      const existingVoteForOption = await this.pollVoteRepository.findOne({
        where: { pollId, userId, optionId },
      });

      if (existingVoteForOption) {
        // Toggle off - remove vote
        await this.pollVoteRepository.delete(existingVoteForOption.id);

        const options = poll.options.map((opt) => ({
          ...opt,
          votes: opt.id === optionId ? Math.max(0, opt.votes - 1) : opt.votes,
        }));

        poll.options = options;
        poll.totalVotes = Math.max(0, poll.totalVotes - 1);
        await this.pollRepository.save(poll);

        return { poll, isNewVote: false };
      }
    }

    // Create new vote
    const vote = this.pollVoteRepository.create({
      pollId,
      userId,
      optionId,
    });
    await this.pollVoteRepository.save(vote);

    // Update poll options
    const options = poll.options.map((opt) => ({
      ...opt,
      votes: opt.id === optionId ? opt.votes + 1 : opt.votes,
    }));

    poll.options = options;
    poll.totalVotes = poll.totalVotes + 1;
    await this.pollRepository.save(poll);

    return { poll, isNewVote: true };
  }

  async getUserVotesForPoll(pollId: string, userId: string): Promise<number[]> {
    const votes = await this.pollVoteRepository.find({
      where: { pollId, userId },
      select: ['optionId'],
    });
    return votes.map((v) => v.optionId);
  }

  async getPollsForPosts(postIds: string[]): Promise<Map<string, Poll>> {
    if (postIds.length === 0) return new Map();

    const polls = await this.pollRepository.find({
      where: { postId: In(postIds) },
    });

    const pollMap = new Map<string, Poll>();
    for (const poll of polls) {
      pollMap.set(poll.postId, poll);
    }

    return pollMap;
  }

  async getUserVotesForPolls(
    pollIds: string[],
    userId: string,
  ): Promise<Map<string, number[]>> {
    if (pollIds.length === 0) return new Map();

    const votes = await this.pollVoteRepository.find({
      where: { pollId: In(pollIds), userId },
      select: ['pollId', 'optionId'],
    });

    const voteMap = new Map<string, number[]>();
    for (const vote of votes) {
      const existing = voteMap.get(vote.pollId) || [];
      existing.push(vote.optionId);
      voteMap.set(vote.pollId, existing);
    }

    return voteMap;
  }
}

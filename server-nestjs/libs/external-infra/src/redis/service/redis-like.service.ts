import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface ToggleLikeResult {
  isLiked: boolean;
  likesCount: number;
  wasAlreadyLiked: boolean;
}

@Injectable()
export class RedisLikeService implements OnModuleInit {
  private toggleLikeScriptSha: string = '';

  // Lua script for atomic like/unlike toggle
  // Returns: [isLiked (0 or 1), likesCount, wasAlreadyLiked (0 or 1)]
  private readonly TOGGLE_LIKE_SCRIPT = `
    local likesSetKey = KEYS[1]
    local likesCountKey = KEYS[2]
    local userId = ARGV[1]

    -- Check if user already liked
    local wasLiked = redis.call('SISMEMBER', likesSetKey, userId)

    if wasLiked == 1 then
      -- Unlike: remove from set and decrement count
      redis.call('SREM', likesSetKey, userId)
      local newCount = redis.call('DECR', likesCountKey)
      -- Ensure count doesn't go below 0
      if newCount < 0 then
        redis.call('SET', likesCountKey, 0)
        newCount = 0
      end
      return {0, newCount, 1}
    else
      -- Like: add to set and increment count
      redis.call('SADD', likesSetKey, userId)
      local newCount = redis.call('INCR', likesCountKey)
      return {1, newCount, 0}
    end
  `;

  // Lua script to check like status for multiple posts
  // Returns array of [isLiked (0 or 1)] for each post
  private readonly CHECK_LIKES_SCRIPT = `
    local userId = ARGV[1]
    local results = {}

    for i = 1, #KEYS do
      local isLiked = redis.call('SISMEMBER', KEYS[i], userId)
      results[i] = isLiked
    end

    return results
  `;

  // Lua script to sync likes from DB to Redis (warm cache)
  private readonly SYNC_LIKES_SCRIPT = `
    local likesSetKey = KEYS[1]
    local likesCountKey = KEYS[2]
    local ttl = tonumber(ARGV[1])

    -- Clear existing data first
    redis.call('DEL', likesSetKey)

    -- Add all user IDs (starting from ARGV[2])
    local count = 0
    for i = 2, #ARGV do
      redis.call('SADD', likesSetKey, ARGV[i])
      count = count + 1
    end

    -- Set the count
    redis.call('SET', likesCountKey, count)

    -- Set TTL if provided
    if ttl > 0 then
      redis.call('EXPIRE', likesSetKey, ttl)
      redis.call('EXPIRE', likesCountKey, ttl)
    end

    return count
  `;

  private checkLikesScriptSha: string = '';
  private syncLikesScriptSha: string = '';

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit(): Promise<void> {
    // Preload scripts on startup for better performance
    try {
      this.toggleLikeScriptSha = await this.redisService.scriptLoad(
        this.TOGGLE_LIKE_SCRIPT,
      );
      this.checkLikesScriptSha = await this.redisService.scriptLoad(
        this.CHECK_LIKES_SCRIPT,
      );
      this.syncLikesScriptSha = await this.redisService.scriptLoad(
        this.SYNC_LIKES_SCRIPT,
      );
    } catch {
      // If script loading fails, we'll use eval instead
      console.warn('Failed to preload Redis Lua scripts, will use eval');
    }
  }

  private getLikesSetKey(postId: string): string {
    return `post:${postId}:likes`;
  }

  private getLikesCountKey(postId: string): string {
    return `post:${postId}:likes_count`;
  }

  /**
   * Toggle like/unlike atomically using Lua script
   * Returns the new state and count
   */
  async toggleLike(postId: string, userId: string): Promise<ToggleLikeResult> {
    const likesSetKey = this.getLikesSetKey(postId);
    const likesCountKey = this.getLikesCountKey(postId);

    let result: [number, number, number];

    try {
      if (this.toggleLikeScriptSha) {
        result = await this.redisService.evalsha<[number, number, number]>(
          this.toggleLikeScriptSha,
          [likesSetKey, likesCountKey],
          [userId],
        );
      } else {
        result = await this.redisService.eval<[number, number, number]>(
          this.TOGGLE_LIKE_SCRIPT,
          [likesSetKey, likesCountKey],
          [userId],
        );
      }
    } catch {
      // NOSCRIPT error - script was evicted, reload and retry
      this.toggleLikeScriptSha = await this.redisService.scriptLoad(
        this.TOGGLE_LIKE_SCRIPT,
      );
      result = await this.redisService.evalsha<[number, number, number]>(
        this.toggleLikeScriptSha,
        [likesSetKey, likesCountKey],
        [userId],
      );
    }

    return {
      isLiked: result[0] === 1,
      likesCount: result[1],
      wasAlreadyLiked: result[2] === 1,
    };
  }

  /**
   * Check if user has liked a specific post
   */
  async isLiked(postId: string, userId: string): Promise<boolean> {
    const likesSetKey = this.getLikesSetKey(postId);
    return this.redisService.sismember(likesSetKey, userId);
  }

  /**
   * Get likes count for a post
   */
  async getLikesCount(postId: string): Promise<number> {
    const likesCountKey = this.getLikesCountKey(postId);
    const count = await this.redisService.get(likesCountKey);
    return count ? parseInt(count, 10) : 0;
  }

  /**
   * Check like status for multiple posts at once
   */
  async checkLikesForPosts(
    postIds: string[],
    userId: string,
  ): Promise<Map<string, boolean>> {
    if (postIds.length === 0) {
      return new Map();
    }

    const keys = postIds.map((id) => this.getLikesSetKey(id));

    let results: number[];

    try {
      if (this.checkLikesScriptSha) {
        results = await this.redisService.evalsha<number[]>(
          this.checkLikesScriptSha,
          keys,
          [userId],
        );
      } else {
        results = await this.redisService.eval<number[]>(
          this.CHECK_LIKES_SCRIPT,
          keys,
          [userId],
        );
      }
    } catch {
      this.checkLikesScriptSha = await this.redisService.scriptLoad(
        this.CHECK_LIKES_SCRIPT,
      );
      results = await this.redisService.evalsha<number[]>(
        this.checkLikesScriptSha,
        keys,
        [userId],
      );
    }

    const statusMap = new Map<string, boolean>();
    postIds.forEach((postId, index) => {
      statusMap.set(postId, results[index] === 1);
    });

    return statusMap;
  }

  /**
   * Sync likes from database to Redis (warm the cache)
   * @param postId - The post ID
   * @param userIds - Array of user IDs who liked the post
   * @param ttlSeconds - Optional TTL for the cache (0 = no expiry)
   */
  async syncLikesFromDb(
    postId: string,
    userIds: string[],
    ttlSeconds = 0,
  ): Promise<number> {
    const likesSetKey = this.getLikesSetKey(postId);
    const likesCountKey = this.getLikesCountKey(postId);

    try {
      if (this.syncLikesScriptSha) {
        return await this.redisService.evalsha<number>(
          this.syncLikesScriptSha,
          [likesSetKey, likesCountKey],
          [ttlSeconds, ...userIds],
        );
      } else {
        return await this.redisService.eval<number>(
          this.SYNC_LIKES_SCRIPT,
          [likesSetKey, likesCountKey],
          [ttlSeconds, ...userIds],
        );
      }
    } catch {
      this.syncLikesScriptSha = await this.redisService.scriptLoad(
        this.SYNC_LIKES_SCRIPT,
      );
      return await this.redisService.evalsha<number>(
        this.syncLikesScriptSha,
        [likesSetKey, likesCountKey],
        [ttlSeconds, ...userIds],
      );
    }
  }

  /**
   * Check if likes data exists in Redis for a post
   */
  async hasLikesData(postId: string): Promise<boolean> {
    const likesCountKey = this.getLikesCountKey(postId);
    return this.redisService.exists(likesCountKey);
  }

  /**
   * Get all user IDs who liked a post
   */
  async getLikerIds(postId: string): Promise<string[]> {
    const likesSetKey = this.getLikesSetKey(postId);
    return this.redisService.smembers(likesSetKey);
  }

  /**
   * Invalidate likes cache for a post (call when post is deleted)
   */
  async invalidateLikesCache(postId: string): Promise<void> {
    const likesSetKey = this.getLikesSetKey(postId);
    const likesCountKey = this.getLikesCountKey(postId);
    await this.redisService.del(likesSetKey);
    await this.redisService.del(likesCountKey);
  }
}

import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface TrendingPost {
  postId: string;
  score: number;
}

export enum InteractionType {
  VIEW = 'view',
  LIKE = 'like',
  COMMENT = 'comment',
  SHARE = 'share',
}

@Injectable()
export class RedisTrendingService implements OnModuleInit {
  private recordInteractionScriptSha: string = '';
  private getTrendingScriptSha: string = '';
  private removePostScriptSha: string = '';

  // Interaction weights
  private readonly WEIGHTS: Record<InteractionType, number> = {
    [InteractionType.VIEW]: 1,
    [InteractionType.LIKE]: 3,
    [InteractionType.COMMENT]: 5,
    [InteractionType.SHARE]: 7,
  };

  // Lua script: Record an interaction and update trending score
  // KEYS[1] = trending sorted set key ("trending:posts")
  // KEYS[2] = post interaction tracking hash key ("trending:post:<id>:interactions")
  // ARGV[1] = postId
  // ARGV[2] = interaction weight
  // ARGV[3] = current timestamp in seconds
  // ARGV[4] = post creation timestamp in seconds
  // ARGV[5] = half-life in hours (for decay calculation)
  // ARGV[6] = userId (for dedup)
  // ARGV[7] = interaction type (for dedup key)
  //
  // Returns: [newScore (integer), rank]
  private readonly RECORD_INTERACTION_SCRIPT = `
    local trendingKey = KEYS[1]
    local interactionKey = KEYS[2]
    local postId = ARGV[1]
    local weight = tonumber(ARGV[2])
    local nowSec = tonumber(ARGV[3])
    local createdAtSec = tonumber(ARGV[4])
    local halfLifeHours = tonumber(ARGV[5])
    local userId = ARGV[6]
    local interactionType = ARGV[7]

    -- Deduplicate: prevent same user from inflating score repeatedly
    local dedupKey = interactionKey .. ':' .. interactionType .. ':' .. userId
    if interactionType == 'view' then
      -- Views: one per user per post per hour
      local viewExists = redis.call('EXISTS', dedupKey)
      if viewExists == 1 then
        local currentScore = redis.call('ZSCORE', trendingKey, postId)
        local rank = redis.call('ZREVRANK', trendingKey, postId)
        if currentScore then
          return {math.floor(tonumber(currentScore)), rank or -1}
        end
        return {0, -1}
      end
      redis.call('SET', dedupKey, '1')
      redis.call('EXPIRE', dedupKey, 3600)
    else
      -- Like/comment/share: dedup for 24 hours
      local exists = redis.call('EXISTS', dedupKey)
      if exists == 1 then
        local currentScore = redis.call('ZSCORE', trendingKey, postId)
        local rank = redis.call('ZREVRANK', trendingKey, postId)
        if currentScore then
          return {math.floor(tonumber(currentScore)), rank or -1}
        end
        return {0, -1}
      end
      redis.call('SET', dedupKey, '1')
      redis.call('EXPIRE', dedupKey, 86400)
    end

    -- Calculate age in hours
    local ageHours = (nowSec - createdAtSec) / 3600
    if ageHours < 0 then ageHours = 0 end

    -- Time decay factor: 1 / (1 + age / halfLife)
    -- Using integer math: multiply by 10000 for precision
    local decayNumerator = 10000
    local decayDenominator = 10000 + math.floor((ageHours * 10000) / halfLifeHours)
    local scoreIncrement = math.floor((weight * decayNumerator) / decayDenominator)
    if scoreIncrement < 1 then scoreIncrement = 1 end

    -- Increment the score in the sorted set
    local newScore = redis.call('ZINCRBY', trendingKey, scoreIncrement, postId)

    -- Track total interactions for analytics
    redis.call('HINCRBY', interactionKey, interactionType, 1)
    redis.call('EXPIRE', interactionKey, 604800)

    -- Get rank (0-based, highest score = rank 0)
    local rank = redis.call('ZREVRANK', trendingKey, postId)

    return {math.floor(tonumber(newScore)), rank or -1}
  `;

  // Lua script: Get trending posts with pagination
  // KEYS[1] = trending sorted set key
  // ARGV[1] = offset
  // ARGV[2] = limit
  //
  // Returns: array of [postId, score, postId, score, ...]
  private readonly GET_TRENDING_SCRIPT = `
    local trendingKey = KEYS[1]
    local offset = tonumber(ARGV[1])
    local limit = tonumber(ARGV[2])

    -- Prune entries with score <= 0
    redis.call('ZREMRANGEBYSCORE', trendingKey, '-inf', 0)

    -- Get top posts by score (descending) with pagination
    local stopIdx = offset + limit - 1
    local results = redis.call('ZREVRANGE', trendingKey, offset, stopIdx, 'WITHSCORES')

    return results
  `;

  // Lua script: Remove a post from trending (when deleted)
  // KEYS[1] = trending sorted set key
  // ARGV[1] = postId
  private readonly REMOVE_POST_SCRIPT = `
    local trendingKey = KEYS[1]
    local postId = ARGV[1]
    redis.call('ZREM', trendingKey, postId)
    return 1
  `;

  private readonly TRENDING_KEY = 'trending:posts';

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit(): Promise<void> {
    try {
      this.recordInteractionScriptSha = await this.redisService.scriptLoad(
        this.RECORD_INTERACTION_SCRIPT,
      );
      this.getTrendingScriptSha = await this.redisService.scriptLoad(
        this.GET_TRENDING_SCRIPT,
      );
      this.removePostScriptSha = await this.redisService.scriptLoad(
        this.REMOVE_POST_SCRIPT,
      );
    } catch {
      console.warn('Failed to preload trending Lua scripts, will use eval');
    }
  }

  private getInteractionKey(postId: string): string {
    return `trending:post:${postId}:interactions`;
  }

  /**
   * Record an interaction with a post and update its trending score.
   * Uses time-decay scoring: score = weight / (1 + ageHours / halfLifeHours)
   */
  async recordInteraction(
    postId: string,
    userId: string,
    interactionType: InteractionType,
    postCreatedAt: Date,
    halfLifeHours = 6,
  ): Promise<{ score: number; rank: number }> {
    const now = Math.floor(Date.now() / 1000);
    const createdAt = Math.floor(postCreatedAt.getTime() / 1000);
    const weight = this.WEIGHTS[interactionType];
    const interactionKey = this.getInteractionKey(postId);

    let result: [number, number];

    try {
      if (this.recordInteractionScriptSha) {
        result = await this.redisService.evalsha<[number, number]>(
          this.recordInteractionScriptSha,
          [this.TRENDING_KEY, interactionKey],
          [postId, weight, now, createdAt, halfLifeHours, userId, interactionType],
        );
      } else {
        result = await this.redisService.eval<[number, number]>(
          this.RECORD_INTERACTION_SCRIPT,
          [this.TRENDING_KEY, interactionKey],
          [postId, weight, now, createdAt, halfLifeHours, userId, interactionType],
        );
      }
    } catch {
      this.recordInteractionScriptSha = await this.redisService.scriptLoad(
        this.RECORD_INTERACTION_SCRIPT,
      );
      result = await this.redisService.evalsha<[number, number]>(
        this.recordInteractionScriptSha,
        [this.TRENDING_KEY, interactionKey],
        [postId, weight, now, createdAt, halfLifeHours, userId, interactionType],
      );
    }

    return { score: result[0], rank: result[1] };
  }

  /**
   * Get trending posts with pagination.
   * Returns post IDs sorted by trending score (highest first).
   */
  async getTrendingPosts(
    limit = 20,
    offset = 0,
  ): Promise<TrendingPost[]> {
    let results: string[];

    try {
      if (this.getTrendingScriptSha) {
        results = await this.redisService.evalsha<string[]>(
          this.getTrendingScriptSha,
          [this.TRENDING_KEY],
          [offset, limit],
        );
      } else {
        results = await this.redisService.eval<string[]>(
          this.GET_TRENDING_SCRIPT,
          [this.TRENDING_KEY],
          [offset, limit],
        );
      }
    } catch {
      this.getTrendingScriptSha = await this.redisService.scriptLoad(
        this.GET_TRENDING_SCRIPT,
      );
      results = await this.redisService.evalsha<string[]>(
        this.getTrendingScriptSha,
        [this.TRENDING_KEY],
        [offset, limit],
      );
    }

    // Parse results: [postId, score, postId, score, ...]
    const trending: TrendingPost[] = [];
    for (let i = 0; i < results.length; i += 2) {
      trending.push({
        postId: results[i],
        score: parseFloat(results[i + 1]),
      });
    }

    return trending;
  }

  /**
   * Remove a post from the trending leaderboard (e.g., when post is deleted).
   */
  async removePost(postId: string): Promise<void> {
    try {
      if (this.removePostScriptSha) {
        await this.redisService.evalsha(
          this.removePostScriptSha,
          [this.TRENDING_KEY],
          [postId],
        );
      } else {
        await this.redisService.eval(
          this.REMOVE_POST_SCRIPT,
          [this.TRENDING_KEY],
          [postId],
        );
      }
    } catch {
      this.removePostScriptSha = await this.redisService.scriptLoad(
        this.REMOVE_POST_SCRIPT,
      );
      await this.redisService.evalsha(
        this.removePostScriptSha,
        [this.TRENDING_KEY],
        [postId],
      );
    }
  }

  /**
   * Get interaction analytics for a specific post.
   */
  async getPostInteractions(postId: string): Promise<Record<string, number>> {
    const key = this.getInteractionKey(postId);
    const client = this.redisService.getClient();
    const data = await client.hgetall(key);
    const result: Record<string, number> = {};
    for (const [type, count] of Object.entries(data)) {
      result[type] = parseInt(count, 10);
    }
    return result;
  }
}

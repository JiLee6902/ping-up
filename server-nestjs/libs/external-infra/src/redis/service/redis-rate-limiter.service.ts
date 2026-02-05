import { Injectable, OnModuleInit } from '@nestjs/common';
import { RedisService } from './redis.service';

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

@Injectable()
export class RedisRateLimiterService implements OnModuleInit {
  private slidingWindowScriptSha: string = '';

  // Lua script: Sliding Window Rate Limiter
  // KEYS[1] = rate limit key (e.g., "ratelimit:login:<ip>")
  // ARGV[1] = current timestamp in milliseconds
  // ARGV[2] = window size in milliseconds
  // ARGV[3] = max requests allowed in window
  // ARGV[4] = unique request ID
  //
  // Returns: [allowed (0/1), remaining, retryAfterMs]
  private readonly SLIDING_WINDOW_SCRIPT = `
    local key = KEYS[1]
    local now = tonumber(ARGV[1])
    local windowMs = tonumber(ARGV[2])
    local maxRequests = tonumber(ARGV[3])
    local requestId = ARGV[4]

    local windowStart = now - windowMs

    -- Remove all entries outside the sliding window
    redis.call('ZREMRANGEBYSCORE', key, '-inf', windowStart)

    -- Count current entries in the window
    local currentCount = redis.call('ZCARD', key)

    if currentCount < maxRequests then
      -- Request allowed: add to sorted set with timestamp as score
      redis.call('ZADD', key, now, requestId)
      -- Set TTL to window size (auto-cleanup)
      redis.call('PEXPIRE', key, windowMs)
      local remaining = maxRequests - currentCount - 1
      return {1, remaining, 0}
    else
      -- Request denied: calculate when oldest entry expires
      local oldest = redis.call('ZRANGE', key, 0, 0, 'WITHSCORES')
      local retryAfter = 0
      if #oldest >= 2 then
        retryAfter = tonumber(oldest[2]) + windowMs - now
        if retryAfter < 0 then retryAfter = 0 end
      end
      return {0, 0, retryAfter}
    end
  `;

  constructor(private readonly redisService: RedisService) {}

  async onModuleInit(): Promise<void> {
    try {
      this.slidingWindowScriptSha = await this.redisService.scriptLoad(
        this.SLIDING_WINDOW_SCRIPT,
      );
    } catch {
      console.warn('Failed to preload rate limiter Lua script, will use eval');
    }
  }

  private getKey(action: string, identifier: string): string {
    return `ratelimit:${action}:${identifier}`;
  }

  /**
   * Check if a request is allowed under the sliding window rate limit.
   * Uses Redis sorted sets + Lua for atomic sliding window algorithm.
   */
  async checkRateLimit(
    action: string,
    identifier: string,
    maxRequests: number,
    windowMs: number,
  ): Promise<RateLimitResult> {
    const key = this.getKey(action, identifier);
    const now = Date.now();
    const requestId = `${now}:${Math.random().toString(36).substring(2, 10)}`;

    let result: [number, number, number];

    try {
      if (this.slidingWindowScriptSha) {
        result = await this.redisService.evalsha<[number, number, number]>(
          this.slidingWindowScriptSha,
          [key],
          [now, windowMs, maxRequests, requestId],
        );
      } else {
        result = await this.redisService.eval<[number, number, number]>(
          this.SLIDING_WINDOW_SCRIPT,
          [key],
          [now, windowMs, maxRequests, requestId],
        );
      }
    } catch {
      // NOSCRIPT error - script was evicted, reload and retry
      this.slidingWindowScriptSha = await this.redisService.scriptLoad(
        this.SLIDING_WINDOW_SCRIPT,
      );
      result = await this.redisService.evalsha<[number, number, number]>(
        this.slidingWindowScriptSha,
        [key],
        [now, windowMs, maxRequests, requestId],
      );
    }

    return {
      allowed: result[0] === 1,
      remaining: result[1],
      retryAfterMs: result[2],
    };
  }

  /** Login: 5 attempts per 15 minutes per IP */
  async checkLoginLimit(ip: string): Promise<RateLimitResult> {
    return this.checkRateLimit('login', ip, 5, 15 * 60 * 1000);
  }

  /** Register: 3 attempts per hour per IP */
  async checkRegisterLimit(ip: string): Promise<RateLimitResult> {
    return this.checkRateLimit('register', ip, 3, 60 * 60 * 1000);
  }

  /** Guest login: 5 attempts per hour per IP */
  async checkGuestLoginLimit(ip: string): Promise<RateLimitResult> {
    return this.checkRateLimit('guest_login', ip, 5, 60 * 60 * 1000);
  }

  /** Message send: 60 per minute per user */
  async checkMessageSendLimit(userId: string): Promise<RateLimitResult> {
    return this.checkRateLimit('message_send', userId, 60, 60 * 1000);
  }

  /** Reset rate limit for a specific action/identifier */
  async resetRateLimit(action: string, identifier: string): Promise<void> {
    const key = this.getKey(action, identifier);
    await this.redisService.del(key);
  }
}

import { Injectable } from '@nestjs/common';
import { RedisService } from './redis.service';

@Injectable()
export class RedisCacheService {
  constructor(private readonly redisService: RedisService) {}

  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttlSeconds = 300,
  ): Promise<T> {
    const cached = await this.redisService.get(key);
    if (cached) {
      return JSON.parse(cached) as T;
    }

    const value = await factory();
    await this.redisService.set(key, JSON.stringify(value), ttlSeconds);
    return value;
  }

  async invalidate(key: string): Promise<void> {
    await this.redisService.del(key);
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.redisService.keys(pattern);
    for (const key of keys) {
      await this.redisService.del(key);
    }
  }

  async setJson<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    await this.redisService.set(key, JSON.stringify(value), ttlSeconds);
  }

  async getJson<T>(key: string): Promise<T | null> {
    const value = await this.redisService.get(key);
    if (!value) return null;
    return JSON.parse(value) as T;
  }
}

import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { RedisService } from './service/redis.service';
import { RedisCacheService } from './service/redis-cache.service';
import { RedisLikeService } from './service/redis-like.service';
import { RedisRateLimiterService } from './service/redis-rate-limiter.service';
import { RedisTrendingService } from './service/redis-trending.service';
import { RedisPresenceService } from './service/redis-presence.service';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: 'REDIS_CLIENT',
      useFactory: async (configService: ConfigService) => {
        const Redis = (await import('ioredis')).default;
        return new Redis({
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
          password: configService.get<string>('REDIS_PASSWORD', ''),
        });
      },
      inject: [ConfigService],
    },
    RedisService,
    RedisCacheService,
    RedisLikeService,
    RedisRateLimiterService,
    RedisTrendingService,
    RedisPresenceService,
  ],
  exports: [
    'REDIS_CLIENT',
    RedisService,
    RedisCacheService,
    RedisLikeService,
    RedisRateLimiterService,
    RedisTrendingService,
    RedisPresenceService,
  ],
})
export class RedisModule {}

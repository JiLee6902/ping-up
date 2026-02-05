import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RedisRateLimiterService } from '@app/external-infra/redis';

export const RATE_LIMIT_KEY = 'RATE_LIMIT';

export interface RateLimitConfig {
  action: string;
  maxRequests: number;
  windowMs: number;
  identifierType: 'ip' | 'user' | 'ip_and_user';
}

@Injectable()
export class RedisThrottlerGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly rateLimiter: RedisRateLimiterService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const config = this.reflector.getAllAndOverride<RateLimitConfig>(
      RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!config) return true;

    const request = context.switchToHttp().getRequest();
    let identifier: string;

    if (config.identifierType === 'user') {
      identifier = request.user?.id || request.ip;
    } else if (config.identifierType === 'ip_and_user') {
      identifier = `${request.ip}:${request.user?.id || 'anon'}`;
    } else {
      identifier = request.ip;
    }

    const result = await this.rateLimiter.checkRateLimit(
      config.action,
      identifier,
      config.maxRequests,
      config.windowMs,
    );

    // Set rate limit headers
    const response = context.switchToHttp().getResponse();
    response.setHeader('X-RateLimit-Limit', config.maxRequests);
    response.setHeader('X-RateLimit-Remaining', result.remaining);

    if (!result.allowed) {
      response.setHeader(
        'Retry-After',
        Math.ceil(result.retryAfterMs / 1000),
      );
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: 'Too many requests. Please try again later.',
          retryAfterMs: result.retryAfterMs,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    return true;
  }
}

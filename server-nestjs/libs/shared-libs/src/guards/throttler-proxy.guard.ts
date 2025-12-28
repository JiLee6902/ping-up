import { Injectable, ExecutionContext } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class ThrottlerBehindProxyGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, unknown>): Promise<string> {
    const xForwardedFor = req['x-forwarded-for'] as string | undefined;
    const ip = req['ip'] as string;

    return xForwardedFor ? xForwardedFor.split(',')[0].trim() : ip;
  }

  protected async shouldSkip(_context: ExecutionContext): Promise<boolean> {
    return false;
  }
}

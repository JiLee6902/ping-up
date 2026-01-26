import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionTier } from '@app/enum';
import { IS_PREMIUM_KEY } from '../decorators/premium.decorator';

@Injectable()
export class PremiumGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPremiumRequired = this.reflector.getAllAndOverride<boolean>(IS_PREMIUM_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // If route doesn't require premium, allow access
    if (!isPremiumRequired) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Authentication required');
    }

    // Check if user has premium subscription
    // The user object should contain subscriptionTier from JWT or from database lookup
    if (user.subscriptionTier !== SubscriptionTier.PREMIUM) {
      throw new ForbiddenException(
        'This feature requires a Premium subscription. Upgrade to Premium to access this feature.',
      );
    }

    return true;
  }
}

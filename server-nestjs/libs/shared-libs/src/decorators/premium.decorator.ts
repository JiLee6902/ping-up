import { SetMetadata } from '@nestjs/common';

export const IS_PREMIUM_KEY = 'isPremiumRequired';
export const Premium = () => SetMetadata(IS_PREMIUM_KEY, true);

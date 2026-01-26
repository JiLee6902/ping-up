import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, User as CurrentUser } from '@app/shared-libs';
import { SubscriptionService } from '../service/subscription.service';
import { PurchaseSubscriptionDto } from '../dto';

interface CurrentUserPayload {
  id: string;
  email: string;
  username: string;
}

@Controller('subscription')
@UseGuards(JwtAuthGuard)
export class SubscriptionController {
  constructor(private readonly subscriptionService: SubscriptionService) {}

  @Get('status')
  async getStatus(@CurrentUser() user: CurrentUserPayload) {
    return this.subscriptionService.getStatus(user.id);
  }

  @Post('purchase')
  async purchase(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: PurchaseSubscriptionDto,
  ) {
    return this.subscriptionService.purchasePremium(user.id, dto.plan);
  }

  @Get('plans')
  async getPlans() {
    return this.subscriptionService.getPlans();
  }
}

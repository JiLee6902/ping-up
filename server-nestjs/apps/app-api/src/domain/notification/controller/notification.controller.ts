import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard, User as CurrentUser } from '@app/shared-libs';
import { NotificationService } from '../service/notification.service';

interface CurrentUserPayload {
  id: string;
  email: string;
  username: string;
}

@Controller('notification')
@UseGuards(JwtAuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  async getNotifications(
    @CurrentUser() user: CurrentUserPayload,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.notificationService.getNotifications(user.id, limit, offset);
  }

  @Get('unread-count')
  async getUnreadCount(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationService.getUnreadCount(user.id);
  }

  @Post(':notificationId/read')
  async markAsRead(
    @CurrentUser() user: CurrentUserPayload,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.markAsRead(user.id, notificationId);
  }

  @Post('read-all')
  async markAllAsRead(@CurrentUser() user: CurrentUserPayload) {
    return this.notificationService.markAllAsRead(user.id);
  }

  @Delete(':notificationId')
  async deleteNotification(
    @CurrentUser() user: CurrentUserPayload,
    @Param('notificationId') notificationId: string,
  ) {
    return this.notificationService.deleteNotification(user.id, notificationId);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, Public, User as CurrentUser } from '@app/shared-libs';
import { UserService } from '../service/user.service';
import {
  UpdateUserDto,
  DiscoverDto,
  FollowDto,
  ConnectionRequestDto,
  AcceptConnectionDto,
} from '../dto';

interface CurrentUserPayload {
  id: string;
  email: string;
  username: string;
}

@Controller('user')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('data')
  async getUserData(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.getUserData(user.id);
  }

  @Post('update')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'profile_picture', maxCount: 1 },
      { name: 'cover_photo', maxCount: 1 },
    ]),
  )
  async updateUserData(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateUserDto,
    @UploadedFiles()
    files?: {
      profile_picture?: Express.Multer.File[];
      cover_photo?: Express.Multer.File[];
    },
  ) {
    return this.userService.updateUserData(user.id, dto, files);
  }

  @Post('discover')
  async discoverUsers(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: DiscoverDto,
  ) {
    return this.userService.discoverUsers(user.id, dto);
  }

  @Post('follow')
  async followUser(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: FollowDto,
  ) {
    return this.userService.followUser(user.id, dto);
  }

  @Post('unfollow')
  async unfollowUser(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: FollowDto,
  ) {
    return this.userService.unfollowUser(user.id, dto);
  }

  @Post('connect')
  async sendConnectionRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: ConnectionRequestDto,
  ) {
    return this.userService.sendConnectionRequest(user.id, dto);
  }

  @Post('accept')
  async acceptConnectionRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AcceptConnectionDto,
  ) {
    return this.userService.acceptConnectionRequest(user.id, dto);
  }

  @Post('cancel-request')
  async cancelConnectionRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AcceptConnectionDto,
  ) {
    return this.userService.cancelConnectionRequest(user.id, dto);
  }

  @Post('reject')
  async rejectConnectionRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AcceptConnectionDto,
  ) {
    return this.userService.rejectConnectionRequest(user.id, dto);
  }

  @Post('remove-connection')
  async removeConnection(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AcceptConnectionDto,
  ) {
    return this.userService.removeConnection(user.id, dto);
  }

  @Get('connections')
  async getUserConnections(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.getUserConnections(user.id);
  }

  @Post('profiles')
  async getUserProfile(
    @CurrentUser() user: CurrentUserPayload,
    @Body('userId') userId?: string,
    @Body('username') username?: string,
  ) {
    return this.userService.getUserProfile(userId, user?.id, username);
  }

  @Get('recent-messages')
  async getRecentMessages(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.getRecentMessages(user.id);
  }

  @Post('online-status')
  async getOnlineStatus(@Body('userIds') userIds: string[]) {
    return this.userService.getOnlineStatus(userIds);
  }

  @Post('toggle-privacy')
  async togglePrivacy(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.togglePrivacy(user.id);
  }

  @Post('accept-follow')
  async acceptFollowRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AcceptConnectionDto,
  ) {
    return this.userService.acceptFollowRequest(user.id, dto);
  }

  @Post('reject-follow')
  async rejectFollowRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AcceptConnectionDto,
  ) {
    return this.userService.rejectFollowRequest(user.id, dto);
  }

  @Post('cancel-follow')
  async cancelFollowRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: FollowDto,
  ) {
    return this.userService.cancelFollowRequest(user.id, dto);
  }

  @Post('remove-follower')
  async removeFollower(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: FollowDto,
  ) {
    return this.userService.removeFollower(user.id, dto);
  }

  @Post('block')
  async blockUser(
    @CurrentUser() user: CurrentUserPayload,
    @Body('userId') targetUserId: string,
    @Body('reason') reason?: string,
  ) {
    return this.userService.blockUser(user.id, targetUserId, reason);
  }

  @Post('unblock')
  async unblockUser(
    @CurrentUser() user: CurrentUserPayload,
    @Body('userId') targetUserId: string,
  ) {
    return this.userService.unblockUser(user.id, targetUserId);
  }

  @Get('blocked')
  async getBlockedUsers(@CurrentUser() user: CurrentUserPayload) {
    return this.userService.getBlockedUsers(user.id);
  }

  @Post('check-blocked')
  async checkBlocked(
    @CurrentUser() user: CurrentUserPayload,
    @Body('userId') targetUserId: string,
  ) {
    return this.userService.isBlocked(user.id, targetUserId);
  }

  @Get(':userId/followers')
  async getFollowers(
    @CurrentUser() user: CurrentUserPayload,
    @Param('userId') targetUserId: string,
    @Query('search') search?: string,
  ) {
    return this.userService.getFollowersList(user.id, targetUserId, search);
  }

  @Get(':userId/following')
  async getFollowing(
    @CurrentUser() user: CurrentUserPayload,
    @Param('userId') targetUserId: string,
    @Query('search') search?: string,
  ) {
    return this.userService.getFollowingList(user.id, targetUserId, search);
  }
}

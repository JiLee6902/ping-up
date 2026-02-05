import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, User as CurrentUser } from '@app/shared-libs';
import { GroupChatService } from '../service/group-chat.service';
import {
  CreateGroupChatDto,
  UpdateGroupChatDto,
  AddMemberDto,
  RemoveMemberDto,
  SendGroupMessageDto,
  GetGroupMessagesDto,
  UpdateMemberSettingsDto,
  UpdateMemberRoleDto,
} from '../dto';

interface CurrentUserPayload {
  id: string;
  email: string;
  username: string;
}

@Controller('group-chat')
@UseGuards(JwtAuthGuard)
export class GroupChatController {
  constructor(private readonly groupChatService: GroupChatService) {}

  @Post('create')
  @UseInterceptors(FileInterceptor('avatar'))
  async createGroup(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateGroupChatDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.groupChatService.createGroupChat(user.id, dto, file);
  }

  @Post('update')
  @UseInterceptors(FileInterceptor('avatar'))
  async updateGroup(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateGroupChatDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.groupChatService.updateGroupChat(user.id, dto, file);
  }

  @Get('my-groups')
  async getMyGroups(@CurrentUser() user: CurrentUserPayload) {
    return this.groupChatService.getMyGroups(user.id);
  }

  @Get(':groupId')
  async getGroup(
    @CurrentUser() user: CurrentUserPayload,
    @Param('groupId') groupId: string,
  ) {
    return this.groupChatService.getGroup(user.id, groupId);
  }

  @Delete(':groupId')
  async deleteGroup(
    @CurrentUser() user: CurrentUserPayload,
    @Param('groupId') groupId: string,
  ) {
    return this.groupChatService.deleteGroup(user.id, groupId);
  }

  @Post('add-members')
  async addMembers(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: AddMemberDto,
  ) {
    return this.groupChatService.addMembers(user.id, dto);
  }

  @Post('remove-member')
  async removeMember(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: RemoveMemberDto,
  ) {
    return this.groupChatService.removeMember(user.id, dto);
  }

  @Post('leave')
  async leaveGroup(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: { groupId: string },
  ) {
    return this.groupChatService.removeMember(user.id, {
      groupId: dto.groupId,
      userId: user.id,
    });
  }

  @Post('update-role')
  async updateMemberRole(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.groupChatService.updateMemberRole(user.id, dto);
  }

  @Post('settings')
  async updateMemberSettings(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateMemberSettingsDto,
  ) {
    return this.groupChatService.updateMemberSettings(user.id, dto);
  }

  @Post('send-message')
  @UseInterceptors(FileInterceptor('image'))
  async sendMessage(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SendGroupMessageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.groupChatService.sendMessage(user.id, dto, file);
  }

  @Post('messages')
  async getMessages(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: GetGroupMessagesDto,
  ) {
    return this.groupChatService.getMessages(user.id, dto);
  }

  @Post('mark-read')
  async markAsRead(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: { groupId: string },
  ) {
    return this.groupChatService.markAsRead(user.id, dto.groupId);
  }

  @Post('message/delete')
  async deleteMessage(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: { messageId: string },
  ) {
    return this.groupChatService.deleteMessage(user.id, dto.messageId);
  }

  @Post('message/unsend')
  async unsendMessage(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: { messageId: string },
  ) {
    return this.groupChatService.unsendMessage(user.id, dto.messageId);
  }
}

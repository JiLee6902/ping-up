import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, User as CurrentUser } from '@app/shared-libs';
import { MessageService } from '../service/message.service';
import { SendMessageDto, GetMessagesDto, UpdateChatSettingsDto, GetChatSettingsDto } from '../dto';

interface CurrentUserPayload {
  id: string;
  email: string;
  username: string;
}

@Controller('message')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Post('send')
  @UseInterceptors(FileInterceptor('image'))
  async sendMessage(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SendMessageDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.messageService.sendMessage(user.id, dto, file);
  }

  @Post('get')
  async getChatMessages(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: GetMessagesDto,
  ) {
    return this.messageService.getChatMessages(user.id, dto);
  }

  @Get('recent')
  async getRecentMessages(@CurrentUser() user: CurrentUserPayload) {
    return this.messageService.getRecentMessages(user.id);
  }

  @Get('chats')
  async getRecentChats(@CurrentUser() user: CurrentUserPayload) {
    return this.messageService.getRecentChats(user.id);
  }

  @Post('settings/get')
  async getChatSettings(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: GetChatSettingsDto,
  ) {
    return this.messageService.getChatSettings(user.id, dto);
  }

  @Post('settings/get-other')
  async getOtherUserSettings(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: GetChatSettingsDto,
  ) {
    return this.messageService.getOtherUserSettings(user.id, dto);
  }

  @Post('settings/update')
  async updateChatSettings(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: UpdateChatSettingsDto,
  ) {
    return this.messageService.updateChatSettings(user.id, dto);
  }

  @Post('settings/background')
  @UseInterceptors(FileInterceptor('image'))
  async uploadChatBackground(
    @CurrentUser() user: CurrentUserPayload,
    @Body('chatWithUserId') chatWithUserId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.messageService.uploadChatBackground(user.id, chatWithUserId, file);
  }

  @Post('settings/set-partner-nickname')
  async setPartnerNickname(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: { chatWithUserId: string; nickname: string | null },
  ) {
    return this.messageService.setPartnerNickname(user.id, dto.chatWithUserId, dto.nickname);
  }

  @Post('events')
  async getChatEvents(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: { chatWithUserId: string },
  ) {
    return this.messageService.getChatEvents(user.id, dto.chatWithUserId);
  }

  @Post('mark-seen')
  async markMessagesSeen(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: { fromUserId: string },
  ) {
    return this.messageService.markMessagesSeen(user.id, dto.fromUserId);
  }

  @Post('delete-chat')
  async deleteChat(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: { chatWithUserId: string },
  ) {
    return this.messageService.deleteChat(user.id, dto.chatWithUserId);
  }
}

import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FileFieldsInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard, User as CurrentUser, RateLimit, RedisThrottlerGuard } from '@app/shared-libs';
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
  @UseGuards(RedisThrottlerGuard)
  @RateLimit({ action: 'message_send', maxRequests: 60, windowMs: 60 * 1000, identifierType: 'user' })
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'image', maxCount: 1 },
    { name: 'audio', maxCount: 1 },
  ]))
  async sendMessage(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: SendMessageDto,
    @UploadedFiles() files?: { image?: Express.Multer.File[]; audio?: Express.Multer.File[] },
  ) {
    const imageFile = files?.image?.[0];
    const audioFile = files?.audio?.[0];
    return this.messageService.sendMessage(user.id, dto, imageFile, audioFile);
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

  @Get('requests')
  async getMessageRequests(@CurrentUser() user: CurrentUserPayload) {
    return this.messageService.getMessageRequests(user.id);
  }

  @Post('requests/accept')
  async acceptMessageRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: { fromUserId: string },
  ) {
    return this.messageService.acceptMessageRequest(user.id, dto.fromUserId);
  }

  @Post('requests/decline')
  async declineMessageRequest(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: { fromUserId: string },
  ) {
    return this.messageService.declineMessageRequest(user.id, dto.fromUserId);
  }

  @Post('delete')
  async deleteMessage(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: { messageId: string },
  ) {
    return this.messageService.deleteMessage(user.id, dto.messageId);
  }

  @Post('unsend')
  async unsendMessage(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: { messageId: string },
  ) {
    return this.messageService.unsendMessage(user.id, dto.messageId);
  }
}

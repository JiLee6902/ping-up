import { Controller, Post, Get, Body, UseGuards, Param } from '@nestjs/common';
import { JwtAuthGuard } from '@app/shared-libs/guards';
import { User as GetUser, CurrentUser } from '@app/shared-libs/decorators';
import { EncryptionService } from '../service/encryption.service';
import { UploadKeyBundleDto } from '../dto';

@Controller('encryption')
@UseGuards(JwtAuthGuard)
export class EncryptionController {
  constructor(private readonly encryptionService: EncryptionService) {}

  @Post('keys/upload')
  async uploadKeyBundle(
    @GetUser() user: CurrentUser,
    @Body() dto: UploadKeyBundleDto,
  ) {
    return this.encryptionService.uploadKeyBundle(user.id, dto);
  }

  @Get('keys/status/me')
  async getMyKeyStatus(@GetUser() user: CurrentUser) {
    return this.encryptionService.hasKeyBundle(user.id);
  }

  @Get('keys/:userId')
  async getKeyBundle(@Param('userId') userId: string) {
    return this.encryptionService.getKeyBundle(userId);
  }
}

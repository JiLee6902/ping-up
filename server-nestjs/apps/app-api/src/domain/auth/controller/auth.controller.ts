import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from '../service/auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, VerifyTwoFactorDto, LoginTwoFactorDto, GuestLoginDto } from '../dto';
import { JwtAuthGuard, Public, User as CurrentUser, RateLimit, RedisThrottlerGuard } from '@app/shared-libs';

interface CurrentUserPayload {
  id: string;
  email: string;
  username: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @UseGuards(RedisThrottlerGuard)
  @RateLimit({ action: 'register', maxRequests: 3, windowMs: 60 * 60 * 1000, identifierType: 'ip' })
  async register(@Body() dto: RegisterDto & { guestUserId?: string }) {
    return this.authService.register(dto, dto.guestUserId);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RedisThrottlerGuard)
  @RateLimit({ action: 'login', maxRequests: 5, windowMs: 15 * 60 * 1000, identifierType: 'ip' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('guest')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RedisThrottlerGuard)
  @RateLimit({ action: 'guest_login', maxRequests: 5, windowMs: 60 * 60 * 1000, identifierType: 'ip' })
  async guestLogin(@Body() dto: GuestLoginDto) {
    return this.authService.guestLogin(dto);
  }

  @Public()
  @Post('login/2fa')
  @HttpCode(HttpStatus.OK)
  async loginWithTwoFactor(@Body() dto: LoginTwoFactorDto) {
    return this.authService.loginWithTwoFactor(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(@Body() dto: RefreshTokenDto) {
    return this.authService.refresh(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(@Body() dto: RefreshTokenDto) {
    return this.authService.logout(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  async logoutAll(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.logoutAll(user.id);
  }

  // Two-Factor Authentication Endpoints

  @UseGuards(JwtAuthGuard)
  @Get('2fa/status')
  async getTwoFactorStatus(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.getTwoFactorStatus(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/setup')
  async setupTwoFactor(@CurrentUser() user: CurrentUserPayload) {
    return this.authService.setupTwoFactor(user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/enable')
  @HttpCode(HttpStatus.OK)
  async enableTwoFactor(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: VerifyTwoFactorDto,
  ) {
    return this.authService.verifyAndEnableTwoFactor(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/disable')
  @HttpCode(HttpStatus.OK)
  async disableTwoFactor(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: VerifyTwoFactorDto,
  ) {
    return this.authService.disableTwoFactor(user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('2fa/regenerate-backup-codes')
  @HttpCode(HttpStatus.OK)
  async regenerateBackupCodes(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: VerifyTwoFactorDto,
  ) {
    return this.authService.regenerateBackupCodes(user.id, dto);
  }
}

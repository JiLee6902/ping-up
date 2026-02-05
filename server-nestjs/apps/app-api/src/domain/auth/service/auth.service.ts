import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { authenticator } from 'otplib';
import * as QRCode from 'qrcode';
import { AuthRepository } from '../repository/auth.repository';
import { RegisterDto, LoginDto, RefreshTokenDto, VerifyTwoFactorDto, LoginTwoFactorDto, GuestLoginDto } from '../dto';

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: {
    user: {
      id: string;
      email: string;
      username: string;
      fullName: string;
    };
    tokens: TokenResponse;
  };
}

@Injectable()
export class AuthService {
  private static readonly MAX_GUEST_VISITS = 3;

  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto, guestUserId?: string): Promise<AuthResponse> {
    // Guest conversion flow
    if (guestUserId) {
      const guestUser = await this.authRepository.findGuestUserById(guestUserId);
      if (guestUser) {
        const existingEmail = await this.authRepository.findUserByEmail(dto.email);
        if (existingEmail && existingEmail.id !== guestUser.id) {
          throw new ConflictException('Email already registered');
        }
        const existingUsername = await this.authRepository.findUserByUsername(dto.username);
        if (existingUsername && existingUsername.id !== guestUser.id) {
          throw new ConflictException('Username already taken');
        }

        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const converted = await this.authRepository.convertGuestToRegular(guestUser.id, {
          email: dto.email,
          password: hashedPassword,
          fullName: dto.fullName,
          username: dto.username,
        });

        const tokens = await this.generateTokens(converted.id, converted.email);

        return {
          success: true,
          message: 'Account created successfully',
          data: {
            user: {
              id: converted.id,
              email: converted.email,
              username: converted.username,
              fullName: converted.fullName,
            },
            tokens,
          },
        };
      }
    }

    // Standard registration flow
    const existingEmail = await this.authRepository.findUserByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    const existingUsername = await this.authRepository.findUserByUsername(dto.username);
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.authRepository.createUser({
      email: dto.email,
      password: hashedPassword,
      fullName: dto.fullName,
      username: dto.username,
      bio: '',
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email);

    return {
      success: true,
      message: 'Registration successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
        },
        tokens,
      },
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse | { requiresTwoFactor: true; tempToken: string }> {
    const user = await this.authRepository.findUserByEmail(dto.email);
    if (!user) {
      throw new NotFoundException('Account not found');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      // Generate a temporary token for 2FA verification
      const tempToken = this.jwtService.sign(
        { sub: user.id, email: user.email, twoFactorPending: true },
        { expiresIn: '5m' },
      );
      return {
        requiresTwoFactor: true,
        tempToken,
      };
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
        },
        tokens,
      },
    };
  }

  async guestLogin(dto: GuestLoginDto): Promise<AuthResponse> {
    // Returning guest user
    if (dto.guestUserId) {
      const existingGuest = await this.authRepository.findGuestUserById(dto.guestUserId);

      if (existingGuest) {
        if (existingGuest.guestVisitCount >= AuthService.MAX_GUEST_VISITS) {
          throw new UnauthorizedException(
            'Guest access limit reached. Please register to continue using PingUp.',
          );
        }

        await this.authRepository.incrementGuestVisitCount(existingGuest.id);
        const tokens = await this.generateTokens(existingGuest.id, existingGuest.email);

        return {
          success: true,
          message: 'Guest login successful',
          data: {
            user: {
              id: existingGuest.id,
              email: existingGuest.email,
              username: existingGuest.username,
              fullName: existingGuest.fullName,
            },
            tokens,
          },
        };
      }
    }

    // New guest user
    const randomSuffix = Math.floor(10000 + Math.random() * 90000).toString();
    const guestEmail = `guest_${randomSuffix}@pingup.local`;
    const guestUsername = `guest_${randomSuffix}`;
    const guestFullName = `Guest #${randomSuffix}`;
    const guestPassword = await bcrypt.hash(uuidv4(), 10);

    const user = await this.authRepository.createUser({
      email: guestEmail,
      password: guestPassword,
      fullName: guestFullName,
      username: guestUsername,
      bio: 'Guest user exploring PingUp',
      isGuest: true,
      guestVisitCount: 1,
    });

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      success: true,
      message: 'Guest account created',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
        },
        tokens,
      },
    };
  }

  async loginWithTwoFactor(dto: LoginTwoFactorDto): Promise<AuthResponse> {
    // Verify temp token
    let payload: any;
    try {
      payload = this.jwtService.verify(dto.tempToken);
      if (!payload.twoFactorPending) {
        throw new Error();
      }
    } catch {
      throw new UnauthorizedException('Invalid or expired session');
    }

    const user = await this.authRepository.findUserById(payload.sub);
    if (!user || !user.twoFactorEnabled) {
      throw new UnauthorizedException('Invalid session');
    }

    // Check if code is a backup code (8 characters)
    let isValid = false;
    if (dto.code.length === 8) {
      // Check backup codes
      const backupCodes = user.twoFactorBackupCodes || [];
      const hashedCode = await bcrypt.hash(dto.code, 10);
      const codeIndex = backupCodes.findIndex(async (bc) => await bcrypt.compare(dto.code, bc));

      // Simple backup code check (they're stored as hashes)
      for (let i = 0; i < backupCodes.length; i++) {
        if (await bcrypt.compare(dto.code, backupCodes[i])) {
          isValid = true;
          // Remove used backup code
          backupCodes.splice(i, 1);
          await this.authRepository.updateBackupCodes(user.id, backupCodes);
          break;
        }
      }
    } else {
      // Check TOTP code
      isValid = authenticator.verify({
        token: dto.code,
        secret: user.twoFactorSecret!,
      });
    }

    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    const tokens = await this.generateTokens(user.id, user.email);

    return {
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
          fullName: user.fullName,
        },
        tokens,
      },
    };
  }

  async refresh(dto: RefreshTokenDto): Promise<TokenResponse> {
    const tokenRecord = await this.authRepository.findRefreshToken(dto.refreshToken);
    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Delete old refresh token
    await this.authRepository.deleteRefreshToken(dto.refreshToken);

    // Generate new tokens
    const tokens = await this.generateTokens(
      tokenRecord.user.id,
      tokenRecord.user.email,
    );

    return tokens;
  }

  async logout(refreshToken: string): Promise<{ success: boolean; message: string }> {
    await this.authRepository.deleteRefreshToken(refreshToken);
    return {
      success: true,
      message: 'Logged out successfully',
    };
  }

  async logoutAll(userId: string): Promise<{ success: boolean; message: string }> {
    await this.authRepository.deleteAllUserRefreshTokens(userId);
    return {
      success: true,
      message: 'Logged out from all devices',
    };
  }

  private async generateTokens(userId: string, email: string): Promise<TokenResponse> {
    const accessTokenExpMs = parseInt(
      this.configService.get('JWT_ACCESS_EXPIRATION_MS', '86400000'),
      10,
    );
    const refreshTokenExpMs = parseInt(
      this.configService.get('JWT_REFRESH_EXPIRATION_MS', '604800000'),
      10,
    );

    const accessToken = this.jwtService.sign(
      { sub: userId, email },
      { expiresIn: Math.floor(accessTokenExpMs / 1000) },
    );

    const refreshToken = uuidv4();
    const expiresAt = new Date(Date.now() + refreshTokenExpMs);

    await this.authRepository.saveRefreshToken(userId, refreshToken, expiresAt);

    return {
      accessToken,
      refreshToken,
      expiresIn: accessTokenExpMs,
    };
  }

  // Two-Factor Authentication Methods

  async setupTwoFactor(userId: string) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    // Generate secret
    const secret = authenticator.generateSecret();

    // Store secret (not enabled yet)
    await this.authRepository.updateTwoFactorSecret(userId, secret);

    // Generate QR code
    const appName = this.configService.get('APP_NAME', 'PingUp');
    const otpauthUrl = authenticator.keyuri(user.email, appName, secret);
    const qrCodeDataUrl = await QRCode.toDataURL(otpauthUrl);

    return {
      success: true,
      message: 'Scan the QR code with your authenticator app',
      data: {
        secret,
        qrCode: qrCodeDataUrl,
      },
    };
  }

  async verifyAndEnableTwoFactor(userId: string, dto: VerifyTwoFactorDto) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is already enabled');
    }

    if (!user.twoFactorSecret) {
      throw new BadRequestException('Please set up two-factor authentication first');
    }

    // Verify the code
    const isValid = authenticator.verify({
      token: dto.code,
      secret: user.twoFactorSecret,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Generate backup codes
    const backupCodes = await this.generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, 10)),
    );

    // Enable 2FA
    await this.authRepository.enableTwoFactor(userId, hashedBackupCodes);

    return {
      success: true,
      message: 'Two-factor authentication enabled successfully',
      data: {
        backupCodes, // Return unhashed codes to user (only shown once)
      },
    };
  }

  async disableTwoFactor(userId: string, dto: VerifyTwoFactorDto) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    // Verify the code
    const isValid = authenticator.verify({
      token: dto.code,
      secret: user.twoFactorSecret!,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Disable 2FA
    await this.authRepository.disableTwoFactor(userId);

    return {
      success: true,
      message: 'Two-factor authentication disabled',
    };
  }

  async regenerateBackupCodes(userId: string, dto: VerifyTwoFactorDto) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (!user.twoFactorEnabled) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    // Verify the code
    const isValid = authenticator.verify({
      token: dto.code,
      secret: user.twoFactorSecret!,
    });

    if (!isValid) {
      throw new UnauthorizedException('Invalid verification code');
    }

    // Generate new backup codes
    const backupCodes = await this.generateBackupCodes();
    const hashedBackupCodes = await Promise.all(
      backupCodes.map((code) => bcrypt.hash(code, 10)),
    );

    await this.authRepository.updateBackupCodes(userId, hashedBackupCodes);

    return {
      success: true,
      message: 'Backup codes regenerated',
      data: {
        backupCodes,
      },
    };
  }

  async getTwoFactorStatus(userId: string) {
    const user = await this.authRepository.findUserById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      success: true,
      data: {
        enabled: user.twoFactorEnabled,
        backupCodesRemaining: user.twoFactorBackupCodes?.length || 0,
      },
    };
  }

  private async generateBackupCodes(): Promise<string[]> {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8 character alphanumeric codes
      const code = uuidv4().replace(/-/g, '').substring(0, 8).toUpperCase();
      codes.push(code);
    }
    return codes;
  }
}

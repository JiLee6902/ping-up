import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan } from 'typeorm';
import { User, UserRefreshToken } from '@app/entity';

@Injectable()
export class AuthRepository {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserRefreshToken)
    private readonly refreshTokenRepository: Repository<UserRefreshToken>,
  ) {}

  async findUserByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findUserByUsername(username: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  async saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<UserRefreshToken> {
    const refreshToken = this.refreshTokenRepository.create({
      userId,
      refreshToken: token,
      expiresAt,
      isRevoked: false,
    });
    return this.refreshTokenRepository.save(refreshToken);
  }

  async findRefreshToken(token: string): Promise<UserRefreshToken | null> {
    return this.refreshTokenRepository.findOne({
      where: {
        refreshToken: token,
        isRevoked: false,
        expiresAt: MoreThan(new Date()),
      },
      relations: ['user'],
    });
  }

  async deleteRefreshToken(token: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { refreshToken: token },
      { isRevoked: true },
    );
  }

  async deleteAllUserRefreshTokens(userId: string): Promise<void> {
    await this.refreshTokenRepository.update(
      { userId },
      { isRevoked: true },
    );
  }

  // Guest user methods
  async findGuestUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { id, isGuest: true } });
  }

  async incrementGuestVisitCount(userId: string): Promise<void> {
    await this.userRepository.increment({ id: userId }, 'guestVisitCount', 1);
  }

  async convertGuestToRegular(userId: string, data: Partial<User>): Promise<User> {
    await this.userRepository.update(userId, {
      ...data,
      isGuest: false,
      guestVisitCount: 0,
    });
    return this.userRepository.findOneOrFail({ where: { id: userId } });
  }

  // Two-Factor Authentication methods
  async updateTwoFactorSecret(userId: string, secret: string): Promise<void> {
    await this.userRepository.update(userId, { twoFactorSecret: secret });
  }

  async enableTwoFactor(userId: string, backupCodes: string[]): Promise<void> {
    await this.userRepository.update(userId, {
      twoFactorEnabled: true,
      twoFactorBackupCodes: backupCodes,
    });
  }

  async disableTwoFactor(userId: string): Promise<void> {
    await this.userRepository.update(userId, {
      twoFactorEnabled: false,
      twoFactorSecret: null as unknown as string,
      twoFactorBackupCodes: null as unknown as string[],
    });
  }

  async updateBackupCodes(userId: string, backupCodes: string[]): Promise<void> {
    await this.userRepository.update(userId, { twoFactorBackupCodes: backupCodes });
  }
}

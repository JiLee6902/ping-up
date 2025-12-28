import { IsString, IsNotEmpty, Length } from 'class-validator';

export class VerifyTwoFactorDto {
  @IsString()
  @IsNotEmpty()
  @Length(6, 6)
  code: string;
}

export class LoginTwoFactorDto {
  @IsString()
  @IsNotEmpty()
  tempToken: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 8) // 6 for TOTP, 8 for backup code
  code: string;
}

import { IsOptional, IsString } from 'class-validator';

export class GuestLoginDto {
  @IsOptional()
  @IsString()
  guestUserId?: string;
}

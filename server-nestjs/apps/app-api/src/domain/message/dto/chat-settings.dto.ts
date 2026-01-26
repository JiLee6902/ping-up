import { IsUUID, IsOptional, IsString, IsBoolean, MaxLength } from 'class-validator';

export class UpdateChatSettingsDto {
  @IsUUID("all")
  chatWithUserId: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  nickname?: string;

  @IsOptional()
  @IsBoolean()
  isMuted?: boolean;

  @IsOptional()
  @IsBoolean()
  isBlocked?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  backgroundColor?: string;

  @IsOptional()
  @IsString()
  backgroundImage?: string;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  messageColor?: string;
}

export class GetChatSettingsDto {
  @IsUUID("all")
  chatWithUserId: string;
}

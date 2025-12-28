import { IsString, IsUUID, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { MessageType } from '@app/enum';

export class SendMessageDto {
  @IsUUID()
  toUserId: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  text?: string;

  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType;
}

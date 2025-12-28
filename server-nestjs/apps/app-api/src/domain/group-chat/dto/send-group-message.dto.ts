import { IsString, IsOptional, IsUUID, IsEnum, MaxLength } from 'class-validator';
import { GroupMessageType } from '@app/entity';

export class SendGroupMessageDto {
  @IsUUID()
  groupId: string;

  @IsString()
  @IsOptional()
  @MaxLength(5000)
  content?: string;

  @IsEnum(GroupMessageType)
  @IsOptional()
  messageType?: GroupMessageType;
}

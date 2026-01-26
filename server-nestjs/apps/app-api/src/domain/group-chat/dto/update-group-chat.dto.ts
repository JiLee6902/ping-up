import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class UpdateGroupChatDto {
  @IsUUID("all")
  groupId: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;
}

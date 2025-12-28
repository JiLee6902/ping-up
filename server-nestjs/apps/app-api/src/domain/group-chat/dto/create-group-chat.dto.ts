import { IsString, IsOptional, IsArray, IsUUID, MaxLength, ArrayMaxSize, ArrayMinSize } from 'class-validator';

export class CreateGroupChatDto {
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @IsArray()
  @IsUUID('4', { each: true })
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  memberIds: string[];
}

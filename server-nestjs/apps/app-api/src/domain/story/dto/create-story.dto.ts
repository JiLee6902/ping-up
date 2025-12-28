import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';
import { MediaType } from '@app/enum';

export class CreateStoryDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  content?: string;

  @IsOptional()
  @IsEnum(MediaType)
  mediaType?: MediaType;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  backgroundColor?: string;
}

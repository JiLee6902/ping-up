import { IsString, IsOptional, IsEnum, MaxLength, IsNumber, ValidateNested, IsBoolean, IsDateString, IsArray, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { PostType } from '@app/enum';
import { Transform, Type } from 'class-transformer';

class PollOptionInput {
  @IsString()
  @MaxLength(100)
  text: string;
}

class PollInput {
  @IsString()
  @MaxLength(280)
  question: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => PollOptionInput)
  options: PollOptionInput[];

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  isMultipleChoice?: boolean;
}

export class CreatePostDto {
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string;

  @IsOptional()
  @IsEnum(PostType)
  postType?: PostType;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @IsNumber()
  locationLat?: number;

  @IsOptional()
  @Transform(({ value }) => value ? parseFloat(value) : undefined)
  @IsNumber()
  locationLng?: number;

  @IsOptional()
  @ValidateNested()
  @Type(() => PollInput)
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        return undefined;
      }
    }
    return value;
  })
  poll?: PollInput;
}

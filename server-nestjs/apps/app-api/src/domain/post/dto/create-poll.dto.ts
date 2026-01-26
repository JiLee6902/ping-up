import { IsString, IsOptional, IsBoolean, IsArray, IsDateString, MaxLength, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class PollOptionDto {
  @IsString()
  @MaxLength(100)
  text: string;
}

export class CreatePollDto {
  @IsString()
  @MaxLength(280)
  question: string;

  @IsArray()
  @ArrayMinSize(2)
  @ArrayMaxSize(4)
  options: PollOptionDto[];

  @IsOptional()
  @IsDateString()
  endsAt?: string;

  @IsOptional()
  @IsBoolean()
  isMultipleChoice?: boolean;
}

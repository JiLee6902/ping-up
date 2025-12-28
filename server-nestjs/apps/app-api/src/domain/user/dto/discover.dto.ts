import { IsString, IsOptional, IsNumber, Max } from 'class-validator';
import { Transform } from 'class-transformer';

export class DiscoverDto {
  @IsOptional()
  @Transform(({ value }) => (value ?? '').toString().trim())
  @IsString()
  query: string = '';

  @IsOptional()
  @IsNumber()
  @Max(50)
  limit?: number;
}

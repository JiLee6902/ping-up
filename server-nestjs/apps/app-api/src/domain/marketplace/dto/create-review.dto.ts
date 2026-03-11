import { IsString, IsOptional, IsInt, Min, Max, IsUUID, MaxLength } from 'class-validator';

export class CreateReviewDto {
  @IsUUID()
  sellerId: string;

  @IsInt()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comment?: string;
}

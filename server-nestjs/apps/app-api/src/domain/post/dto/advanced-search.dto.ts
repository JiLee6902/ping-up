import { IsString, IsOptional, IsBoolean, IsDateString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export enum SortBy {
  DATE = 'date',
  LIKES = 'likes',
  COMMENTS = 'comments',
}

export enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

export enum MediaFilter {
  ANY = 'any',
  IMAGES = 'images',
  VIDEO = 'video',
  NONE = 'none',
}

export class AdvancedSearchDto {
  @IsString()
  @IsOptional()
  query?: string;

  @IsDateString()
  @IsOptional()
  dateFrom?: string;

  @IsDateString()
  @IsOptional()
  dateTo?: string;

  @IsEnum(MediaFilter)
  @IsOptional()
  mediaFilter?: MediaFilter;

  @IsString()
  @IsOptional()
  fromUser?: string; // username or userId

  @IsString()
  @IsOptional()
  hashtag?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsEnum(SortBy)
  @IsOptional()
  sortBy?: SortBy;

  @IsEnum(SortOrder)
  @IsOptional()
  sortOrder?: SortOrder;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(100)
  limit?: number;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  @Min(0)
  offset?: number;
}

import { IsString, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ProductCategory, ProductCondition } from '@app/enum';

export enum ProductSortBy {
  NEWEST = 'newest',
  OLDEST = 'oldest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  MOST_VIEWED = 'most_viewed',
}

export class SearchProductsDto {
  @IsOptional()
  @IsString()
  query?: string;

  @IsOptional()
  @IsEnum(ProductCategory)
  category?: ProductCategory;

  @IsOptional()
  @IsEnum(ProductCondition)
  condition?: ProductCondition;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  minPrice?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  maxPrice?: number;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsEnum(ProductSortBy)
  sortBy?: ProductSortBy;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(50)
  limit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  offset?: number;
}

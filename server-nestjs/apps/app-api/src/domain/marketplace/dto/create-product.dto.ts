import { IsString, IsOptional, IsEnum, IsNumber, MaxLength, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ProductCategory, ProductCondition } from '@app/enum';

export class CreateProductDto {
  @IsString()
  @MaxLength(200)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  description?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  price: number;

  @IsEnum(ProductCategory)
  category: ProductCategory;

  @IsEnum(ProductCondition)
  condition: ProductCondition;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  location?: string;

  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  @IsNumber()
  locationLat?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? parseFloat(value) : undefined))
  @IsNumber()
  locationLng?: number;
}

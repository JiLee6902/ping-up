import { IsNotEmpty, IsString, IsIn } from 'class-validator';

export class PurchaseSubscriptionDto {
  @IsNotEmpty()
  @IsString()
  @IsIn(['monthly', 'yearly'])
  plan: 'monthly' | 'yearly';
}

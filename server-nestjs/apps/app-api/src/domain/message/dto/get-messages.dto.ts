import { IsUUID, IsOptional, IsNumber, Max } from 'class-validator';

export class GetMessagesDto {
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsNumber()
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsNumber()
  offset?: number;
}

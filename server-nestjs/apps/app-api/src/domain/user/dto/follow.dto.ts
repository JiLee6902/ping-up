import { IsUUID } from 'class-validator';

export class FollowDto {
  @IsUUID("all")
  userId: string;
}

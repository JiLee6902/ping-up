import { IsUUID } from 'class-validator';

export class FollowDto {
  @IsUUID()
  userId: string;
}

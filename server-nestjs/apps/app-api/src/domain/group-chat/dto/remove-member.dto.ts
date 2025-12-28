import { IsUUID } from 'class-validator';

export class RemoveMemberDto {
  @IsUUID()
  groupId: string;

  @IsUUID()
  userId: string;
}

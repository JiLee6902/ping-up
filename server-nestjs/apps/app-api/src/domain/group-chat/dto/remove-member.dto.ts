import { IsUUID } from 'class-validator';

export class RemoveMemberDto {
  @IsUUID("all")
  groupId: string;

  @IsUUID("all")
  userId: string;
}

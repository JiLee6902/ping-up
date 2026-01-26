import { IsUUID, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { GroupRole } from '@app/entity';

export class UpdateMemberSettingsDto {
  @IsUUID("all")
  groupId: string;

  @IsOptional()
  @IsBoolean()
  isMuted?: boolean;
}

export class UpdateMemberRoleDto {
  @IsUUID("all")
  groupId: string;

  @IsUUID("all")
  userId: string;

  @IsEnum(GroupRole)
  role: GroupRole;
}

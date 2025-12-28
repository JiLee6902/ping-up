import { IsUUID, IsOptional, IsBoolean, IsEnum } from 'class-validator';
import { GroupRole } from '@app/entity';

export class UpdateMemberSettingsDto {
  @IsUUID()
  groupId: string;

  @IsOptional()
  @IsBoolean()
  isMuted?: boolean;
}

export class UpdateMemberRoleDto {
  @IsUUID()
  groupId: string;

  @IsUUID()
  userId: string;

  @IsEnum(GroupRole)
  role: GroupRole;
}

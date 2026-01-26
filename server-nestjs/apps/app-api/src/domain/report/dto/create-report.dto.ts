import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { ReportType, ReportReason } from '@app/entity';

export class CreateReportDto {
  @IsEnum(ReportType)
  reportType: ReportType;

  @IsEnum(ReportReason)
  reason: ReportReason;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsUUID("all")
  reportedUserId?: string;

  @IsOptional()
  @IsUUID("all")
  reportedPostId?: string;

  @IsOptional()
  @IsUUID("all")
  reportedCommentId?: string;
}

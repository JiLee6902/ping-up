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
  @IsUUID()
  reportedUserId?: string;

  @IsOptional()
  @IsUUID()
  reportedPostId?: string;

  @IsOptional()
  @IsUUID()
  reportedCommentId?: string;
}

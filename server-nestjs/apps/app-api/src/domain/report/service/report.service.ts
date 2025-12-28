import { Injectable, BadRequestException } from '@nestjs/common';
import { ReportRepository } from '../repository/report.repository';
import { CreateReportDto } from '../dto';
import { ReportType } from '@app/entity';

@Injectable()
export class ReportService {
  constructor(private readonly reportRepository: ReportRepository) {}

  async createReport(userId: string, dto: CreateReportDto) {
    // Validate that target is provided based on report type
    if (dto.reportType === ReportType.USER && !dto.reportedUserId) {
      throw new BadRequestException('User ID is required for user reports');
    }
    if (dto.reportType === ReportType.POST && !dto.reportedPostId) {
      throw new BadRequestException('Post ID is required for post reports');
    }
    if (dto.reportType === ReportType.COMMENT && !dto.reportedCommentId) {
      throw new BadRequestException('Comment ID is required for comment reports');
    }

    // Cannot report yourself
    if (dto.reportType === ReportType.USER && dto.reportedUserId === userId) {
      throw new BadRequestException('Cannot report yourself');
    }

    // Get target ID for duplicate check
    let targetId = '';
    if (dto.reportType === ReportType.USER) targetId = dto.reportedUserId!;
    else if (dto.reportType === ReportType.POST) targetId = dto.reportedPostId!;
    else if (dto.reportType === ReportType.COMMENT) targetId = dto.reportedCommentId!;

    // Check for existing report
    const existingReport = await this.reportRepository.findExistingReport(
      userId,
      dto.reportType,
      targetId,
    );

    if (existingReport) {
      throw new BadRequestException('You have already reported this');
    }

    await this.reportRepository.create({
      reporterId: userId,
      reportType: dto.reportType,
      reason: dto.reason,
      description: dto.description,
      reportedUserId: dto.reportedUserId,
      reportedPostId: dto.reportedPostId,
      reportedCommentId: dto.reportedCommentId,
    });

    return {
      success: true,
      message: 'Report submitted successfully. We will review it shortly.',
    };
  }

  async getMyReports(userId: string) {
    const reports = await this.reportRepository.getMyReports(userId);
    return {
      success: true,
      data: reports.map((r) => this.formatReportResponse(r)),
    };
  }

  private formatReportResponse(report: any) {
    return {
      id: report.id,
      reportType: report.reportType,
      reason: report.reason,
      description: report.description,
      status: report.status,
      createdAt: report.createdAt,
      reportedUser: report.reportedUser
        ? {
            id: report.reportedUser.id,
            fullName: report.reportedUser.fullName,
            username: report.reportedUser.username,
            profilePicture: report.reportedUser.profilePicture,
          }
        : null,
      reportedPost: report.reportedPost
        ? {
            id: report.reportedPost.id,
            content: report.reportedPost.content?.substring(0, 100),
          }
        : null,
    };
  }
}

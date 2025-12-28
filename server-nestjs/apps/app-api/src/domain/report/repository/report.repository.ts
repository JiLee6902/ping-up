import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportType, ReportReason, ReportStatus } from '@app/entity';

@Injectable()
export class ReportRepository {
  constructor(
    @InjectRepository(Report)
    private readonly reportRepository: Repository<Report>,
  ) {}

  async create(data: {
    reporterId: string;
    reportType: ReportType;
    reason: ReportReason;
    description?: string;
    reportedUserId?: string;
    reportedPostId?: string;
    reportedCommentId?: string;
  }): Promise<Report> {
    const report = this.reportRepository.create(data);
    return this.reportRepository.save(report);
  }

  async findExistingReport(
    reporterId: string,
    reportType: ReportType,
    targetId: string,
  ): Promise<Report | null> {
    const where: any = { reporterId, reportType };

    if (reportType === ReportType.USER) {
      where.reportedUserId = targetId;
    } else if (reportType === ReportType.POST) {
      where.reportedPostId = targetId;
    } else if (reportType === ReportType.COMMENT) {
      where.reportedCommentId = targetId;
    }

    return this.reportRepository.findOne({ where });
  }

  async getMyReports(userId: string): Promise<Report[]> {
    return this.reportRepository.find({
      where: { reporterId: userId },
      relations: ['reportedUser', 'reportedPost', 'reportedComment'],
      order: { createdAt: 'DESC' },
    });
  }

  async getAllReports(status?: ReportStatus): Promise<Report[]> {
    const where: any = {};
    if (status) {
      where.status = status;
    }

    return this.reportRepository.find({
      where,
      relations: ['reporter', 'reportedUser', 'reportedPost', 'reportedPost.user', 'reportedComment'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateStatus(reportId: string, status: ReportStatus): Promise<Report | null> {
    await this.reportRepository.update(reportId, { status });
    return this.reportRepository.findOne({ where: { id: reportId } });
  }
}

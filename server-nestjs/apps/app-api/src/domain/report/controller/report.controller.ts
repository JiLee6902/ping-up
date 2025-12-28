import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard, User as CurrentUser } from '@app/shared-libs';
import { ReportService } from '../service/report.service';
import { CreateReportDto } from '../dto';

interface CurrentUserPayload {
  id: string;
  email: string;
  username: string;
}

@Controller('report')
@UseGuards(JwtAuthGuard)
export class ReportController {
  constructor(private readonly reportService: ReportService) {}

  @Post('create')
  async createReport(
    @CurrentUser() user: CurrentUserPayload,
    @Body() dto: CreateReportDto,
  ) {
    return this.reportService.createReport(user.id, dto);
  }

  @Get('my-reports')
  async getMyReports(@CurrentUser() user: CurrentUserPayload) {
    return this.reportService.getMyReports(user.id);
  }
}

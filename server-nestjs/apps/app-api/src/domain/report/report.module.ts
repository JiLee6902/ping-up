import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Report } from '@app/entity';
import { ReportController } from './controller/report.controller';
import { ReportService } from './service/report.service';
import { ReportRepository } from './repository/report.repository';

@Module({
  imports: [TypeOrmModule.forFeature([Report])],
  controllers: [ReportController],
  providers: [ReportService, ReportRepository],
  exports: [ReportService],
})
export class ReportModule {}

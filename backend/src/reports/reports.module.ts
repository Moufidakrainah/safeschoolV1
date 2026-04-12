import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { Report } from './report.entity';
import { ReportSuspect } from './report-suspect.entity';
import { ScoringService } from './scoring.service';

@Module({
  imports: [TypeOrmModule.forFeature([Report, ReportSuspect])],
  controllers: [ReportsController],
  providers: [ReportsService, ScoringService],
  exports: [ReportsService],
})
export class ReportsModule {}
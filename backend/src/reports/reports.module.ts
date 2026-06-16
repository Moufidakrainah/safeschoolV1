import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReportsService } from "./reports.service";
import { ReportsController } from "./reports.controller";
import { Report } from "./report.entity";
import { ReportSuspect } from "./report-suspect.entity";
import { ReportNote } from "./report-note.entity";
import { ReportVictim } from "./report-victim.entity";
import { ScoringService } from "./scoring.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Report, ReportSuspect, ReportNote, ReportVictim]),
    NotificationsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ScoringService],
  exports: [ReportsService],
})
export class ReportsModule {}

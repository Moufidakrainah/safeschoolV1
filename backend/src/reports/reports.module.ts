import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ReportsService } from "./reports.service";
import { ReportsController } from "./reports.controller";
import { Report } from "./report.entity";
import { ReportSuspect } from "./report-suspect.entity";
import { ReportNote } from "./report-note.entity";
<<<<<<< HEAD
=======
import { ReportVictim } from "./report-victim.entity";
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
import { ScoringService } from "./scoring.service";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
<<<<<<< HEAD
    TypeOrmModule.forFeature([Report, ReportSuspect, ReportNote]),
=======
    TypeOrmModule.forFeature([Report, ReportSuspect, ReportNote, ReportVictim]),
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    NotificationsModule,
  ],
  controllers: [ReportsController],
  providers: [ReportsService, ScoringService],
  exports: [ReportsService],
})
export class ReportsModule {}
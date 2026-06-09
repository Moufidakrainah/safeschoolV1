import { IsOptional, IsEnum } from 'class-validator';
import { ReportGrade, ReportStatus } from '../report.entity';

export class UpdateReportDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus;

  @IsOptional()
  @IsEnum(ReportGrade)
  grade?: ReportGrade;
}

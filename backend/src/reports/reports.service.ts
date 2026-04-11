import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportGrade, ReportStatus } from './report.entity';
import { User } from '../users/user.entity';
import { ReportSuspect } from './report-suspect.entity';
import { ScoringService } from './scoring.service';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
    @InjectRepository(ReportSuspect)
    private suspectsRepository: Repository<ReportSuspect>,
    private scoringService: ScoringService,
  ) {}

  async create(
    title: string,
    description: string,
    isAnonymous: boolean,
    student: User,
    suspects: { userId?: string; freeText?: string }[] = [],
    frequency: string = '',
    schoolClass: string = '',
  ): Promise<Report> {

    const { finalScore, grade, aiScore, aiReason } = await this.scoringService.calculateScore(
      title,
      description,
      frequency,
      schoolClass,
      student.id,
    );

    const year = new Date().getFullYear();
    const count = await this.reportsRepository.count();
    const caseNumber = `#${year}-${String(count + 1).padStart(3, '0')}`;

    const report = this.reportsRepository.create({
      title,
      description,
      grade,
      aiScore: finalScore,
      aiReason,
      caseNumber,
      isAnonymous,
      student,
      status: ReportStatus.PENDING,
    });

    const savedReport = await this.reportsRepository.save(report);

    for (const suspect of suspects) {
      const reportSuspect = this.suspectsRepository.create({
        report: savedReport,
        user: suspect.userId ? { id: suspect.userId } as User : undefined,
        freeText: suspect.freeText,
      });
      await this.suspectsRepository.save(reportSuspect);
    }

    return this.reportsRepository.findOne({
      where: { id: savedReport.id },
      relations: ['suspects', 'suspects.user'],
    }) as Promise<Report>;
  }

  async findAll(): Promise<Report[]> {
    return this.reportsRepository.find({
      relations: ['student', 'student.studentProfile', 'suspects', 'suspects.user'],
    });
  }

  async findByStudent(studentId: string): Promise<Report[]> {
    return this.reportsRepository.find({
      where: { student: { id: studentId } },
      relations: ['suspects', 'suspects.user'],
    });
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportsRepository.findOne({
      where: { id },
      relations: ['student', 'suspects', 'suspects.user'],
    });
    if (!report) throw new NotFoundException('Signalement introuvable');
    return report;
  }

  async update(id: string, updates: {
    status?: ReportStatus;
    grade?: ReportGrade;
    adminNote?: string;
    gradeModificationReason?: string;
  }): Promise<Report> {
    const report = await this.findOne(id);
    if (updates.grade && updates.grade !== report.grade) {
      const grades = [ReportGrade.WATCH, ReportGrade.SERIOUS, ReportGrade.URGENT, ReportGrade.CRITICAL];
      const oldIndex = grades.indexOf(report.grade);
      const newIndex = grades.indexOf(updates.grade);
      if (newIndex < oldIndex && !updates.gradeModificationReason) {
        throw new ForbiddenException('Une justification est obligatoire pour baisser le grade');
      }
      report.grade = updates.grade;
      report.gradeModified = true;
      if (updates.gradeModificationReason) report.gradeModificationReason = updates.gradeModificationReason;
    }
    if (updates.status) report.status = updates.status;
    if (updates.adminNote) report.adminNote = updates.adminNote;
    return this.reportsRepository.save(report);
  }

  async escalate(id: string): Promise<Report> {
    const report = await this.findOne(id);
    report.status = ReportStatus.ESCALATED;
    return this.reportsRepository.save(report);
  }
}
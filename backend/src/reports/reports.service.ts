import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportGrade, ReportStatus } from './report.entity';
import { User } from '../users/user.entity';
import { ReportSuspect } from './report-suspect.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
    @InjectRepository(ReportSuspect)
    private suspectsRepository: Repository<ReportSuspect>,
  ) {}

  async create(
    title: string,
    description: string,
    isAnonymous: boolean,
    student: User,
    suspects: { userId?: string; freeText?: string }[] = [],
  ): Promise<Report> {
    const { grade, aiScore, aiReason } = this.classifyByIA(description);

    const year = new Date().getFullYear();
    const count = await this.reportsRepository.count();
    const caseNumber = `#${year}-${String(count + 1).padStart(3, '0')}`;

    const report = this.reportsRepository.create({
      title,
      description,
      grade,
      aiScore,
      aiReason,
      caseNumber,
      isAnonymous,
      student,
      status: ReportStatus.PENDING,
    });

    const savedReport = await this.reportsRepository.save(report);

    // Sauvegarder les soupçonnés
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

  private classifyByIA(description: string): { grade: ReportGrade; aiScore: number; aiReason: string } {
    const text = description.toLowerCase();
    if (text.includes('violence') || text.includes('frapper') || text.includes('menace') || text.includes('tuer') || text.includes('suicid')) {
      return { grade: ReportGrade.CRITICAL, aiScore: 9, aiReason: 'Danger immédiat détecté' };
    }
    if (text.includes('harcelement') || text.includes('insulte') || text.includes('cyber') || text.includes('repete')) {
      return { grade: ReportGrade.URGENT, aiScore: 6, aiReason: 'Harcèlement répété détecté' };
    }
    if (text.includes('moquerie') || text.includes('exclusion') || text.includes('humiliation')) {
      return { grade: ReportGrade.SERIOUS, aiScore: 4, aiReason: 'Situation sérieuse détectée' };
    }
    return { grade: ReportGrade.WATCH, aiScore: 2, aiReason: 'Situation à surveiller' };
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
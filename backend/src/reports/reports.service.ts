import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Report, ReportGrade, ReportStatus } from './report.entity';
import { User } from '../users/user.entity';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report)
    private reportsRepository: Repository<Report>,
  ) {}

  // Eleve cree un signalement
  async create(title: string, description: string, isAnonymous: boolean, student: User): Promise<Report> {
    const grade = this.classifyByIA(description);
    const report = this.reportsRepository.create({
      title,
      description,
      grade,
      isAnonymous,
      student,
      status: ReportStatus.PENDING,
    });
    return this.reportsRepository.save(report);
  }

  // Classification par mots-clés (sera remplacée par vraie IA)
  private classifyByIA(description: string): ReportGrade {
    const text = description.toLowerCase();
    if (text.includes('violence') || text.includes('frapper') || text.includes('menace') || text.includes('tuer')) {
      return ReportGrade.CRITICAL;
    }
    if (text.includes('harcelement') || text.includes('insulte') || text.includes('cyber') || text.includes('repete')) {
      return ReportGrade.URGENT;
    }
    if (text.includes('moquerie') || text.includes('exclusion') || text.includes('humiliation')) {
      return ReportGrade.SERIOUS;
    }
    return ReportGrade.WATCH;
  }

  // Admin/Directeur voit tous les signalements
  async findAll(): Promise<Report[]> {
    return this.reportsRepository.find({ relations: ['student'] });
  }

  // Eleve voit ses propres signalements
  async findByStudent(studentId: number): Promise<Report[]> {
    return this.reportsRepository.find({
      where: { student: { id: studentId } },
    });
  }

  // Trouver un signalement par ID
  async findOne(id: number): Promise<Report> {
    const report = await this.reportsRepository.findOne({
      where: { id },
      relations: ['student'],
    });
    if (!report) throw new NotFoundException('Signalement introuvable');
    return report;
  }

  // Admin modifie le statut ou le grade
  async update(id: number, updates: {
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

      // Si on baisse le grade, justification obligatoire
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

  // Escalader vers le directeur
  async escalate(id: number): Promise<Report> {
    const report = await this.findOne(id);
    report.status = ReportStatus.ESCALATED;
    return this.reportsRepository.save(report);
  }
}

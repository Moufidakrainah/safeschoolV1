import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Report, ReportGrade, ReportStatus } from "./report.entity";
import { User } from "../users/user.entity";
import { ReportSuspect } from "./report-suspect.entity";
import { ScoringService } from "./scoring.service";
import { ReportNote } from "./report-note.entity";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private reportsRepository: Repository<Report>,
    @InjectRepository(ReportSuspect)
    private suspectsRepository: Repository<ReportSuspect>,
    private scoringService: ScoringService,
    @InjectRepository(ReportNote)
    private notesRepository: Repository<ReportNote>,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    title: string,
    description: string,
    isAnonymous: boolean,
    student: User,
    suspects: { freeText: string }[] = [],
    frequency = "",
    schoolClass = "",
  ): Promise<Report> {
    const { finalScore, grade, aiScore, aiReason } =
      await this.scoringService.calculateScore(
        title,
        description,
        frequency,
        schoolClass,
        suspects,
      );

    const year = new Date().getFullYear();
    const lastReport = await this.reportsRepository
      .createQueryBuilder("report")
      .where("report.caseNumber LIKE :pattern", { pattern: `#${year}-%` })
      .orderBy("report.caseNumber", "DESC")
      .getOne();

    let nextNumber = 1;
    if (lastReport?.caseNumber) {
      nextNumber = parseInt(lastReport.caseNumber.split("-")[1]) + 1;
    }
    const caseNumber = `#${year}-${String(nextNumber).padStart(3, "0")}`;

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
        freeText: suspect.freeText,
      });
      await this.suspectsRepository.save(reportSuspect);
    }

    return this.reportsRepository.findOne({
      where: { id: savedReport.id },
      relations: ["suspects", "suspects.resolvedUser"],
    }) as Promise<Report>;
  }

  async findAll(): Promise<Report[]> {
    return this.reportsRepository.find({
      relations: [
        "student",
        "student.studentProfile",
        "suspects",
        "suspects.resolvedUser",
      ],
    });
  }

  async findByStudent(studentId: string): Promise<Report[]> {
    return this.reportsRepository.find({
      where: { student: { id: studentId } },
      relations: ["suspects", "suspects.resolvedUser"],
    });
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportsRepository.findOne({
      where: { id },
      relations: ["student", "suspects", "suspects.resolvedUser"],
    });
    if (!report) throw new NotFoundException("Signalement introuvable");
    return report;
  }

  async update(
    id: string,
    updates: {
      status?: ReportStatus;
      grade?: ReportGrade;
      adminNote?: string;
      gradeModificationReason?: string;
    },
  ): Promise<Report> {
    const report = await this.findOne(id);
    if (updates.grade && updates.grade !== report.grade) {
      const grades = [
        ReportGrade.FAIBLE,
        ReportGrade.MOYEN,
        ReportGrade.GRAVE,
        ReportGrade.CRITIQUE,
      ];
      const oldIndex = grades.indexOf(report.grade);
      const newIndex = grades.indexOf(updates.grade);
      if (newIndex < oldIndex && !updates.gradeModificationReason) {
        throw new ForbiddenException(
          "Une justification est obligatoire pour baisser le grade",
        );
      }
      report.grade = updates.grade;
      report.gradeModified = true;
      if (updates.gradeModificationReason)
        report.gradeModificationReason = updates.gradeModificationReason;
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

  async addNote(
    reportId: string,
    content: string,
    type: string,
    author: any,
    targetRole?: string,
  ): Promise<ReportNote> {
    const report = await this.findOne(reportId);
    const note = this.notesRepository.create({ report, content, type, author });
    const saved = await this.notesRepository.save(note);

    if (type === "convocation") {
      if (targetRole === "victime" || targetRole === "temoin") {
        if (report.student?.id) {
          await this.notificationsService.create(
            report.student.id,
            reportId,
            `📅 Convocation : ${content}`,
          );
        }
      } else if (targetRole?.startsWith("suspect_")) {
        const suspectIndex = parseInt(targetRole.split("_")[1]);
        const suspect = report.suspects?.[suspectIndex];
        if (suspect?.resolvedUser?.id) {
          await this.notificationsService.create(
            suspect.resolvedUser.id,
            reportId,
            `📅 Convocation : ${content}`,
          );
        }
      } else {
        if (report.student?.id) {
          await this.notificationsService.create(
            report.student.id,
            reportId,
            `📅 Convocation : ${content}`,
          );
        }
        if (report.suspects) {
          for (const suspect of report.suspects) {
            if (suspect.resolvedUser?.id) {
              await this.notificationsService.create(
                suspect.resolvedUser.id,
                reportId,
                `📅 Convocation : ${content}`,
              );
            }
          }
        }
      }
    }

    return saved;
  }

  async getNotes(reportId: string): Promise<ReportNote[]> {
    return this.notesRepository.find({
      where: { report: { id: reportId } },
      relations: ["author"],
      order: { createdAt: "DESC" },
    });
  }

    async findByVictimName(name: string): Promise<any[]> {
    const all = await this.reportsRepository
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.student", "student")
      .leftJoinAndSelect("report.suspects", "suspects")
      .leftJoinAndSelect("suspects.user", "suspectUser")
      .getMany();
 
    return all
      .filter((report) => {
        const isVictim = report.title?.toLowerCase().includes("victime");
        const isWitness = report.title?.toLowerCase().includes("témoin") ||
                          report.title?.toLowerCase().includes("temoin");
 
        // Cas 1 : le signaleur est la victime
        if (isVictim && report.student) {
          const fullName = `${report.student.firstName} ${report.student.lastName}`.toLowerCase();
          return fullName.includes(name.toLowerCase());
        }
 
        // Cas 2 : la victime est dans la description
        if (isWitness && report.description) {
          return report.description.toLowerCase().includes(
            `victime : ${name.toLowerCase()}`
          ) || report.description.toLowerCase().includes(name.toLowerCase());
        }
 
        return false;
      })
      .map((report) => ({
        id:          report.id,
        caseNumber:  report.caseNumber,
        title:       report.title,
        grade:       report.grade,
        status:      report.status,
        createdAt:   report.createdAt,
        signalePar:  report.student
          ? `${report.student.firstName} ${report.student.lastName}`
          : "Anonyme",
        typeSignalement: report.title?.toLowerCase().includes("victime")
          ? "victime"
          : "temoin",
        victime: report.title?.toLowerCase().includes("victime")
          ? report.student
            ? `${report.student.firstName} ${report.student.lastName}`
            : "Anonyme"
          : this.extractVictimFromDescription(report.description),
      }));
  }

    async countByVictim(): Promise<any[]> {
    const all = await this.reportsRepository
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.student", "student")
      .getMany();
 
    const counts: Record<string, number> = {};
 
    for (const report of all) {
      let victimName: string | null = null;
 
      const isVictim = report.title?.toLowerCase().includes("victime");
      const isWitness = report.title?.toLowerCase().includes("témoin") ||
                        report.title?.toLowerCase().includes("temoin");
 
      if (isVictim && report.student) {
        victimName = `${report.student.firstName} ${report.student.lastName}`;
      } else if (isWitness && report.description) {
        victimName = this.extractVictimFromDescription(report.description);
      }
 
      if (victimName) {
        counts[victimName] = (counts[victimName] || 0) + 1;
      }
    }
 
    // Transforme en tableau trié par nombre de signalements décroissant
    return Object.entries(counts)
      .map(([victim, count]) => ({ victim, count }))
      .sort((a, b) => b.count - a.count);
  }
 
    private extractVictimFromDescription(description: string): string | null {
    if (!description) return null;
    const match = description.match(/[Vv]ictime\s*:\s*([^|(\n]+)/);
    return match ? match[1].trim() : null;
  }


}

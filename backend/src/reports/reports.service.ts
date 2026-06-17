import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Report, ReportGrade, ReportStatus } from "./report.entity";
import { User } from "../users/user.entity";
import { ReportSuspect } from "./report-suspect.entity";
import { ReportVictim } from "./report-victim.entity";
import { ScoringService } from "./scoring.service";
import { ReportNote } from "./report-note.entity";
import { NotificationsService } from "../notifications/notifications.service";
import { LoggerService } from "../logger/logger.service";
import { JwtUser } from "../common/interfaces/jwt-user.interface";

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private reportsRepository: Repository<Report>,
    @InjectRepository(ReportSuspect)
    private suspectsRepository: Repository<ReportSuspect>,
    @InjectRepository(ReportVictim)
    private victimsRepository: Repository<ReportVictim>,
    private scoringService: ScoringService,
    @InjectRepository(ReportNote)
    private notesRepository: Repository<ReportNote>,
    private notificationsService: NotificationsService,
    private logger: LoggerService,
  ) {}

  async create(
    type: string,
    reporter: string,
    description: string,
    isAnonymous: boolean,
    student: Pick<User, "id" | "firstName" | "lastName">,
    suspects: { freeText: string }[] = [],
    victims: { freeText: string }[] = [],
    frequency = "",
  ): Promise<Report> {
    const { finalScore, grade, aiReason } =
      await this.scoringService.calculateScore(
        type,
        description,
        frequency,
        (
          student as {
            studentProfile?: { schoolClass?: { level?: string } };
          }
        ).studentProfile?.schoolClass?.level ?? "",
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
      type,
      reporter,
      description,
      grade,
      aiScore: finalScore,
      aiReason,
      caseNumber,
      isAnonymous,
      student,
      status: ReportStatus.NEW,
    });
    const savedReport = await this.reportsRepository.save(report);
    this.logger.report({
      type: "report_event",
      action: "created",
      reportId: savedReport.id,
      caseNumber,
      grade,
      score: finalScore,
      status: ReportStatus.PENDING,
      userId: student.id,
    });
    for (const suspect of suspects) {
      await this.suspectsRepository.save(
        this.suspectsRepository.create({
          report: savedReport,
          freeText: suspect.freeText,
        }),
      );
    }
    if (reporter === "victime") {
      await this.victimsRepository.save(
        this.victimsRepository.create({
          report: savedReport,
          freeText: `${student.firstName} ${student.lastName}`,
          resolvedUser: student,
        }),
      );
    }
    for (const victim of victims) {
      await this.victimsRepository.save(
        this.victimsRepository.create({
          report: savedReport,
          freeText: victim.freeText,
        }),
      );
    }
    return this.reportsRepository.findOne({
      where: { id: savedReport.id },
      relations: [
        "suspects",
        "suspects.resolvedUser",
        "victims",
        "victims.resolvedUser",
      ],
    }) as Promise<Report>;
  }

  async findAll(): Promise<Report[]> {
    return this.reportsRepository.find({
      relations: [
        "student",
        "student.studentProfile",
        "student.studentProfile.schoolClass",
        "suspects",
        "suspects.resolvedUser",
        "victims",
        "victims.resolvedUser",
        "victims.resolvedUser.studentProfile",
        "victims.resolvedUser.studentProfile.schoolClass",
      ],
    });
  }

  async findByStudent(studentId: string): Promise<Report[]> {
    return this.reportsRepository.find({
      where: { student: { id: studentId } },
      relations: [
        "suspects",
        "suspects.resolvedUser",
        "victims",
        "victims.resolvedUser",
      ],
    });
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportsRepository.findOne({
      where: { id },
      relations: [
        "student",
        "student.studentProfile",
        "student.studentProfile.schoolClass",
        "suspects",
        "suspects.resolvedUser",
        "victims",
        "victims.resolvedUser",
        "victims.resolvedUser.studentProfile",
        "victims.resolvedUser.studentProfile.schoolClass",
      ],
    });
    if (!report) throw new NotFoundException("Signalement introuvable");
    return report;
  }

  async update(
    id: string,
    updates: { status?: ReportStatus; grade?: ReportGrade },
    author?: JwtUser,
  ): Promise<Report> {
    const report = await this.findOne(id);
    if (updates.grade) report.grade = updates.grade;
    if (updates.status && updates.status !== report.status) {
      report.status = updates.status;
      const date = new Date().toLocaleDateString("fr-FR");
      const statusLabels: Record<string, string> = {
        new: "Nouveau",
        pending: "En attente",
        in_progress: "En cours",
        resolved: "Résolu",
        false_report: "Faux signalement",
        closed: "Clôturé",
        rejected: "Rejeté",
      };
      const label = statusLabels[updates.status] ?? updates.status;
      // ── Créer la note avec l'auteur ──
      await this.notesRepository.save(
        this.notesRepository.create({
          report,
          content: `Statut mis à jour : ${label} — ${date}`,
          type: "status_change",
          author: author ? { id: author.id } : undefined,
        }),
      );
      if (report.student?.id && report.reporter === "victime") {
        await this.notificationsService.create(
          report.student.id,
          id,
          `Statut de votre dossier ${report.caseNumber} mis à jour : ${label}`,
        );
      }
    }
    const saved = await this.reportsRepository.save(report);
    this.logger.report({
      type: "report_event",
      action: "updated",
      reportId: saved.id,
      caseNumber: saved.caseNumber,
      grade: saved.grade,
      status: saved.status,
    });
    return saved;
  }

  async addNote(
    reportId: string,
    content: string,
    type: string,
    author: JwtUser,
    targetRole?: string,
  ): Promise<ReportNote> {
    const report = await this.findOne(reportId);
    const note = this.notesRepository.create({ 
      report, 
      content, 
      type, 
      author: { id: author.id },
    });
    const saved = await this.notesRepository.save(note);
    this.logger.report({
      type: "report_event",
      action: type === "convocation" ? "convocation_sent" : "note_added",
      reportId,
      caseNumber: report.caseNumber,
      userId: author?.id,
    });

    if (type === "convocation") {
      if (
        targetRole === "alerteur" ||
        targetRole === "victime" ||
        targetRole === "temoin"
      ) {
        if (report.student?.id) {
          await this.notificationsService.create(
            report.student.id,
            reportId,
            `Convocation : ${content}`,
          );
        }
      } else if (targetRole?.startsWith("suspect_")) {
        const suspectId = targetRole.slice("suspect_".length);
        const suspect = report.suspects?.find(
          (s) => s.resolvedUser?.id === userId,
        );
        if (suspect?.resolvedUser?.id) {
          await this.notificationsService.create(
            suspect.resolvedUser.id,
            reportId,
            `Convocation : ${content}`,
          );
        }
      } else if (targetRole?.startsWith("victim_")) {
        const userId = targetRole.slice("victim_".length);
        const victim = report.victims?.find(
          (v) => v.resolvedUser?.id === userId,
        );
        if (victim?.resolvedUser?.id) {
          await this.notificationsService.create(
            victim.resolvedUser.id,
            reportId,
            `Convocation : ${content}`,
          );
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

  async resolveSuspect(
    suspectId: string,
    resolvedUserId: string | null,
  ): Promise<ReportSuspect> {
    const suspect = await this.suspectsRepository.findOne({
      where: { id: suspectId },
    });
    if (!suspect) throw new NotFoundException("Suspect introuvable");
    suspect.resolvedUser = resolvedUserId
      ? ({ id: resolvedUserId } as User)
      : null;
    return this.suspectsRepository.save(suspect);
  }

  async resolveVictim(
    victimId: string,
    resolvedUserId: string | null,
  ): Promise<ReportVictim> {
    const victim = await this.victimsRepository.findOne({
      where: { id: victimId },
    });
    if (!victim) throw new NotFoundException("Victime introuvable");
    victim.resolvedUser = resolvedUserId
      ? ({ id: resolvedUserId } as User)
      : null;
    return this.victimsRepository.save(victim);
  }

  async findByVictimName(name: string): Promise<any[]> {
    const all = await this.reportsRepository
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.student", "student")
      .leftJoinAndSelect("report.victims", "victims")
      .leftJoinAndSelect("victims.resolvedUser", "resolvedUser")
      .getMany();

    return all
      .filter((report) => {
        if (report.reporter === "victime" && report.student) {
          const fullName =
            `${report.student.firstName} ${report.student.lastName}`.toLowerCase();
          return fullName.includes(name.toLowerCase());
        }
        if (report.reporter === "temoin" && report.victims) {
          return report.victims.some(
            (v) =>
              v.freeText.toLowerCase().includes(name.toLowerCase()) ||
              (v.resolvedUser &&
                `${v.resolvedUser.firstName} ${v.resolvedUser.lastName}`
                  .toLowerCase()
                  .includes(name.toLowerCase())),
          );
        }
        return false;
      })
      .map((report) => ({
        id: report.id,
        caseNumber: report.caseNumber,
        type: report.type,
        reporter: report.reporter,
        grade: report.grade,
        status: report.status,
        createdAt: report.createdAt,
        signalePar: report.student
          ? `${report.student.firstName} ${report.student.lastName}`
          : "Anonyme",
        victimes:
          report.reporter === "victime"
            ? [
                report.student
                  ? `${report.student.firstName} ${report.student.lastName}`
                  : "Anonyme",
              ]
            : report.victims.map((v) => v.freeText),
      }));
  }

  async countByVictim(): Promise<any[]> {
    const all = await this.reportsRepository
      .createQueryBuilder("report")
      .leftJoinAndSelect("report.student", "student")
      .leftJoinAndSelect("report.victims", "victims")
      .getMany();

    const counts: Record<string, number> = {};
    for (const report of all) {
      if (report.reporter === "victime" && report.student) {
        const name = `${report.student.firstName} ${report.student.lastName}`;
        counts[name] = (counts[name] || 0) + 1;
      } else if (report.reporter === "temoin") {
        for (const victim of report.victims ?? []) {
          counts[victim.freeText] = (counts[victim.freeText] || 0) + 1;
        }
      }
    }
    return Object.entries(counts)
      .map(([victim, count]) => ({ victim, count }))
      .sort((a, b) => b.count - a.count);
  }
}

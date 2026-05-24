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
<<<<<<< HEAD
=======
import { ReportVictim } from "./report-victim.entity";
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
import { ScoringService } from "./scoring.service";
import { ReportNote } from "./report-note.entity";
import { NotificationsService } from "../notifications/notifications.service";

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Report) private reportsRepository: Repository<Report>,
<<<<<<< HEAD
    @InjectRepository(ReportSuspect)
    private suspectsRepository: Repository<ReportSuspect>,
=======
    @InjectRepository(ReportSuspect) private suspectsRepository: Repository<ReportSuspect>,
    @InjectRepository(ReportVictim) private victimsRepository: Repository<ReportVictim>,
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    private scoringService: ScoringService,
    @InjectRepository(ReportNote)
    private notesRepository: Repository<ReportNote>,
    private notificationsService: NotificationsService,
  ) {}

  async create(
    type: string,
    reporter: string,
    description: string,
    isAnonymous: boolean,
    student: User,
<<<<<<< HEAD
    suspects: { userId?: string; freeText?: string }[] = [],
    frequency = "",
    schoolClass = "",
  ): Promise<Report> {
    const { finalScore, grade, aiScore, aiReason } =
      await this.scoringService.calculateScore(
        title,
        description,
        frequency,
        schoolClass,
=======
    suspects: { freeText: string }[] = [],
    victims: { freeText: string }[] = [],
    frequency = "",
  ): Promise<Report> {
    const { finalScore, grade, aiScore, aiReason } =
      await this.scoringService.calculateScore(
        type, description, frequency,
        (student as any).studentProfile?.schoolClass?.level ?? "",
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
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
<<<<<<< HEAD
      title,
      description,
      grade,
      aiScore: finalScore,
      aiReason,
      caseNumber,
      isAnonymous,
      student,
      status: ReportStatus.NEW,
=======
      type, reporter, description, grade,
      aiScore: finalScore, aiReason,
      caseNumber, isAnonymous, student,
      status: ReportStatus.PENDING,
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    });
    const savedReport = await this.reportsRepository.save(report);

    for (const suspect of suspects) {
<<<<<<< HEAD
      const reportSuspect = this.suspectsRepository.create({
        report: savedReport,
        user: suspect.userId ? ({ id: suspect.userId } as User) : undefined,
        freeText: suspect.freeText,
      });
      await this.suspectsRepository.save(reportSuspect);
=======
      await this.suspectsRepository.save(
        this.suspectsRepository.create({ report: savedReport, freeText: suspect.freeText })
      );
    }

    // Si reporter = victime, ajouter automatiquement le student comme première victime
    if (reporter === 'victime') {
      await this.victimsRepository.save(
        this.victimsRepository.create({
          report: savedReport,
          freeText: `${student.firstName} ${student.lastName}`,
          resolvedUser: student,
        })
      );
    }

    // Ajouter les autres victimes saisies
    for (const victim of victims) {
      await this.victimsRepository.save(
        this.victimsRepository.create({ report: savedReport, freeText: victim.freeText })
      );
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    }

    return this.reportsRepository.findOne({
      where: { id: savedReport.id },
<<<<<<< HEAD
      relations: ["suspects", "suspects.user"],
=======
      relations: ["suspects", "suspects.resolvedUser", "victims", "victims.resolvedUser"],
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    }) as Promise<Report>;
  }

  async findAll(): Promise<Report[]> {
    return this.reportsRepository.find({
      relations: [
<<<<<<< HEAD
        "student",
        "student.studentProfile",
        "student.studentProfile.class",
        "student.staffProfile",
        "suspects",
        "suspects.user",
=======
        "student", "student.studentProfile", "student.studentProfile.schoolClass",
        "suspects", "suspects.resolvedUser",
        "victims", "victims.resolvedUser",
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
      ],
    });
  }

  async findByStudent(studentId: string): Promise<Report[]> {
    return this.reportsRepository.find({
      where: { student: { id: studentId } },
<<<<<<< HEAD
      relations: ["suspects", "suspects.user"],
=======
      relations: ["suspects", "suspects.resolvedUser", "victims", "victims.resolvedUser"],
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    });
  }

  async findOne(id: string): Promise<Report> {
    const report = await this.reportsRepository.findOne({
      where: { id },
      relations: [
<<<<<<< HEAD
        "student",
        "student.studentProfile",
        "student.studentProfile.class",
        "student.staffProfile",
        "suspects",
        "suspects.user",
=======
        "student", "student.studentProfile", "student.studentProfile.schoolClass",
        "suspects", "suspects.resolvedUser",
        "victims", "victims.resolvedUser",
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
      ],
    });
    if (!report) throw new NotFoundException("Signalement introuvable");
    return report;
  }

  async update(
    id: string,
<<<<<<< HEAD
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
        ReportGrade.LOW,
        ReportGrade.MEDIUM,
        ReportGrade.HIGH,
        ReportGrade.CRITICAL,
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
=======
    updates: { status?: ReportStatus; grade?: ReportGrade },
  ): Promise<Report> {
    const report = await this.findOne(id);
    if (updates.grade) report.grade = updates.grade;
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    if (updates.status) report.status = updates.status;
    return this.reportsRepository.save(report);
  }

<<<<<<< HEAD
  async escalate(id: string): Promise<Report> {
    const report = await this.findOne(id);
    report.status = ReportStatus.NEW;
    return this.reportsRepository.save(report);
  }

=======
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
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
<<<<<<< HEAD
            report.student.id,
            reportId,
            `📅 Convocation : ${content}`,
=======
            report.student.id, reportId, `Convocation : ${content}`,
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
          );
        }
      } else if (targetRole?.startsWith("suspect_")) {
        const suspectIndex = parseInt(targetRole.split("_")[1]);
        const suspect = report.suspects?.[suspectIndex];
<<<<<<< HEAD
        if (suspect?.user?.id) {
          await this.notificationsService.create(
            suspect.user.id,
            reportId,
            `📅 Convocation : ${content}`,
=======
        if (suspect?.resolvedUser?.id) {
          await this.notificationsService.create(
            suspect.resolvedUser.id, reportId, `Convocation : ${content}`,
          );
        }
      } else if (targetRole?.startsWith("victim_")) {
        const victimIndex = parseInt(targetRole.split("_")[1]);
        const victim = report.victims?.[victimIndex];
        if (victim?.resolvedUser?.id) {
          await this.notificationsService.create(
            victim.resolvedUser.id, reportId, `Convocation : ${content}`,
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
          );
        }
      } else {
        if (report.student?.id) {
          await this.notificationsService.create(
<<<<<<< HEAD
            report.student.id,
            reportId,
            `📅 Convocation : ${content}`,
          );
        }
        if (report.suspects) {
          for (const suspect of report.suspects) {
            if (suspect.user?.id) {
              await this.notificationsService.create(
                suspect.user.id,
                reportId,
                `📅 Convocation : ${content}`,
              );
            }
=======
            report.student.id, reportId, `Convocation : ${content}`,
          );
        }
        for (const suspect of report.suspects ?? []) {
          if (suspect.resolvedUser?.id) {
            await this.notificationsService.create(
              suspect.resolvedUser.id, reportId, `Convocation : ${content}`,
            );
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
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

  async resolveSuspect(suspectId: string, resolvedUserId: string | null): Promise<ReportSuspect> {
    const suspect = await this.suspectsRepository.findOne({ where: { id: suspectId } });
    if (!suspect) throw new NotFoundException("Suspect introuvable");
    suspect.resolvedUser = resolvedUserId ? { id: resolvedUserId } as any : null;
    return this.suspectsRepository.save(suspect);
  }

  async resolveVictim(victimId: string, resolvedUserId: string | null): Promise<ReportVictim> {
    const victim = await this.victimsRepository.findOne({ where: { id: victimId } });
    if (!victim) throw new NotFoundException("Victime introuvable");
    victim.resolvedUser = resolvedUserId ? { id: resolvedUserId } as any : null;
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
          const fullName = `${report.student.firstName} ${report.student.lastName}`.toLowerCase();
          return fullName.includes(name.toLowerCase());
        }
        if (report.reporter === "temoin" && report.victims) {
          return report.victims.some(v =>
            v.freeText.toLowerCase().includes(name.toLowerCase()) ||
            (v.resolvedUser && `${v.resolvedUser.firstName} ${v.resolvedUser.lastName}`.toLowerCase().includes(name.toLowerCase()))
          );
        }
        return false;
      })
      .map((report) => ({
        id:         report.id,
        caseNumber: report.caseNumber,
        type:       report.type,
        reporter:   report.reporter,
        grade:      report.grade,
        status:     report.status,
        createdAt:  report.createdAt,
        signalePar: report.student
          ? `${report.student.firstName} ${report.student.lastName}`
          : "Anonyme",
        victimes: report.reporter === "victime"
          ? [report.student ? `${report.student.firstName} ${report.student.lastName}` : "Anonyme"]
          : report.victims.map(v => v.freeText),
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
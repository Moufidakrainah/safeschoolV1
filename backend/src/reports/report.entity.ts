import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from "typeorm";
import { User } from "../users/user.entity";
import { ReportSuspect } from "./report-suspect.entity";
<<<<<<< HEAD

export enum ReportGrade {
  CRITICAL = "critical",
  HIGH = "high",
  MEDIUM = "medium",
  LOW = "low",
}

export enum ReportStatus {
  NEW = "new",
  IN_PROGRESS = "in_progress",
  PENDING = "pending",
  RESOLVED = "resolved",
  FALSE_REPORT = "false_report",
}

=======
import { ReportVictim } from "./report-victim.entity";

export enum ReportGrade {
  CRITICAL = "critical",
  HIGH     = "high",
  MEDIUM   = "medium",
  LOW      = "low",
}

export enum ReportStatus {
  NEW          = "new",
  IN_PROGRESS  = "in_progress",
  PENDING      = "pending",
  RESOLVED     = "resolved",
  FALSE_REPORT = "false_report",
}

export enum ReportType {
  PHYSIQUE  = "physique",
  VERBAL    = "verbal",
  CYBER     = "cyber",
  SEXUEL    = "sexuel",
  EXCLUSION = "exclusion",
}

export enum ReportReporter {
  VICTIME = "victime",
  TEMOIN  = "temoin",
}

>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
@Entity("reports")
export class Report {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column({ unique: true, nullable: true }) caseNumber: string;
  @Column({ nullable: true }) type: string;
  @Column({ nullable: true }) reporter: string;
  @Column("text") description: string;
  @Column({ type: "enum", enum: ReportGrade }) grade: ReportGrade;
  @Column({ type: "enum", enum: ReportStatus, default: ReportStatus.NEW }) status: ReportStatus;
  @Column({ nullable: true }) aiScore: number;
  @Column({ nullable: true, type: "text" }) aiReason: string;
<<<<<<< HEAD
  @Column() title: string;
  @Column("text") description: string;
  @Column({ type: "enum", enum: ReportGrade }) grade: ReportGrade;
  @Column({ default: false }) gradeModified: boolean;
  @Column({ nullable: true }) gradeModificationReason: string;
  @Column({ type: "enum", enum: ReportStatus, default: ReportStatus.NEW })
  status: ReportStatus;
  @Column({ nullable: true }) adminNote: string;
  @Column({ default: false }) isAnonymous: boolean;
  @ManyToOne(() => User, (user) => user.reports) student: User;
  @CreateDateColumn() createdAt: Date;
  @OneToMany(() => ReportSuspect, (suspect) => suspect.report, {
    cascade: true,
  })
  suspects: ReportSuspect[];
=======
  @Column({ default: false }) isAnonymous: boolean;
  @ManyToOne(() => User, (user) => user.reports) student: User;
  @CreateDateColumn() createdAt: Date;
  @OneToMany(() => ReportSuspect, (suspect) => suspect.report, { cascade: true }) suspects: ReportSuspect[];
  @OneToMany(() => ReportVictim, (victim) => victim.report, { cascade: true }) victims: ReportVictim[];
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
}

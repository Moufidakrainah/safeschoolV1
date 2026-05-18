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
import { ReportVictim } from "./report-victim.entity";

export enum ReportGrade {
  CRITIQUE = "critique",
  GRAVE    = "grave",
  MOYEN    = "moyen",
  FAIBLE   = "faible",
}

export enum ReportStatus {
  PENDING    = "pending",
  IN_PROGRESS = "in_progress",
  CLOSED     = "closed",
  REJECTED   = "rejected",
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

@Entity("reports")
export class Report {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ unique: true, nullable: true }) caseNumber: string;

  @Column({ nullable: true }) type: string;

  @Column({ nullable: true }) reporter: string;

  @Column("text") description: string;

  @Column({ type: "enum", enum: ReportGrade }) grade: ReportGrade;

  @Column({ type: "enum", enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @Column({ nullable: true }) aiScore: number;

  @Column({ nullable: true, type: "text" }) aiReason: string;

  @Column({ default: false }) isAnonymous: boolean;

  @ManyToOne(() => User, (user) => user.reports) student: User;

  @CreateDateColumn() createdAt: Date;

  @OneToMany(() => ReportSuspect, (suspect) => suspect.report, { cascade: true })
  suspects: ReportSuspect[];

  @OneToMany(() => ReportVictim, (victim) => victim.report, { cascade: true })
  victims: ReportVictim[];
}

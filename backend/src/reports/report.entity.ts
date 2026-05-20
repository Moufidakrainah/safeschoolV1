import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, OneToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { ReportSuspect } from './report-suspect.entity';

export enum ReportGrade {
  CRITICAL = 'critical',
  HIGH    = 'high',
  MEDIUM    = 'medium',
  LOW   = 'low',
}

export enum ReportStatus {
	NEW = 'new',
	IN_PROGRESS = 'in_progress',
	PENDING = 'pending',
	RESOLVED = 'resolved',
	FALSE_REPORT = 'false_report',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ unique: true, nullable: true }) caseNumber: string;
  @Column({ nullable: true }) aiScore: number;
  @Column({ nullable: true, type: 'text' }) aiReason: string;
  @Column() title: string;
  @Column('text') description: string;
  @Column({ type: 'enum', enum: ReportGrade }) grade: ReportGrade;
  @Column({ default: false }) gradeModified: boolean;
  @Column({ nullable: true }) gradeModificationReason: string;
  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.NEW }) status: ReportStatus;
  @Column({ nullable: true }) adminNote: string;
  @Column({ default: false }) isAnonymous: boolean;
  @ManyToOne(() => User, (user) => user.reports) student: User;
  @CreateDateColumn() createdAt: Date;
  @OneToMany(() => ReportSuspect, suspect => suspect.report, { cascade: true }) suspects: ReportSuspect[];
}

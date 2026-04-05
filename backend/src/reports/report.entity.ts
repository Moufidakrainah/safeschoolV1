import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { User } from '../users/user.entity';

export enum ReportGrade {
  CRITICAL = 'critical',
  URGENT = 'urgent',
  SERIOUS = 'serious',
  WATCH = 'watch',
}

export enum ReportStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  ESCALATED = 'escalated',
  CLOSED = 'closed',
  REJECTED = 'rejected',
}

@Entity('reports')
export class Report {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  description: string;

  @Column({ type: 'enum', enum: ReportGrade })
  grade: ReportGrade;

  @Column({ default: false })
  gradeModified: boolean;

  @Column({ nullable: true })
  gradeModificationReason: string;

  @Column({ type: 'enum', enum: ReportStatus, default: ReportStatus.PENDING })
  status: ReportStatus;

  @Column({ nullable: true })
  adminNote: string;

  @Column({ default: false })
  isAnonymous: boolean;

  @ManyToOne(() => User, (user) => user.reports)
  student: User;

  @CreateDateColumn()
  createdAt: Date;
}

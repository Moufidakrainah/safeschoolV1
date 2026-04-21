import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne } from 'typeorm';
import { Report } from './report.entity';
import { User } from '../users/user.entity';

@Entity('report_notes')
export class ReportNote {
  @PrimaryGeneratedColumn('uuid') id: string;
  @ManyToOne(() => Report, { onDelete: 'CASCADE' }) report: Report;
  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true }) author: User;
  @Column('text') content: string;
  @Column({ default: 'note' }) type: string;
  @CreateDateColumn() createdAt: Date;
}

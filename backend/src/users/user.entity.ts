import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany, OneToOne } from 'typeorm';
import { Report } from '../reports/report.entity';
import { StudentProfile } from '../student-profiles/student-profile.entity';

export enum UserRole {
  STUDENT = 'student',
  ADMIN = 'admin',
  DIRECTOR = 'director',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column({select: false})
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToMany(() => Report, (report) => report.student)
  reports: Report[];

  @OneToOne(() => StudentProfile, profile => profile.user)
  studentProfile: StudentProfile;
}

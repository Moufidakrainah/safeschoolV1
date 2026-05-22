import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany,
  OneToOne,
} from "typeorm";
import { Report } from "../reports/report.entity";
import { StudentProfile } from "../student-profiles/student-profile.entity";
import { StaffProfile } from "../staff/staff-profile.entity";

export enum UserRole {
  STUDENT = "student",
  ADMIN = "admin",
  DIRECTOR = "director",
  TEACHER = "teacher",
  STAFF = "staff",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string; /*le typeORM genère automatiquement
                                                un UUID à chaque nouvel utilisateur  */
  @Column({ unique: true }) email: string;
  @Column({ select: false })
  password: string; /*meme si on fait un select * on voit 
                                                pas le password */
  @Column({ type: "enum", enum: UserRole, default: UserRole.STUDENT })
  role: UserRole;
  @Column() firstName: string;
  @Column() lastName: string;
  @CreateDateColumn() createdAt: Date;
  @OneToMany(() => Report, (report) => report.student) reports: Report[];
  @OneToOne(() => StudentProfile, (profile) => profile.user)
  studentProfile: StudentProfile;
  @OneToOne(() => StaffProfile, (staffProfile) => staffProfile.user)
  staffProfile: StaffProfile;
}

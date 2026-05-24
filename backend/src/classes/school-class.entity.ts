import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany } from "typeorm";
import { StaffProfile } from "../staff/staff-profile.entity";
import { StudentProfile } from "../student-profiles/student-profile.entity";

@Entity("classes")
export class SchoolClass {
  @PrimaryGeneratedColumn("uuid") id: string;
  @Column() level: string;
  @Column() section: string;

  @OneToMany(() => StudentProfile, student => student.schoolClass)
  students: StudentProfile[];

  @ManyToMany(() => StaffProfile, (staff) => staff.classes)
  staff: StaffProfile[];
}

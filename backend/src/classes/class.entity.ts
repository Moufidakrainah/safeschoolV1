import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToMany } from 'typeorm';
import { StudentProfile } from '../student-profiles/student-profile.entity';
import { StaffProfile } from '../staff/staff-profile.entity';

@Entity('classes')
export class SchoolClass {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  level: string;

  @Column()
  section: string;

  @OneToMany(() => StudentProfile, student => student.class)
  students: StudentProfile[];

  @ManyToMany(() => StaffProfile, staff => staff.classes)
  staff: StaffProfile[];
}

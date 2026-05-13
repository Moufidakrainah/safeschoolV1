import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from 'typeorm';
import { StudentProfile } from '../student-profiles/student-profile.entity';

@Entity('parents')
export class Parent {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column() firstName: string;

  @Column() lastName: string;

  @Column() email: string;

  @Column({ nullable: true }) phone: string;

  @Column({ nullable: true }) address: string;

  @ManyToMany(() => StudentProfile, student => student.parents)
  @JoinTable({ name: 'student_parents' })
  students: StudentProfile[];
}

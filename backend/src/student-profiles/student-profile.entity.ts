import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToOne, ManyToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { Parent } from '../parents/parent.entity';
import { SchoolClass } from '../classes/class.entity';

@Entity('student_profiles')
export class StudentProfile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => SchoolClass, cls => cls.students, { nullable: true })
  class: SchoolClass;

  @Column({ nullable: true })
  dateOfBirth: string;

  @OneToOne(() => User, user => user.studentProfile)
  @JoinColumn()
  user: User;

  @ManyToMany(() => Parent, parent => parent.students)
  parents: Parent[];
}

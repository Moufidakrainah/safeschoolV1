import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, ManyToMany } from 'typeorm';
import { User } from '../users/user.entity';
import { Parent } from '../parents/parent.entity';

@Entity('student_profiles')
export class StudentProfile {
  @PrimaryGeneratedColumn('uuid') id: string;

  @Column({ name: 'class', nullable: true }) schoolClass: string;

  @Column({ nullable: true }) dateOfBirth: string;

  @OneToOne(() => User, (user) => user.studentProfile)
  @JoinColumn()
  user: User;

  @ManyToMany(() => Parent, parent => parent.students)
  parents: Parent[];
}

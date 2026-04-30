import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('student_profiles')
export class StudentProfile {
  @PrimaryGeneratedColumn('uuid') id: string;
  @Column({ name: 'class', nullable: true }) schoolClass: string;
  @Column({ nullable: true }) dateOfBirth: string;
  @OneToOne(() => User, (user) => user.studentProfile)
  @JoinColumn()
  user: User;
}

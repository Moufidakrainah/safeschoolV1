import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from 'typeorm'
import { User } from '../users/user.entity';

@Entity('student_profiles')
export class StudentProfile {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ nullable: true })
    parentEmail: string;

    @Column({ nullable: true })
    parentPhone: string;

    @Column({ nullable: true })
    class: string;

    @Column({ nullable: true })
    dateOfBirth: string;

    @OneToOne(() => User, (user) => user.studentProfile)
    @JoinColumn()
    user: User;
}

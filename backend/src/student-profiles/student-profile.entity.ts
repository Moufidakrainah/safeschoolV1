import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToMany,
  ManyToOne,
} from "typeorm";
import { User } from "../users/user.entity";
import { Parent } from "../parents/parent.entity";
import { SchoolClass } from "../classes/school-class.entity";

@Entity("student_profiles")
export class StudentProfile {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ nullable: true, type: "date" }) dateOfBirth: Date | null;

  @ManyToOne(() => SchoolClass, {
    nullable: true,
    eager: true,
    onDelete: "SET NULL",
  })
  @JoinColumn({ name: "classId" })
  schoolClass: SchoolClass | null;

  @OneToOne(() => User, (user) => user.studentProfile)
  @JoinColumn()
  user: User;

  @ManyToMany(() => Parent, (parent) => parent.students)
  parents: Parent[];
}

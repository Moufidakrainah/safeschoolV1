import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
} from "typeorm";
import { User } from "../users/user.entity";
import { SchoolClass } from "../classes/class.entity";

@Entity("staff_profiles")
export class StaffProfile {
  @PrimaryGeneratedColumn("uuid") id: string;

  @Column({ type: "varchar" }) profession: string;

  @Column({ type: "varchar", nullable: true, default: null }) subject:
    | string
    | null;

  @OneToOne(() => User, { onDelete: "CASCADE" })
  @JoinColumn()
  user: User;

  @ManyToMany(() => SchoolClass, (schoolClass) => schoolClass.staff)
  @JoinTable({ name: "staff_classes" })
  classes: SchoolClass[];
}

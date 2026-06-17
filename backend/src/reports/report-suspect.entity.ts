import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { Report } from "./report.entity";
import { User } from "../users/user.entity";

@Entity("report_suspects")
export class ReportSuspect {
  @PrimaryGeneratedColumn("uuid") id: string;

  @ManyToOne(() => Report, (report) => report.suspects, { onDelete: "CASCADE" })
  report: Report;

  @Column()
  freeText: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "resolvedUserId" })
  resolvedUser: User | null;
}

import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { Report } from "./report.entity";
import { User } from "../users/user.entity";

@Entity("report_victims")
export class ReportVictim {
  @PrimaryGeneratedColumn("uuid") id: string;

  @ManyToOne(() => Report, (report) => report.victims, { onDelete: "CASCADE" })
  report: Report;

  @Column()
  freeText: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "resolvedUserId" })
  resolvedUser: User | null;
}

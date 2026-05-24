<<<<<<< HEAD
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
=======
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, } from "typeorm";
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
import { Report } from "./report.entity";
import { User } from "../users/user.entity";

@Entity("report_suspects")
export class ReportSuspect {
  @PrimaryGeneratedColumn("uuid") id: string;
<<<<<<< HEAD
  @ManyToOne(() => Report, (report) => report.suspects, { onDelete: "CASCADE" })
  report: Report;
  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" }) user: User;
  @Column({ nullable: true }) freeText: string;
=======

  @ManyToOne(() => Report, (report) => report.suspects, { onDelete: "CASCADE" })
  report: Report;

  @Column() 
  freeText: string;

  @ManyToOne(() => User, { nullable: true, onDelete: "SET NULL" })
  @JoinColumn({ name: "resolvedUserId" })
  resolvedUser: User;
  
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
}

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { UsersService } from "./users.service";
import { UsersController } from "./users.controller";
import { User } from "./user.entity";
import { StudentProfile } from "../student-profiles/student-profile.entity";
import { Report } from "../reports/report.entity";
import { SchoolClass } from "../classes/class.entity";
import { StaffProfile } from "../staff/staff-profile.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User,
      StudentProfile,
      Report,
      SchoolClass,
      StaffProfile,
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

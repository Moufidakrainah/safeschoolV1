import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
<<<<<<< HEAD
import { StudentProfile } from "./student-profile.entity";
import { StudentProfilesService } from "./student-profiles.service";
import { User } from "../users/user.entity";
import { SchoolClass } from "../classes/class.entity";

@Module({
  imports: [TypeOrmModule.forFeature([StudentProfile, User, SchoolClass])],
=======
import { StudentProfilesController } from "./student-profiles.controller";
import { StudentProfilesService } from "./student-profiles.service";
import { StudentProfile } from "./student-profile.entity";
import { SchoolClass } from "../classes/school-class.entity";

@Module({
  imports: [TypeOrmModule.forFeature([StudentProfile, SchoolClass])],
  controllers: [StudentProfilesController],
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
  providers: [StudentProfilesService],
  exports: [StudentProfilesService],
})
export class StudentProfilesModule {}

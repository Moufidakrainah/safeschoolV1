import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StudentProfilesController } from "./student-profiles.controller";
import { StudentProfilesService } from "./student-profiles.service";
import { StudentProfile } from "./student-profile.entity";

@Module({
  imports: [TypeOrmModule.forFeature([StudentProfile])],
  controllers: [StudentProfilesController],
  providers: [StudentProfilesService],
  exports: [StudentProfilesService],
})
export class StudentProfilesModule {}

import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { StaffProfile } from "./staff-profile.entity";
import { StaffProfilesService } from "./staff-profiles.service";
import { StaffProfilesController } from "./staff-profiles.controller";
<<<<<<< HEAD
import { SchoolClass } from "../classes/class.entity";
=======
import { SchoolClass } from "../classes/school-class.entity";
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e

@Module({
  imports: [TypeOrmModule.forFeature([StaffProfile, SchoolClass])],
  controllers: [StaffProfilesController],
  providers: [StaffProfilesService],
  exports: [StaffProfilesService],
})
export class StaffProfilesModule {}

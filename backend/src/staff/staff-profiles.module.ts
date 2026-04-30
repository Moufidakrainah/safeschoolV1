import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StaffProfile } from './staff-profile.entity';
import { StaffProfilesService } from './staff-profiles.service';
import { StaffProfilesController } from './staff-profiles.controller';
import { SchoolClass } from '../classes/school-class.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StaffProfile, SchoolClass])],
  controllers: [StaffProfilesController],
  providers: [StaffProfilesService],
  exports: [StaffProfilesService],
})
export class StaffProfilesModule {}

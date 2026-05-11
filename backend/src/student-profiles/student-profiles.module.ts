import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentProfile } from './student-profile.entity';
import { StudentProfilesService } from './student-profiles.service';
import { User } from '../users/user.entity';
import { SchoolClass } from '../classes/class.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([StudentProfile, User, SchoolClass]),
  ],
  providers: [StudentProfilesService],
  exports: [StudentProfilesService],
})
export class StudentProfilesModule {}

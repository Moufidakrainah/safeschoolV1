import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';
import { StudentProfile } from '../student-profiles/student-profile.entity';
import { Report } from '../reports/report.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, StudentProfile, Report])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}

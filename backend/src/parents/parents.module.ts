import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Parent } from './parent.entity';
import { ParentsService } from './parents.service';
import { ParentsController } from './parents.controller';
import { StudentProfile } from '../student-profiles/student-profile.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Parent, StudentProfile])],
  controllers: [ParentsController],
  providers: [ParentsService],
  exports: [ParentsService],
})
export class ParentsModule {}

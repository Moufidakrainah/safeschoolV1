import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { SchoolClass } from "./school-class.entity";
import { ClassesService } from "./classes.service";
import { ClassesController } from "./classes.controller";

@Module({
  imports: [TypeOrmModule.forFeature([SchoolClass])],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}

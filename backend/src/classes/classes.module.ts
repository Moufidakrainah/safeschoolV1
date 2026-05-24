import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
<<<<<<< HEAD
import { SchoolClass } from "./class.entity";
=======
import { SchoolClass } from "./school-class.entity";
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
import { ClassesService } from "./classes.service";
import { ClassesController } from "./classes.controller";

@Module({
  imports: [TypeOrmModule.forFeature([SchoolClass])],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}

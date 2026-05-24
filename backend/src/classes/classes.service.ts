import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SchoolClass } from "./school-class.entity";

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(SchoolClass) private classRepo: Repository<SchoolClass>,
  ) {}

  async create(level: string, section: string): Promise<SchoolClass> {
    const schoolClass = this.classRepo.create({ level, section });
    return this.classRepo.save(schoolClass);
  }

  async findAll(): Promise<SchoolClass[]> {
    return this.classRepo.find({ relations: ["staff"] });
  }

  async findOne(id: string): Promise<SchoolClass> {
    const schoolClass = await this.classRepo.findOne({
      where: { id },
      relations: ["staff", "staff.user"],
    });
    if (!schoolClass) throw new NotFoundException("Classe introuvable");
    return schoolClass;
  }

  async update(id: string, dto: { level?: string; section?: string }): Promise<SchoolClass> {
    const schoolClass = await this.findOne(id);
    if (dto.level) schoolClass.level = dto.level;
    if (dto.section) schoolClass.section = dto.section;
    return this.classRepo.save(schoolClass);
  }

  async remove(id: string): Promise<void> {
    const schoolClass = await this.findOne(id);
    // Vérifier qu'il n'y a pas d'élèves dans cette classe
    const studentCount = await this.classRepo
      .createQueryBuilder('class')
      .leftJoin('student_profiles', 'sp', 'sp."classId" = class.id')
      .where('class.id = :id', { id })
      .andWhere('sp.id IS NOT NULL')
      .getCount();
    if (studentCount > 0) {
      throw new BadRequestException('CLASS_HAS_STUDENTS');
    }
    await this.classRepo.remove(schoolClass);
  }
}

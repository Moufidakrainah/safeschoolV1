import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { SchoolClass } from "./school-class.entity";

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(SchoolClass) private classRepo: Repository<SchoolClass>,
  ) {}

  // Création d'une nouvelle classe
  async create(level: string, section: string): Promise<SchoolClass> {
    const schoolClass = this.classRepo.create({
      level: level.trim(),
      section: section.trim(),
    });
    return this.classRepo.save(schoolClass);
  }

  // Récupération de toutes les classes
  async findAll(): Promise<SchoolClass[]> {
    return this.classRepo.find();
  }

  // Récupération d'une classe par son id
  async findOne(id: string): Promise<SchoolClass> {
    const schoolClass = await this.classRepo.findOne({
      where: { id },
      relations: ["staff", "staff.user"],
    });
    if (!schoolClass) throw new NotFoundException("Classe introuvable");
    return schoolClass;
  }

  // Modification d'une classe
  async update(id: string, dto: { level?: string; section?: string }): Promise<SchoolClass> {
    const schoolClass = await this.findOne(id);
    if (dto.level) schoolClass.level = dto.level.trim();
    if (dto.section) schoolClass.section = dto.section.trim();
    return this.classRepo.save(schoolClass);
  }

  // Suppression d'une classe (bloquée si des élèves sont inscrits)
  async remove(id: string): Promise<void> {
    const schoolClass = await this.findOne(id);
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
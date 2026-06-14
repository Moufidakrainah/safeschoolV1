import { Injectable, NotFoundException, BadRequestException, ConflictException } from "@nestjs/common";
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
    const trimmedLevel   = level.trim();
    const trimmedSection = section.trim().toUpperCase();

    // ── Vérification doublon ──
    const existing = await this.classRepo.findOne({
      where: { level: trimmedLevel, section: trimmedSection },
    });
    if (existing) {
      throw new ConflictException('CLASS_ALREADY_EXISTS');
    }

    const schoolClass = this.classRepo.create({
      level:   trimmedLevel,
      section: trimmedSection,
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

    const newLevel   = dto.level   ? dto.level.trim()                    : schoolClass.level;
    const newSection = dto.section ? dto.section.trim().toUpperCase()     : schoolClass.section;

    // ── Vérification doublon (exclure la classe en cours de modification) ──
    const existing = await this.classRepo.findOne({
      where: { level: newLevel, section: newSection },
    });
    if (existing && existing.id !== id) {
      throw new ConflictException('CLASS_ALREADY_EXISTS');
    }

    schoolClass.level   = newLevel;
    schoolClass.section = newSection;
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
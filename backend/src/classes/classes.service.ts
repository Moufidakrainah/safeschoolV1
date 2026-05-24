import { Injectable, NotFoundException } from "@nestjs/common";
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
    await this.classRepo.remove(schoolClass);
  }
}

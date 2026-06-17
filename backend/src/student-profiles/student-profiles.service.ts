import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StudentProfile } from "./student-profile.entity";
import { SchoolClass } from "../classes/school-class.entity";

@Injectable()
export class StudentProfilesService {
  constructor(
    @InjectRepository(StudentProfile)
    private studentProfilesRepository: Repository<StudentProfile>,
    @InjectRepository(SchoolClass)
    private classesRepository: Repository<SchoolClass>,
  ) {}

  async create(
    classId: string | null,
    dateOfBirth: string,
    userId: string,
  ): Promise<StudentProfile> {
    const schoolClass = classId
      ? await this.classesRepository.findOne({ where: { id: classId } })
      : null;
    const profile = this.studentProfilesRepository.create({
      schoolClass,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      user: { id: userId },
    });
    return this.studentProfilesRepository.save(profile);
  }

  async findAll(): Promise<StudentProfile[]> {
    return this.studentProfilesRepository.find({
      relations: ["user", "schoolClass"],
    });
  }

  async findByUserId(userId: string): Promise<StudentProfile> {
    const profile = await this.studentProfilesRepository.findOne({
      where: { user: { id: userId } },
      relations: ["user", "parents", "schoolClass"],
    });
    if (!profile) throw new NotFoundException("Profil introuvable");
    return profile;
  }

  async update(
    userId: string,
    updates: { classId?: string; dateOfBirth?: string },
  ): Promise<StudentProfile> {
    const profile = await this.findByUserId(userId);
    if (updates.classId) {
      const schoolClass = await this.classesRepository.findOne({
        where: { id: updates.classId },
      });
      if (schoolClass) profile.schoolClass = schoolClass;
    }
    if (updates.dateOfBirth)
      profile.dateOfBirth = new Date(updates.dateOfBirth);
    return this.studentProfilesRepository.save(profile);
  }

  async getParents(userId: string): Promise<any[]> {
    const profile = await this.studentProfilesRepository.findOne({
      where: { user: { id: userId } },
      relations: ["parents"],
    });
    if (!profile) throw new NotFoundException("Profil introuvable");
    return profile.parents ?? [];
  }
}

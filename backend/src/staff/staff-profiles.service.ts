import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { StaffProfile } from "./staff-profile.entity";
import { SchoolClass } from "../classes/school-class.entity";

@Injectable()
export class StaffProfilesService {
  constructor(
    @InjectRepository(StaffProfile) private staffRepo: Repository<StaffProfile>,
    @InjectRepository(SchoolClass) private classRepo: Repository<SchoolClass>,
  ) {}

  async create(dto: {
    userId: string;
    profession: string;
    subject?: string;
    classIds?: string[];
  }): Promise<StaffProfile> {
    const profile = new StaffProfile();
    profile.profession = dto.profession;
    profile.subject = dto.subject ?? null;
    profile.user = { id: dto.userId } as any;

    if (dto.classIds?.length) {
      profile.classes = await this.classRepo.findBy({ id: In(dto.classIds) });
    } else {
      profile.classes = [];
    }

    return this.staffRepo.save(profile);
  }

  async findAll(): Promise<StaffProfile[]> {
    return this.staffRepo.find({ relations: ["user", "classes"] });
  }

  async findOne(id: string): Promise<StaffProfile> {
    const profile = await this.staffRepo.findOne({
      where: { id },
      relations: ["user", "classes"],
    });
    if (!profile) throw new NotFoundException("Profil introuvable");
    return profile;
  }

  async update(
    id: string,
    dto: { profession?: string; subject?: string; classIds?: string[] },
  ): Promise<StaffProfile> {
    const profile = await this.findOne(id);
    if (dto.profession) profile.profession = dto.profession;
    if (dto.subject !== undefined) profile.subject = dto.subject ?? null;
    if (dto.classIds) {
      profile.classes = await this.classRepo.findBy({ id: In(dto.classIds) });
    }
    return this.staffRepo.save(profile);
  }

  async remove(id: string): Promise<void> {
    const profile = await this.findOne(id);
    await this.staffRepo.remove(profile);
  }

  async findByUserId(userId: string): Promise<StaffProfile> {
    const profile = await this.staffRepo.findOne({
      where: { user: { id: userId } },
      relations: ["user", "classes"],
    });
    if (!profile) throw new NotFoundException("Profil introuvable");
    return profile;
  }
}

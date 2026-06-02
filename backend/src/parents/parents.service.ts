import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Parent } from "./parent.entity";
import { StudentProfile } from "../student-profiles/student-profile.entity";

@Injectable()
export class ParentsService {
  constructor(
    @InjectRepository(Parent) private parentsRepo: Repository<Parent>,
    @InjectRepository(StudentProfile)
    private studentRepo: Repository<StudentProfile>,
  ) {}

  async create(dto: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address?: string;
    studentIds?: string[];
  }): Promise<Parent> {
    const nameRegex = /^[a-zA-ZÀ-ÿ'\-]{2,20}$/;
    if (!nameRegex.test(dto.firstName)) throw new BadRequestException("Prénom invalide (2-20 caractères, lettres et tirets uniquement)");
    if (!nameRegex.test(dto.lastName)) throw new BadRequestException("Nom invalide (2-20 caractères, lettres et tirets uniquement)");
    if (dto.phone && !/^[0-9+\s]{0,15}$/.test(dto.phone)) throw new BadRequestException("Téléphone invalide");
    const parent = this.parentsRepo.create({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      address: dto.address,
    });
    if (dto.studentIds?.length) {
      parent.students = await this.studentRepo.findBy({
        id: In(dto.studentIds),
      });
    }
    return this.parentsRepo.save(parent);
  }

  async findAll(): Promise<Parent[]> {
    return this.parentsRepo.find({ relations: ["students", "students.user"] });
  }

  async findOne(id: string): Promise<Parent> {
    const parent = await this.parentsRepo.findOne({
      where: { id },
      relations: ["students", "students.user"],
    });
    if (!parent) throw new NotFoundException("Parent introuvable");
    return parent;
  }

  async update(
    id: string,
    dto: {
      firstName?: string;
      lastName?: string;
      email?: string;
      phone?: string;
      address?: string;
      studentIds?: string[];
    },
  ): Promise<Parent> {
    const parent = await this.findOne(id);
    const nameRegex = /^[a-zA-ZÀ-ÿ'\-]{2,20}$/;
    if (dto.firstName) {
      if (!nameRegex.test(dto.firstName)) throw new BadRequestException("Prénom invalide");
      parent.firstName = dto.firstName;
    }
    if (dto.lastName) {
      if (!nameRegex.test(dto.lastName)) throw new BadRequestException("Nom invalide");
      parent.lastName = dto.lastName;
    }
    if (dto.email) parent.email = dto.email;
    if (dto.phone !== undefined) parent.phone = dto.phone;
    if (dto.address !== undefined) parent.address = dto.address;
    if (dto.studentIds) {
      parent.students = await this.studentRepo.findBy({
        id: In(dto.studentIds),
      });
    }
    return this.parentsRepo.save(parent);
  }

  async remove(id: string): Promise<void> {
    const parent = await this.findOne(id);
    await this.parentsRepo.remove(parent);
  }
}

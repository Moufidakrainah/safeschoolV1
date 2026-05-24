import { Injectable, NotFoundException } from "@nestjs/common";
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
    if (dto.firstName) parent.firstName = dto.firstName;
    if (dto.lastName) parent.lastName = dto.lastName;
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

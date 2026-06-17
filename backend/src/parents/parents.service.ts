import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { Parent } from "./parent.entity";
import { StudentProfile } from "../student-profiles/student-profile.entity";
import { CreateParentDto } from "./dto/create-parent.dto";
import { UpdateParentDto } from "./dto/update-parent.dto";

@Injectable()
export class ParentsService {
  constructor(
    @InjectRepository(Parent) private parentsRepo: Repository<Parent>,
    @InjectRepository(StudentProfile)
    private studentRepo: Repository<StudentProfile>,
  ) {}

  // Création d'un parent
  async create(dto: CreateParentDto): Promise<Parent> {
    // Vérifier qu'un élève n'a pas déjà 2 parents
    if (dto.studentIds?.length) {
      for (const studentId of dto.studentIds) {
        const student = await this.studentRepo.findOne({
          where: { id: studentId },
          relations: ["parents"],
        });
        if (student && student.parents?.length >= 2) {
          throw new BadRequestException("MAX_PARENTS_REACHED");
        }
      }
    }

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

  // Récupération de tous les parents
  async findAll(): Promise<Parent[]> {
    return this.parentsRepo.find({ relations: ["students", "students.user"] });
  }

  // Récupération d'un parent par son id
  async findOne(id: string): Promise<Parent> {
    const parent = await this.parentsRepo.findOne({
      where: { id },
      relations: ["students", "students.user"],
    });
    if (!parent) throw new NotFoundException("Parent introuvable");
    return parent;
  }

  // Modification d'un parent
  async update(id: string, dto: UpdateParentDto): Promise<Parent> {
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

  // Suppression d'un parent
  async remove(id: string): Promise<void> {
    const parent = await this.findOne(id);
    await this.parentsRepo.remove(parent);
  }
}

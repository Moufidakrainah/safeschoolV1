import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { StudentProfile } from "./student-profile.entity";
<<<<<<< HEAD
import { SchoolClass } from "../classes/class.entity";
import { User } from "../users/user.entity";
=======
import { SchoolClass } from "../classes/school-class.entity";
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e

@Injectable()
export class StudentProfilesService {
  constructor(
    @InjectRepository(StudentProfile)
    private studentProfilesRepository: Repository<StudentProfile>,
    @InjectRepository(SchoolClass)
<<<<<<< HEAD
    private classRepository: Repository<SchoolClass>,

    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(
    classId: string,
    dateOfBirth: string,
    userId: string,
  ): Promise<StudentProfile> {
    const schoolClass = await this.classRepository.findOneBy({ id: classId });
    if (!schoolClass) throw new NotFoundException("Classe introuvable");

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException("Utilisateur introuvable");

=======
    private classesRepository: Repository<SchoolClass>,
  ) {}

  async create(classId: string | null, dateOfBirth: string, userId: string): Promise<StudentProfile> {
    const schoolClass = classId
      ? await this.classesRepository.findOne({ where: { id: classId } })
      : null;
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    const profile = this.studentProfilesRepository.create({
      schoolClass,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) as any : null,
      user: { id: userId },
    });
    return this.studentProfilesRepository.save(profile);
  }

  async findAll(): Promise<StudentProfile[]> {
<<<<<<< HEAD
    return this.studentProfilesRepository.find({
      relations: ["user", "class"],
    });
=======
    return this.studentProfilesRepository.find({ relations: ["user", "schoolClass"] });
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
  }

  async findByUserId(userId: string): Promise<StudentProfile> {
    const profile = await this.studentProfilesRepository.findOne({
      where: { user: { id: userId } },
<<<<<<< HEAD
      relations: ["user", "parents", "class"],
    });

    if (!profile) throw new NotFoundException("Profil introuvable");
=======
      relations: ['user', 'parents', 'schoolClass'],
    });
    if (!profile) throw new NotFoundException('Profil introuvable');
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    return profile;
  }

  async update(
    userId: string,
    updates: { classId?: string; dateOfBirth?: string },
  ): Promise<StudentProfile> {
    const profile = await this.findByUserId(userId);
    if (updates.classId) {
<<<<<<< HEAD
      const schoolClass = await this.classRepository.findOneBy({
        id: updates.classId,
      });
      if (!schoolClass) throw new NotFoundException("Classe introuvable");
      profile.class = schoolClass;
=======
      const schoolClass = await this.classesRepository.findOne({ where: { id: updates.classId } });
      if (schoolClass) profile.schoolClass = schoolClass;
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    }
    if (updates.dateOfBirth) profile.dateOfBirth = new Date(updates.dateOfBirth) as any;
    return this.studentProfilesRepository.save(profile);
  }

  async getParents(userId: string): Promise<any[]> {
    const profile = await this.studentProfilesRepository.findOne({
      where: { user: { id: userId } },
      relations: ["parents"],
    });
<<<<<<< HEAD

    if (!profile) throw new NotFoundException("Profil introuvable");
=======
    if (!profile) throw new NotFoundException('Profil introuvable');
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    return profile.parents ?? [];
  }
}

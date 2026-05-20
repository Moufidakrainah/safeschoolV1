import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentProfile } from './student-profile.entity';
import { SchoolClass } from '../classes/class.entity';
import { User } from '../users/user.entity';

@Injectable()
export class StudentProfilesService {
  constructor(
    @InjectRepository(StudentProfile)
    private studentProfilesRepository: Repository<StudentProfile>,

    @InjectRepository(SchoolClass)
    private classRepository: Repository<SchoolClass>,

    @InjectRepository(User)
    private userRepository: Repository<User>,

  ) {}

  async create(classId: string, dateOfBirth: string, userId: string): Promise<StudentProfile> {
    const schoolClass = await this.classRepository.findOneBy({ id: classId });
    if (!schoolClass) throw new NotFoundException('Classe introuvable');

    const user = await this.userRepository.findOneBy({ id: userId });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const profile = this.studentProfilesRepository.create({
      class: schoolClass,
      dateOfBirth,
      user,
    });

    return this.studentProfilesRepository.save(profile);
  }

  async findAll(): Promise<StudentProfile[]> {
    return this.studentProfilesRepository.find({
      relations: ['user', 'class'],
    });
  }

  async findByUserId(userId: string): Promise<StudentProfile> {
    const profile = await this.studentProfilesRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user', 'parents', 'class'],
    });

    if (!profile) throw new NotFoundException('Profil introuvable');
    return profile;
  }

  async update(userId: string, updates: { classId?: string; dateOfBirth?: string }): Promise<StudentProfile> {
    const profile = await this.findByUserId(userId);

    if (updates.classId) {
      const schoolClass = await this.classRepository.findOneBy({ id: updates.classId });
      if (!schoolClass) throw new NotFoundException('Classe introuvable');
      profile.class = schoolClass;
    }

    if (updates.dateOfBirth) {
      profile.dateOfBirth = updates.dateOfBirth;
    }

    return this.studentProfilesRepository.save(profile);
  }

  async getParents(userId: string): Promise<any[]> {
    const profile = await this.studentProfilesRepository.findOne({
      where: { user: { id: userId } },
      relations: ['parents'],
    });

    if (!profile) throw new NotFoundException('Profil introuvable');
    return profile.parents ?? [];
  }
}

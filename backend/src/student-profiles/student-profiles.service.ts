import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StudentProfile } from './student-profile.entity';

@Injectable()
export class StudentProfilesService {
  constructor(
    @InjectRepository(StudentProfile)
    private studentProfilesRepository: Repository<StudentProfile>,
  ) {}

  async create(schoolClass: string, dateOfBirth: string, userId: string): Promise<StudentProfile> {
    const profile = this.studentProfilesRepository.create({ schoolClass, dateOfBirth, user: { id: userId } });
    return this.studentProfilesRepository.save(profile);
  }

  async findAll(): Promise<StudentProfile[]> {
    return this.studentProfilesRepository.find({ relations: ['user'] });
  }

  async findByUserId(userId: string): Promise<StudentProfile> {
    const profile = await this.studentProfilesRepository.findOne({ where: { user: { id: userId } }, relations: ['user'] });
    if (!profile) throw new NotFoundException('Profil introuvable');
    return profile;
  }

  async update(userId: string, updates: { schoolClass?: string; dateOfBirth?: string }): Promise<StudentProfile> {
    const profile = await this.findByUserId(userId);
    if (updates.schoolClass) profile.schoolClass = updates.schoolClass;
    if (updates.dateOfBirth) profile.dateOfBirth = updates.dateOfBirth;
    return this.studentProfilesRepository.save(profile);
  }
}

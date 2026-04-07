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

  // Créer un profil étudiant
  async create(
    parentEmail: string,
    parentPhone: string,
    schoolClass: string,
    dateOfBirth: string,
    userId: number,
  ): Promise<StudentProfile> {
    const profile = this.studentProfilesRepository.create({
      parentEmail,
      parentPhone,
      schoolClass,
      dateOfBirth,
      user: { id: userId },
    });
    return this.studentProfilesRepository.save(profile);
  }

  // Récupérer tous les profils
  async findAll(): Promise<StudentProfile[]> {
    return this.studentProfilesRepository.find({
      relations: ['user'],
    });
  }

  // Récupérer un profil par userId
  async findByUserId(userId: number): Promise<StudentProfile> {
    const profile = await this.studentProfilesRepository.findOne({
      where: { user: { id: userId } },
      relations: ['user'],
    });
    if (!profile) throw new NotFoundException('Profil introuvable');
    return profile;
  }

  // Modifier un profil
  async update(userId: number, updates: {
    parentEmail?: string;
    parentPhone?: string;
    schoolClass?: string;
    dateOfBirth?: string;
  }): Promise<StudentProfile> {
    const profile = await this.findByUserId(userId);
    if (updates.parentEmail) profile.parentEmail = updates.parentEmail;
    if (updates.parentPhone) profile.parentPhone = updates.parentPhone;
    if (updates.schoolClass) profile.schoolClass = updates.schoolClass;
    if (updates.dateOfBirth) profile.dateOfBirth = updates.dateOfBirth;
    return this.studentProfilesRepository.save(profile);
  }
}
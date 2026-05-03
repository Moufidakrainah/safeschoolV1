import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { StudentProfile } from '../student-profiles/student-profile.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(StudentProfile) private profilesRepository: Repository<StudentProfile>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['studentProfile', 'staffProfile'],
    });
  }

  async findByEmailWithProfile(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['studentProfile', 'staffProfile'],
    });
  }

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async create(email: string, password: string, firstName: string, lastName: string, role: UserRole = UserRole.STUDENT): Promise<User> {
    const hashed = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({ email, password: hashed, firstName, lastName, role });
    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({ relations: ['studentProfile'] });
  }

  async search(query: string): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.firstName) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(user.lastName) LIKE LOWER(:query)', { query: `%${query}%` })
      .andWhere('user.role NOT IN (:...roles)', { roles: ['admin', 'director'] })
      .limit(5)
      .getMany();
  }

  async createByAdmin(dto: { email: string; password: string; firstName: string; lastName: string; role: string; schoolClass?: string }): Promise<User> {
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      email: dto.email, password: hashed,
      firstName: dto.firstName, lastName: dto.lastName,
      role: dto.role as UserRole,
    });
    const saved = await this.usersRepository.save(user);
    if (dto.role === 'student' && dto.schoolClass) {
      const profile = this.profilesRepository.create({ user: saved, schoolClass: dto.schoolClass });
      await this.profilesRepository.save(profile);
    }
    return saved;
  }

  async updateByAdmin(id: string, dto: { email?: string; firstName?: string; lastName?: string; role?: string; schoolClass?: string }): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id }, relations: ['studentProfile'] });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    if (dto.email) user.email = dto.email;
    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;
    if (dto.role) user.role = dto.role as UserRole;
    const saved = await this.usersRepository.save(user);
    if (dto.schoolClass) {
      if (user.studentProfile) {
        await this.profilesRepository.update(user.studentProfile.id, { schoolClass: dto.schoolClass });
      } else {
        const profile = this.profilesRepository.create({ user: saved, schoolClass: dto.schoolClass });
        await this.profilesRepository.save(profile);
      }
    }
    return saved;
  }

  async deleteByAdmin(id: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');
    await this.usersRepository.query(`DELETE FROM notifications WHERE "userId" = $1`, [id]);
    await this.usersRepository.query(`DELETE FROM report_suspects WHERE "userId" = $1`, [id]);
    await this.usersRepository.query(`DELETE FROM report_notes WHERE "authorId" = $1`, [id]);
    await this.usersRepository.query(`DELETE FROM reports WHERE "studentId" = $1`, [id]);
    await this.usersRepository.query(`DELETE FROM student_profiles WHERE "userId" = $1`, [id]);
    await this.usersRepository.remove(user);
  }
}

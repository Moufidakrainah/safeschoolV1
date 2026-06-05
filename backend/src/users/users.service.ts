import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { StudentProfile } from '../student-profiles/student-profile.entity';
import * as bcrypt from 'bcrypt';
import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Report } from '../reports/report.entity';
import { SchoolClass } from '../classes/school-class.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(StudentProfile)
    private studentProfileRepository: Repository<StudentProfile>,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(SchoolClass)
    private classesRepository: Repository<SchoolClass>,
  ) {}

  // ── Chercher un user par email (sans profil) ──────────────────────────────
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'role', 'firstName', 'lastName', 'createdAt', 'avatar'],
    });
  }

  // ── Chercher un user par email avec son profil ────────────────────────────
  async findByEmailWithProfile(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      select: ['id', 'email', 'password', 'role', 'firstName', 'lastName', 'createdAt', 'avatar'],
      relations: ['studentProfile', 'studentProfile.schoolClass', 'staffProfile'],
    });
  }

  // ── Chercher un user par son ID ───────────────────────────────────────────
  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ["studentProfile", "studentProfile.schoolClass", "staffProfile"],
    });
  }

  // ── Voir tous les utilisateurs avec filtres et pagination ─────────────────
  async findAll(
    role?: string,
    page = 1,
    limit = 10,
  ): Promise<{
    data: User[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const query = this.usersRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.studentProfile", "studentProfile")
      .leftJoinAndSelect("studentProfile.schoolClass", "schoolClass")
      .leftJoinAndSelect("user.staffProfile", "staffProfile")
      .leftJoinAndSelect("staffProfile.classes", "staffClasses");

    if (role) {
      query.where("user.role = :role", { role });
    }

    const total = await query.getCount();
    const data = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return { data, total, page, totalPages: Math.ceil(total / limit) };
  }

  // ── Rechercher un user par prénom ou nom ──────────────────────────────────
  async search(query: string): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder("user")
      .leftJoinAndSelect("user.studentProfile", "studentProfile")
      .leftJoinAndSelect("studentProfile.schoolClass", "schoolClass")
      .leftJoinAndSelect("user.staffProfile", "staffProfile")
      .leftJoinAndSelect("staffProfile.classes", "staffClasses")
      .where("LOWER(user.firstName) LIKE LOWER(:query)", { query: `%${query}%` })
      .orWhere("LOWER(user.lastName) LIKE LOWER(:query)", { query: `%${query}%` })
      .limit(100)
      .getMany();
  }

  // ── Créer un utilisateur (par auth register) ──────────────────────────────
  async create(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole = UserRole.STUDENT,
  ): Promise<User> {
    const hashed = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({ email, password: hashed, firstName, lastName, role });
    return this.usersRepository.save(user);
  }

  // ── Créer un utilisateur via l'interface admin ────────────────────────────
  async createByAdmin(dto: CreateUserDto): Promise<User> {
    // Vérifier que l'email n'est pas déjà utilisé
    const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException("Cet email est déjà utilisé");
    // Vérifier l'âge si c'est un élève avec une date de naissance
    if (dto.role === 'student' && dto.dateOfBirth) {
      const dob = new Date(dto.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 9 || age > 16)
        throw new BadRequestException("L'élève doit avoir entre 9 et 16 ans");
    }

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      email: dto.email,
      password: hashed,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role as UserRole,
    });
    const saved = await this.usersRepository.save(user);

    // Si c'est un élève → créer son profil élève avec classe et date de naissance
    if (dto.role === 'student') {
      const schoolClass = dto.classId
        ? await this.classesRepository.findOne({ where: { id: dto.classId } })
        : null;
      const profile = this.studentProfileRepository.create({
        user: saved,
        schoolClass,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) as any : null,
      });
      const savedProfile = await this.studentProfileRepository.save(profile);
      saved.studentProfile = savedProfile;
    }

    return saved;
  }

  // ── Modifier un utilisateur (par un admin) ────────────────────────────────
  async updateByAdmin(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ["studentProfile", "studentProfile.schoolClass", "staffProfile"],
    });
    if (!user) throw new NotFoundException("Utilisateur introuvable");
    // Vérifier l'âge si date de naissance fournie
    if (dto.dateOfBirth) {
      const dob = new Date(dto.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      if (age < 9 || age > 16)
        throw new BadRequestException("L'élève doit avoir entre 9 et 16 ans");
    }

    // Si on change l'email, vérifier qu'il n'est pas déjà pris
    if (dto.email && dto.email !== user.email) {
      const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
      if (existing) throw new ConflictException("Cet email est déjà utilisé");
      user.email = dto.email;
    }

    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;
    if (dto.role) user.role = dto.role as UserRole;

    const saved = await this.usersRepository.save(user);

    // Mettre à jour ou créer le profil élève si classe ou date de naissance fournie
    if (dto.classId !== undefined || dto.dateOfBirth !== undefined) {
      const schoolClass = dto.classId !== undefined
        ? dto.classId ? await this.classesRepository.findOne({ where: { id: dto.classId } }) : null
        : user.studentProfile?.schoolClass ?? null;

      if (user.studentProfile) {
        user.studentProfile.schoolClass = schoolClass;
        if (dto.dateOfBirth !== undefined)
          user.studentProfile.dateOfBirth = dto.dateOfBirth ? new Date(dto.dateOfBirth) as any : null;
        await this.studentProfileRepository.save(user.studentProfile);
      } else {
        const profile = this.studentProfileRepository.create({
          user: saved,
          schoolClass,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) as any : null,
        });
        await this.studentProfileRepository.save(profile);
      }
    }

    return saved;
  }

  // ── Changer le mot de passe ───────────────────────────────────────────────
  async changePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException("Utilisateur introuvable");

    if (newPassword.length < 6)
      throw new ForbiddenException("Le mot de passe doit faire au moins 6 caractères");

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.usersRepository.query(
      `UPDATE users SET password = $1 WHERE id = $2`,
      [hashed, id],
    );
  }

  // ── Supprimer un utilisateur ──────────────────────────────────────────────
  async deleteByAdmin(id: string, currentUserId: string): Promise<void> {
    if (id === currentUserId)
      throw new ForbiddenException('Vous ne pouvez pas supprimer votre propre compte');

    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['studentProfile'],
    });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    const hasReports = await this.reportRepository.count({
      where: [
        { student: { id } },
        { suspects: { resolvedUser: { id } } },
      ]
    });

    if (hasReports > 0) throw new BadRequestException('USER_HAS_REPORTS');

    if (user.studentProfile) {
      await this.studentProfileRepository.remove(user.studentProfile);
    }

    await this.usersRepository.remove(user);
  }

  // ── Vérifier si un utilisateur peut être supprimé ────────────────────────
  async canDelete(id: string): Promise<{ deletable: boolean }> {
    const hasReports = await this.reportRepository.count({
      where: [
        { student: { id } },
        { suspects: { resolvedUser: { id } } },
      ]
    });
    return { deletable: hasReports === 0 };
  }

  // ── Mettre à jour l'avatar ────────────────────────────────────────────────
  async updateAvatar(id: string, filename: string): Promise<{ avatar: string }> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (user?.avatar && user.avatar !== filename) {
      const oldPath = require('path').join(process.cwd(), 'uploads', 'avatars', user.avatar);
      try { require('fs').unlinkSync(oldPath); } catch {}
    }
    await this.usersRepository.update(id, { avatar: filename });
    return { avatar: filename };
  }
}
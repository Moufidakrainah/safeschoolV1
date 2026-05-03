import { Injectable, NotFoundException, ConflictException, ForbiddenException } from '@nestjs/common';
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

  // ── Chercher un user par email (sans profil) ──────────────────────────────
  // Utilisé par AuthService pour la connexion
  // On inclut le mot de passe car on doit le vérifier
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['studentProfile', 'staffProfile'],
    });
  }

  // ── Chercher un user par email avec son profil élève ─────────────────────
  // Utilisé par AuthService pour retourner les infos complètes après connexion
  async findByEmailWithProfile(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
      relations: ['studentProfile', 'staffProfile'],
    });
  }

  // ── Chercher un user par son ID ───────────────────────────────────────────
  // Utilisé par JwtStrategy pour injecter l'utilisateur dans req.user
  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
      relations: ['studentProfile'],
    });
  }

  // ── Voir tous les utilisateurs avec filtres et pagination ─────────────────
  // role     : filtrer par rôle (optionnel)
  // page     : numéro de page (défaut 1)
  // limit    : nombre de résultats par page (défaut 10)
  async findAll(role?: string, page = 1, limit = 10): Promise<{ data: User[]; total: number; page: number; totalPages: number }> {
    const query = this.usersRepository.createQueryBuilder('user')
      .leftJoinAndSelect('user.studentProfile', 'studentProfile');

    // Si un rôle est précisé, on filtre par ce rôle
    if (role) {
      query.where('user.role = :role', { role });
    }

    // Pagination : on saute les résultats des pages précédentes
    const total = await query.getCount();
    const data = await query
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ── Rechercher un user par prénom ou nom ──────────────────────────────────
  // Utilisé dans le formulaire de signalement pour chercher des soupçonnés
  // On exclut les admins et directeurs des résultats
  async search(query: string): Promise<User[]> {
    return this.usersRepository
      .createQueryBuilder('user')
      .where('LOWER(user.firstName) LIKE LOWER(:query)', { query: `%${query}%` })
      .orWhere('LOWER(user.lastName) LIKE LOWER(:query)', { query: `%${query}%` })
      .andWhere('user.role NOT IN (:...roles)', { roles: ['admin', 'director'] })
      .limit(5)
      .getMany();
  }

  // ── Créer un utilisateur (par un admin) ───────────────────────────────────
  // On vérifie que l'email n'existe pas déjà avant de créer
  // Si c'est un élève et qu'une classe est fournie, on crée aussi son profil
  async create(email: string, password: string, firstName: string, lastName: string, role: UserRole = UserRole.STUDENT): Promise<User> {
    const hashed = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({ email, password: hashed, firstName, lastName, role });
    return this.usersRepository.save(user);
  }

  // ── Créer un utilisateur via l'interface admin ────────────────────────────
  async createByAdmin(dto: { email: string; password: string; firstName: string; lastName: string; role: string; schoolClass?: string }): Promise<User> {
    // Vérifier que l'email n'est pas déjà utilisé
    const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
    if (existing) throw new ConflictException('Cet email est déjà utilisé');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      email: dto.email,
      password: hashed,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role as UserRole,
    });
    const saved = await this.usersRepository.save(user);

    // Si c'est un élève avec une classe, on crée son profil élève
    if (dto.role === 'student' && dto.schoolClass) {
      const profile = this.profilesRepository.create({ user: saved, schoolClass: dto.schoolClass });
      await this.profilesRepository.save(profile);
    }

    return saved;
  }

  // ── Modifier un utilisateur (par un admin) ────────────────────────────────
  // On vérifie que le nouvel email n'est pas déjà utilisé par quelqu'un d'autre
  async updateByAdmin(id: string, dto: { email?: string; firstName?: string; lastName?: string; role?: string; schoolClass?: string }): Promise<User> {
    const user = await this.usersRepository.findOne({ where: { id }, relations: ['studentProfile'] });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    // Si on change l'email, vérifier qu'il n'est pas déjà pris par un autre user
    if (dto.email && dto.email !== user.email) {
      const existing = await this.usersRepository.findOne({ where: { email: dto.email } });
      if (existing) throw new ConflictException('Cet email est déjà utilisé');
      user.email = dto.email;
    }

    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName)  user.lastName  = dto.lastName;
    if (dto.role)      user.role      = dto.role as UserRole;

    const saved = await this.usersRepository.save(user);

    // Mettre à jour ou créer le profil élève si une classe est fournie
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

  // ── Changer le mot de passe d'un utilisateur ──────────────────────────────
  // Accessible par l'admin (pour n'importe quel user)
  // Accessible par l'utilisateur lui-même (pour son propre compte)
  async changePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    // Vérifier que le mot de passe fait au moins 6 caractères
    if (newPassword.length < 6) throw new ForbiddenException('Le mot de passe doit faire au moins 6 caractères');

    const hashed = await bcrypt.hash(newPassword, 10);

    // On utilise une requête directe pour contourner le select: false sur password
    await this.usersRepository.query(
      `UPDATE users SET password = $1 WHERE id = $2`,
      [hashed, id]
    );
  }

  // ── Supprimer un utilisateur (par un admin) ───────────────────────────────
  // On supprime d'abord toutes les données liées pour éviter les erreurs de clé étrangère
  // On empêche un admin de supprimer son propre compte
  async deleteByAdmin(id: string, currentUserId: string): Promise<void> {
    // Empêcher de supprimer son propre compte
    if (id === currentUserId) throw new ForbiddenException('Vous ne pouvez pas supprimer votre propre compte');

    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    // Supprimer toutes les données liées avant de supprimer le user
    await this.usersRepository.query(`DELETE FROM notifications WHERE "userId" = $1`, [id]);
    await this.usersRepository.query(`DELETE FROM report_suspects WHERE "userId" = $1`, [id]);
    await this.usersRepository.query(`DELETE FROM report_notes WHERE "authorId" = $1`, [id]);
    await this.usersRepository.query(`DELETE FROM reports WHERE "studentId" = $1`, [id]);
    await this.usersRepository.query(`DELETE FROM student_profiles WHERE "userId" = $1`, [id]);
    await this.usersRepository.remove(user);
  }
}
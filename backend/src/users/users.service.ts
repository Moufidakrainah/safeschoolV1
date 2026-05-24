<<<<<<< HEAD
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { User, UserRole } from "./user.entity";
import { StudentProfile } from "../student-profiles/student-profile.entity";
import * as bcrypt from "bcrypt";
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { Report } from "../reports/report.entity";
import { SchoolClass } from "../classes/class.entity";
=======
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import { StudentProfile } from '../student-profiles/student-profile.entity';
import * as bcrypt from 'bcrypt';
import { Injectable, NotFoundException, ConflictException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Report } from '../reports/report.entity';
import { SchoolClass } from '../classes/school-class.entity';
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e

@Injectable()
export class UsersService {
  // constructor(
  //   @InjectRepository(User) private usersRepository: Repository<User>,
  //   @InjectRepository(StudentProfile) private profilesRepository: Repository<StudentProfile>,
  // ) {}

<<<<<<< HEAD
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    @InjectRepository(StudentProfile)
    private studentProfileRepository: Repository<StudentProfile>,
    @InjectRepository(Report)
    private reportRepository: Repository<Report>,
    @InjectRepository(SchoolClass)
    private classRepository: Repository<SchoolClass>,
  ) {}
=======

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

>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e

  // ── Chercher un user par email (sans profil) ──────────────────────────────
  // Utilisé par AuthService pour la connexion
  // On inclut le mot de passe car on doit le vérifier
  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
<<<<<<< HEAD
      select: [
        "id",
        "email",
        "password",
        "role",
        "firstName",
        "lastName",
        "createdAt",
      ],
      //   relations: ['studentProfile', 'staffProfile'],
=======
	  select: ['id', 'email', 'password', 'role', 'firstName', 'lastName', 'createdAt', 'avatar'],
    //   relations: ['studentProfile', 'staffProfile'],
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    });
  }

  // ── Chercher un user par email avec son profil élève ─────────────────────
  // Utilisé par AuthService pour retourner les infos complètes après connexion
  async findByEmailWithProfile(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
<<<<<<< HEAD
      select: [
        "id",
        "email",
        "password",
        "role",
        "firstName",
        "lastName",
        "createdAt",
      ],
      relations: ["studentProfile"],
      //   relations: ['studentProfile', 'staffProfile'],
=======
	  select: ['id', 'email', 'password', 'role', 'firstName', 'lastName', 'createdAt', 'avatar'],
      relations: ['studentProfile', 'studentProfile.schoolClass', 'staffProfile'],
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    });
  }

  // ── Chercher un user par son ID ───────────────────────────────────────────
  // Utilisé par JwtStrategy pour injecter l'utilisateur dans req.user
  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { id },
<<<<<<< HEAD
      relations: ["studentProfile"],
=======
      relations: ["studentProfile", "studentProfile.schoolClass", "staffProfile"],
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    });
  }

  // ── Voir tous les utilisateurs avec filtres et pagination ─────────────────
  // role     : filtrer par rôle (optionnel)
  // page     : numéro de page (défaut 1)
  // limit    : nombre de résultats par page (défaut 10)
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
<<<<<<< HEAD
      .leftJoinAndSelect("user.studentProfile", "studentProfile");
=======
      .leftJoinAndSelect("user.studentProfile", "studentProfile")
      .leftJoinAndSelect("studentProfile.schoolClass", "schoolClass")
      .leftJoinAndSelect("user.staffProfile", "staffProfile");
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e

    // Si un rôle est précisé, on filtre par ce rôle
    if (role) {
      query.where("user.role = :role", { role });
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
      .createQueryBuilder("user")
      .where("LOWER(user.firstName) LIKE LOWER(:query)", {
        query: `%${query}%`,
      })
      .orWhere("LOWER(user.lastName) LIKE LOWER(:query)", {
        query: `%${query}%`,
      })
      .andWhere("user.role NOT IN (:...roles)", {
        roles: ["admin", "director"],
      })
      .limit(5)
      .getMany();
  }

  // ── Créer un utilisateur (par un admin) ───────────────────────────────────
  // On vérifie que l'email n'existe pas déjà avant de créer
  // Si c'est un élève et qu'une classe est fournie, on crée aussi son profil
  async create(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: UserRole = UserRole.STUDENT,
  ): Promise<User> {
    const hashed = await bcrypt.hash(password, 10);
    const user = this.usersRepository.create({
      email,
      password: hashed,
      firstName,
      lastName,
      role,
    });
    return this.usersRepository.save(user);
  }

  // ── Créer un utilisateur via l'interface admin ────────────────────────────
<<<<<<< HEAD

=======
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
  async createByAdmin(dto: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
<<<<<<< HEAD
    schoolClass?: string; // ici c'est l'id de la classe
  }): Promise<User> {
    // Vérifier email
=======
    classId?: string;
  }): Promise<User> {
    // Vérifier que l'email n'est pas déjà utilisé
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    const existing = await this.usersRepository.findOne({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException("Cet email est déjà utilisé");

<<<<<<< HEAD
    // Créer l'utilisateur
=======
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    const hashed = await bcrypt.hash(dto.password, 10);
    const user = this.usersRepository.create({
      email: dto.email,
      password: hashed,
      firstName: dto.firstName,
      lastName: dto.lastName,
      role: dto.role as UserRole,
    });
    const saved = await this.usersRepository.save(user);
<<<<<<< HEAD

    // Si c'est un élève → créer le profil
    if (dto.role === "student" && dto.schoolClass) {
      const schoolClass = await this.classRepository.findOneBy({
        id: dto.schoolClass,
      });
      if (!schoolClass) throw new NotFoundException("Classe introuvable");

      const profile = this.studentProfileRepository.create({
        user: saved,
        class: schoolClass,
      });

      await this.studentProfileRepository.save(profile);
    }

    return saved;
  }

  // ── Modifier un utilisateur (par un admin) ────────────────────────────────
  // On vérifie que le nouvel email n'est pas déjà utilisé par quelqu'un d'autre

  async updateByAdmin(
    id: string,
    dto: {
      email?: string;
      firstName?: string;
      lastName?: string;
      role?: string;
      schoolClass?: string; // id de la classe
    },
  ): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ["studentProfile"],
    });
    if (!user) throw new NotFoundException("Utilisateur introuvable");

    // Email
    if (dto.email && dto.email !== user.email) {
      const existing = await this.usersRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) throw new ConflictException("Cet email est déjà utilisé");
      user.email = dto.email;
    }

    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;
    if (dto.role) user.role = dto.role as UserRole;

    const saved = await this.usersRepository.save(user);

    // Mise à jour du profil élève
    if (dto.schoolClass) {
      const schoolClass = await this.classRepository.findOneBy({
        id: dto.schoolClass,
      });
      if (!schoolClass) throw new NotFoundException("Classe introuvable");

      if (user.studentProfile) {
        user.studentProfile.class = schoolClass;
        await this.studentProfileRepository.save(user.studentProfile);
      } else {
        const profile = this.studentProfileRepository.create({
          user: saved,
          class: schoolClass,
        });
        await this.studentProfileRepository.save(profile);
      }
    }

    return saved;
  }

=======

    // Si c'est un élève avec une classe, on crée son profil élève
    if (dto.role === 'student') {
      const schoolClass = dto.classId
        ? await this.classesRepository.findOne({ where: { id: dto.classId } })
        : null;
      const profile = this.studentProfileRepository.create({ user: saved, schoolClass });
      await this.studentProfileRepository.save(profile);
    }

    return saved;
  }

  // ── Modifier un utilisateur (par un admin) ────────────────────────────────
  // On vérifie que le nouvel email n'est pas déjà utilisé par quelqu'un d'autre
  async updateByAdmin(
    id: string,
    dto: {
      email?: string;
      firstName?: string;
      lastName?: string;
      role?: string;
      classId?: string;
    },
  ): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ["studentProfile", "studentProfile.schoolClass", "staffProfile"],
    });
    if (!user) throw new NotFoundException("Utilisateur introuvable");

    // Si on change l'email, vérifier qu'il n'est pas déjà pris par un autre user
    if (dto.email && dto.email !== user.email) {
      const existing = await this.usersRepository.findOne({
        where: { email: dto.email },
      });
      if (existing) throw new ConflictException("Cet email est déjà utilisé");
      user.email = dto.email;
    }

    if (dto.firstName) user.firstName = dto.firstName;
    if (dto.lastName) user.lastName = dto.lastName;
    if (dto.role) user.role = dto.role as UserRole;

    const saved = await this.usersRepository.save(user);

    // Mettre à jour ou créer le profil élève si une classe est fournie
    if (dto.classId !== undefined) {
      const schoolClass = dto.classId
        ? await this.classesRepository.findOne({ where: { id: dto.classId } })
        : null;
      if (user.studentProfile) {
        user.studentProfile.schoolClass = schoolClass;
        await this.studentProfileRepository.save(user.studentProfile);
      } else {
        const profile = this.studentProfileRepository.create({ user: saved, schoolClass });
        await this.studentProfileRepository.save(profile);
      }
    }

    return saved;
  }

>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
  // ── Changer le mot de passe d'un utilisateur ──────────────────────────────
  // Accessible par l'admin (pour n'importe quel user)
  // Accessible par l'utilisateur lui-même (pour son propre compte)
  async changePassword(id: string, newPassword: string): Promise<void> {
    const user = await this.usersRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException("Utilisateur introuvable");

    // Vérifier que le mot de passe fait au moins 6 caractères
    if (newPassword.length < 6)
      throw new ForbiddenException(
        "Le mot de passe doit faire au moins 6 caractères",
      );

    const hashed = await bcrypt.hash(newPassword, 10);

    // On utilise une requête directe pour contourner le select: false sur password
    await this.usersRepository.query(
      `UPDATE users SET password = $1 WHERE id = $2`,
      [hashed, id],
    );
  }

  // ── Supprimer un utilisateur (par un admin) ───────────────────────────────
  // On supprime d'abord toutes les données liées pour éviter les erreurs de clé étrangère
  // On empêche un admin de supprimer son propre compte

  // async deleteByAdmin(id: string, currentUserId: string): Promise<void> {
  //   // Empêcher de supprimer son propre compte
  //   if (id === currentUserId) throw new ForbiddenException('Vous ne pouvez pas supprimer votre propre compte');

  //   const user = await this.usersRepository.findOne({ where: { id } });
  //   if (!user) throw new NotFoundException('Utilisateur introuvable');
  //   await this.usersRepository.remove(user);
  // }

  // Supprimer toutes les données liées avant de supprimer le user
  // await this.usersRepository.query(`DELETE FROM notifications WHERE "userId" = $1`, [id]);
  // await this.usersRepository.query(`DELETE FROM report_suspects WHERE "userId" = $1`, [id]);
  // await this.usersRepository.query(`DELETE FROM report_notes WHERE "authorId" = $1`, [id]);
  // await this.usersRepository.query(`DELETE FROM reports WHERE "studentId" = $1`, [id]);
  // await this.usersRepository.query(`DELETE FROM student_profiles WHERE "userId" = $1`, [id]);

  // async deleteByAdmin(id: string, currentUserId: string): Promise<void> {
  //   if (id === currentUserId)
  //     throw new ForbiddenException('Vous ne pouvez pas supprimer votre propre compte');

  //   const user = await this.usersRepository.findOne({ where: { id } });
  //   if (!user) throw new NotFoundException('Utilisateur introuvable');

  //   // ← ajouter cette vérification
  //   const hasReports = await this.reportRepository.count({
  //     where: [
  //       { student: { id } },
  //       { suspects: { user: { id } } },
  //     ]
  //   });

  //   if (hasReports > 0) {
  //     throw new BadRequestException('USER_HAS_REPORTS');
  //   }

<<<<<<< HEAD
  //   await this.usersRepository.remove(user);
  // }
=======
//   // ← ajouter cette vérification
//   const hasReports = await this.reportRepository.count({
//     where: [
//       { student: { id } },
//       { suspects: { resolvedUser: { id } } },
//     ]
//   });
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e

  async deleteByAdmin(id: string, currentUserId: string): Promise<void> {
    if (id === currentUserId)
      throw new ForbiddenException(
        "Vous ne pouvez pas supprimer votre propre compte",
      );

    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ["studentProfile"], // ← charger le profil
    });
    if (!user) throw new NotFoundException("Utilisateur introuvable");

    const hasReports = await this.reportRepository.count({
      where: [{ student: { id } }, { suspects: { user: { id } } }],
    });

    if (hasReports > 0) {
      throw new BadRequestException("USER_HAS_REPORTS");
    }

<<<<<<< HEAD
    // ← supprimer le profil élève avant l'utilisateur
    if (user.studentProfile) {
      await this.studentProfileRepository.remove(user.studentProfile);
    }
=======
  const hasReports = await this.reportRepository.count({
    where: [
      { student: { id } },
      { suspects: { resolvedUser: { id } } },
    ]
  });
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e

    await this.usersRepository.remove(user);
  }

  async canDelete(id: string): Promise<{ deletable: boolean }> {
    const hasReports = await this.reportRepository.count({
      where: [{ student: { id } }, { suspects: { user: { id } } }],
    });
    return { deletable: hasReports === 0 };
  }
}
<<<<<<< HEAD
=======


async canDelete(id: string): Promise<{ deletable: boolean }> {
  const hasReports = await this.reportRepository.count({
    where: [
      { student: { id } },
      { suspects: { resolvedUser: { id } } },
    ]
  });
  return { deletable: hasReports === 0 };
}








  async updateAvatar(id: string, filename: string): Promise<{ avatar: string }> {
    // Supprimer l'ancien fichier si il existe
    const user = await this.usersRepository.findOne({ where: { id } });
    if (user?.avatar && user.avatar !== filename) {
      const oldPath = require('path').join(process.cwd(), 'uploads', 'avatars', user.avatar);
      try { require('fs').unlinkSync(oldPath); } catch {}
    }
    await this.usersRepository.update(id, { avatar: filename });
    return { avatar: filename };
  }
}
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e

import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ 
      where: { email },
      select: ['id', 'email', 'password', 'role', 'firstName', 'lastName', 'createdAt'],
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
    return this.usersRepository.find();
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
}

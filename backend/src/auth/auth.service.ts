import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import * as bcrypt from "bcrypt";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmailWithProfile(email);
<<<<<<< HEAD
    console.log("USER FROM DB:", user); // ← très important
=======
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    if (!user)
      throw new UnauthorizedException("Email ou mot de passe incorrect");
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      throw new UnauthorizedException("Email ou mot de passe incorrect");
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        avatar: user.avatar || null,
        studentProfile: user.studentProfile || null,
      },
    };
  }

  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) {
    const existing = await this.usersService.findByEmail(email);
    if (existing) throw new UnauthorizedException("Cet email est déjà utilisé");
    const user = await this.usersService.create(
      email,
      password,
      firstName,
      lastName,
    );
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        studentProfile: null,
      },
    };
  }
}

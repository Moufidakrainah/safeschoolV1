import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { UsersService } from "../users/users.service";
import * as bcrypt from "bcrypt";
import { LoggerService } from "../logger/logger.service";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private logger: LoggerService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.usersService.findByEmailWithProfile(email);
    if (!user) {
      this.logger.auth({
        type: "auth_event",
        action: "login_failure",
        email,
        reason: "unknown_email",
      });
      throw new UnauthorizedException("Email ou mot de passe incorrect");
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      this.logger.auth({
        type: "auth_event",
        action: "login_failure",
        email,
        userId: user.id,
        reason: "bad_password",
      });
      throw new UnauthorizedException("Email ou mot de passe incorrect");
    }
    this.logger.auth({
      type: "auth_event",
      action: "login_success",
      email,
      userId: user.id,
      userRole: user.role,
    });
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
}

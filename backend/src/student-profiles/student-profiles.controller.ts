import {
  Controller, Get, Param,
  UseGuards, Request, ForbiddenException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { StudentProfilesService } from "./student-profiles.service";
import { validateUUID } from "../utils/validate-uuid";
import { Request as ExpressRequest } from 'express';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Controller("student-profiles")
@UseGuards(AuthGuard("jwt"))
export class StudentProfilesController {
  constructor(private readonly studentProfilesService: StudentProfilesService) {}

  @Get('parents/:userId')
  async getParents(@Param('userId') userId: string, @Request() req: ExpressRequest & { user: JwtUser }) {
    validateUUID(userId);
    if (req.user.role === 'student' && req.user.id !== userId)
      throw new ForbiddenException('Accès refusé');
    return this.studentProfilesService.getParents(userId);
  }
}
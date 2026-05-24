import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { StudentProfilesService } from "./student-profiles.service";
import { validateUUID } from "../utils/validate-uuid";

class CreateProfileDto {
  classId: string;
  dateOfBirth: string;
  userId: string;
}

class UpdateProfileDto {
  classId?: string;
  dateOfBirth?: string;
}

@Controller("student-profiles")
@UseGuards(AuthGuard("jwt"))
export class StudentProfilesController {
  constructor(
    private readonly studentProfilesService: StudentProfilesService,
  ) {}

  @Post()
  async create(@Body() dto: CreateProfileDto, @Request() req) {
<<<<<<< HEAD
    if (req.user.role !== "admin")
      throw new ForbiddenException("Accès réservé à l'admin");
    return this.studentProfilesService.create(
      dto.schoolClass,
      dto.dateOfBirth,
      dto.userId,
    );
=======
    if (req.user.role !== 'admin') throw new ForbiddenException('Accès réservé à l\'admin');
    return this.studentProfilesService.create(dto.classId, dto.dateOfBirth, dto.userId);
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
  }

  @Get()
  async findAll(@Request() req) {
    if (req.user.role !== "admin" && req.user.role !== "director")
      throw new ForbiddenException("Accès refusé");
    return this.studentProfilesService.findAll();
  }

<<<<<<< HEAD
  // Récupère le profil d'un élève avec ses parents
  // Accessible par l'admin, le directeur, ou l'élève lui-même
  @Get(":userId")
  async findOne(@Param("userId") userId: string, @Request() req) {
=======
  @Get(':userId')
  async findOne(@Param('userId') userId: string, @Request() req) {
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    validateUUID(userId);
    if (req.user.role === "student" && req.user.id !== userId)
      throw new ForbiddenException("Accès refusé");
    return this.studentProfilesService.findByUserId(userId);
  }

<<<<<<< HEAD
  // Récupère uniquement les parents d'un élève
  // Accessible par l'admin, le directeur, ou l'élève lui-même
  @Get("parents/:userId")
  async getParents(@Param("userId") userId: string, @Request() req) {
=======
  @Get('parents/:userId')
  async getParents(@Param('userId') userId: string, @Request() req) {
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    validateUUID(userId);
    if (req.user.role === "student" && req.user.id !== userId)
      throw new ForbiddenException("Accès refusé");
    return this.studentProfilesService.getParents(userId);
  }

  @Patch(":userId")
  async update(
    @Param("userId") userId: string,
    @Body() dto: UpdateProfileDto,
    @Request() req,
  ) {
    validateUUID(userId);
    if (req.user.role === "student" && req.user.id !== userId)
      throw new ForbiddenException("Accès refusé");
    return this.studentProfilesService.update(userId, dto);
  }
}

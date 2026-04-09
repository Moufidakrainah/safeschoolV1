import { Controller, Get, Post, Patch, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StudentProfilesService } from './student-profiles.service';
import { validateUUID } from '../utils/validate-uuid';

class CreateProfileDto {
  parentEmail: string;
  parentPhone: string;
  schoolClass: string;
  dateOfBirth: string;
  userId: string;
}

class UpdateProfileDto {
  parentEmail?: string;
  parentPhone?: string;
  schoolClass?: string;
  dateOfBirth?: string;
}

@Controller('student-profiles')
@UseGuards(AuthGuard('jwt'))
export class StudentProfilesController {
  constructor(private readonly studentProfilesService: StudentProfilesService) {}

  // POST /student-profiles — créer un profil
  @Post()
  async create(@Body() dto: CreateProfileDto, @Request() req) {
    if (req.user.role !== 'admin' && req.user.role !== 'director') {
      throw new ForbiddenException('Only admin can create a profile');
    }
    return this.studentProfilesService.create(
      dto.parentEmail,
      dto.parentPhone,
      dto.schoolClass,
      dto.dateOfBirth,
      dto.userId,
    );
  }

  // GET /student-profiles — voir tous les profils
  @Get()
  async findAll(@Request() req) {
    if (req.user.role !== 'admin' && req.user.role !== 'director') {
      throw new ForbiddenException('Access for admins only');
    }
    return this.studentProfilesService.findAll();
  }

  // GET /student-profiles/:userId — voir le profil d'un élève
  @Get(':userId')
  async findOne(@Param('userId') userId: string, @Request() req) {
    validateUUID(userId);
    if(req.user.role === 'student' && req.user.id !== userId) {
      throw new ForbiddenException('Acces denied ');
    }
    return this.studentProfilesService.findByUserId(userId);
  }

  // PATCH /student-profiles/:userId — modifier un profil
  @Patch(':userId')
  async update(
    @Param('userId') userId: string, 
    @Body() dto: UpdateProfileDto,
    @Request() req, 
  ) {
    validateUUID(userId);
    if (req.user.role === 'student' && req.user.id !== userId) {
      throw new ForbiddenException('You can not update the profile of someone else');
    }
    return this.studentProfilesService.update(userId, dto);
  }
}
import { Controller, Get, Post, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StudentProfilesService } from './student-profiles.service';

class CreateProfileDto {
  parentEmail: string;
  parentPhone: string;
  schoolClass: string;
  dateOfBirth: string;
  userId: number;
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
  async create(@Body() dto: CreateProfileDto) {
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
  async findAll() {
    return this.studentProfilesService.findAll();
  }

  // GET /student-profiles/:userId — voir le profil d'un élève
  @Get(':userId')
  async findOne(@Param('userId') userId: string) {
    return this.studentProfilesService.findByUserId(+userId);
  }

  // PATCH /student-profiles/:userId — modifier un profil
  @Patch(':userId')
  async update(@Param('userId') userId: string, @Body() dto: UpdateProfileDto) {
    return this.studentProfilesService.update(+userId, dto);
  }
}
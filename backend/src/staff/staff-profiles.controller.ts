import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StaffProfilesService } from './staff-profiles.service';
import { validateUUID } from '../utils/validate-uuid';

class CreateStaffProfileDto {
  userId: string;
  profession: string;
  subject?: string;
  classIds?: string[];
}

class UpdateStaffProfileDto {
  profession?: string;
  subject?: string;
  classIds?: string[];
}

@Controller('staff-profiles')
@UseGuards(AuthGuard('jwt'))
export class StaffProfilesController {
  constructor(private readonly staffProfilesService: StaffProfilesService) {}

  @Post()
  async create(@Body() dto: CreateStaffProfileDto, @Request() req) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Accès réservé à l\'admin');
    return this.staffProfilesService.create(dto);
  }

  @Get()
  async findAll(@Request() req) {
    if (req.user.role !== 'admin' && req.user.role !== 'director') throw new ForbiddenException('Accès refusé');
    return this.staffProfilesService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    validateUUID(id);
    return this.staffProfilesService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateStaffProfileDto, @Request() req) {
    validateUUID(id);
    if (req.user.role !== 'admin') throw new ForbiddenException('Accès réservé à l\'admin');
    return this.staffProfilesService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    validateUUID(id);
    if (req.user.role !== 'admin') throw new ForbiddenException('Accès réservé à l\'admin');
    return this.staffProfilesService.remove(id);
  }

  // GET /staff-profiles/by-user/:userId
// Récupère le profil staff d'un utilisateur par son userId
// Accessible à tous les connectés pour leur propre profil
@Get('by-user/:userId')
async findByUserId(@Param('userId') userId: string, @Request() req) {
  validateUUID(userId);
  if (req.user.role !== 'admin' && req.user.role !== 'director' && req.user.id !== userId) {
    throw new ForbiddenException('Accès refusé');
  }
  return this.staffProfilesService.findByUserId(userId);
}
}

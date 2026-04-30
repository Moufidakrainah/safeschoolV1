import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ParentsService } from './parents.service';
import { validateUUID } from '../utils/validate-uuid';

class CreateParentDto {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
  studentIds?: string[];
}

class UpdateParentDto {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  address?: string;
  studentIds?: string[];
}

@Controller('parents')
@UseGuards(AuthGuard('jwt'))
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post()
  async create(@Body() dto: CreateParentDto, @Request() req) {
    if (req.user.role !== 'admin') throw new ForbiddenException('Accès réservé à l\'admin');
    return this.parentsService.create(dto);
  }

  @Get()
  async findAll(@Request() req) {
    if (req.user.role !== 'admin' && req.user.role !== 'director') throw new ForbiddenException('Accès refusé');
    return this.parentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    validateUUID(id);
    if (req.user.role !== 'admin' && req.user.role !== 'director') throw new ForbiddenException('Accès refusé');
    return this.parentsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateParentDto, @Request() req) {
    validateUUID(id);
    if (req.user.role !== 'admin') throw new ForbiddenException('Accès réservé à l\'admin');
    return this.parentsService.update(id, dto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    validateUUID(id);
    if (req.user.role !== 'admin') throw new ForbiddenException('Accès réservé à l\'admin');
    return this.parentsService.remove(id);
  }
}

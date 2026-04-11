import { Controller, Get, Post, Patch, Param, Body, Request, UseGuards, ForbiddenException, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';
import { ReportGrade, ReportStatus } from './report.entity';
import { validateUUID } from '../utils/validate-uuid';

class CreateReportDto {
  title: string;
  description: string;
  isAnonymous: boolean;
  suspects?: { userId?: string; freeText?: string }[];
  frequency?: string;
  schoolClass?: string;
}

class UpdateReportDto {
  status?: ReportStatus;
  grade?: ReportGrade;
  adminNote?: string;
  gradeModificationReason?: string;
}

@Controller('reports')
@UseGuards(AuthGuard('jwt'))  // Toutes les routes necessitent un token JWT valide
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  // POST /reports — Eleve cree un signalement
  @Post()
  async create(@Body() dto: CreateReportDto, @Request() req) {
    const allowedRoles = ['student', 'teacher', 'staff'];
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException('Only student, teacher and staff can create a report');
    }
    return this.reportsService.create(
      dto.title,
      dto.description,
      dto.isAnonymous,
      req.user,  // req.user = utilisateur injecte par JwtStrategy
      dto.suspects || [],
      dto.frequency || '',
      dto.schoolClass || '',
    );
  }

  // GET /reports — Admin/Directeur voit tous les signalements
  @Get()
  async findAll(@Request() req) {
    if (req.user.role === 'student') {
      return this.reportsService.findByStudent(req.user.id);
    }
    return this.reportsService.findAll();
  }

  // GET /reports/:id — Voir un signalement
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    validateUUID(id);
    const report = await this.reportsService.findOne(id);
    
    // Un élève ne peut voir QUE ses propres signalements
    if (req.user.role === 'student' && report.student.id !== req.user.id) {
      throw new ForbiddenException('Access denied');
    }
    
    return report;
  }

  
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateReportDto, @Request() req) {
    validateUUID(id);
    // Seuls admin et director peuvent modifier
    if (req.user.role === 'student') {
      throw new ForbiddenException('Access denied');
    }
    return this.reportsService.update(id, dto);
  }

  @Patch(':id/escalate')
  async escalate(@Param('id') id: string, @Request() req) {
    // Seul admin peut escalader — pas le directeur !
    if (req.user.role !== 'admin') {
      throw new ForbiddenException('Access denied');
    }
    return this.reportsService.escalate(id);
  }
}

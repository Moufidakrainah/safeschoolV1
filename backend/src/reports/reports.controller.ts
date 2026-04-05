import { Controller, Get, Post, Patch, Param, Body, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';
import { ReportGrade, ReportStatus } from './report.entity';

class CreateReportDto {
  title: string;
  description: string;
  isAnonymous: boolean;
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
    return this.reportsService.create(
      dto.title,
      dto.description,
      dto.isAnonymous,
      req.user,  // req.user = utilisateur injecte par JwtStrategy
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
  async findOne(@Param('id') id: string) {
    return this.reportsService.findOne(+id);
  }

  // PATCH /reports/:id — Admin modifie un signalement
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateReportDto) {
    return this.reportsService.update(+id, dto);
  }

  // PATCH /reports/:id/escalate — Escalader vers le directeur
  @Patch(':id/escalate')
  async escalate(@Param('id') id: string) {
    return this.reportsService.escalate(+id);
  }
}

import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Request,
  UseGuards,
  ForbiddenException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ReportsService } from "./reports.service";
import { ReportGrade, ReportStatus } from "./report.entity";
import { validateUUID } from "../utils/validate-uuid";

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

@Controller("reports")
@UseGuards(AuthGuard("jwt"))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async create(@Body() dto: CreateReportDto, @Request() req) {
    const allowedRoles = ["student", "teacher", "staff"];
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException(
        "Only student, teacher and staff can create a report",
      );
    }
    return this.reportsService.create(
      dto.title,
      dto.description,
      dto.isAnonymous,
      req.user,
      dto.suspects || [],
      dto.frequency || "",
      dto.schoolClass || "",
    );
  }

  @Get()
  async findAll(@Request() req) {
    if (req.user.role === "student") {
      return this.reportsService.findByStudent(req.user.id);
    }
    return this.reportsService.findAll();
  }

  // Utile ?
  //   @Get(':id')
  //   async findOne(@Param('id') id: string, @Request() req) {
  //     validateUUID(id);
  //     const report = await this.reportsService.findOne(id);
  //     if (req.user.role === 'student' && report.student.id !== req.user.id) {
  //       throw new ForbiddenException('Access denied');
  //     }
  //     return report;
  //   }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateReportDto,
    @Request() req,
  ) {
    validateUUID(id);
    if (req.user.role === "student")
      throw new ForbiddenException("Access denied");
    return this.reportsService.update(id, dto);
  }

  //   @Patch(':id/escalate')
  //   async escalate(@Param('id') id: string, @Request() req) {
  //     if (req.user.role !== 'admin') throw new ForbiddenException('Access denied');
  //     return this.reportsService.escalate(id);
  //   }

  @Get(":id/notes")
  async getNotes(@Param("id") id: string, @Request() req) {
    validateUUID(id);
    if (req.user.role === "student") {
      const report = await this.reportsService.findOne(id);
      if (report.student.id !== req.user.id)
        throw new ForbiddenException("Access denied");
      const notes = await this.reportsService.getNotes(id);
      return notes.filter((n: any) => n.type === "convocation");
    }
    return this.reportsService.getNotes(id);
  }

  @Post(":id/notes")
  async addNote(
    @Param("id") id: string,
    @Body() dto: { content: string; type: string; targetRole?: string },
    @Request() req,
  ) {
    validateUUID(id);
    if (req.user.role === "student")
      throw new ForbiddenException("Access denied");
    return this.reportsService.addNote(
      id,
      dto.content,
      dto.type || "note",
      req.user,
      dto.targetRole,
    );
  }
}

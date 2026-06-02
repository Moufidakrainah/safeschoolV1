import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  Request,
  UseGuards,
  ForbiddenException,
  BadRequestException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ReportsService } from "./reports.service";
import { ReportGrade, ReportStatus } from "./report.entity";
import { validateUUID } from "../utils/validate-uuid";

class CreateReportDto {
  type: string;
  reporter: string;
  description: string;
  isAnonymous: boolean;
  suspects?: { freeText: string }[];
  victims?: { freeText: string }[];
  frequency?: string;
}

class UpdateReportDto {
  status?: ReportStatus;
  grade?: ReportGrade;
}

@Controller("reports")
@UseGuards(AuthGuard("jwt"))
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  async create(@Body() dto: CreateReportDto, @Request() req) {
    const allowedRoles = ["student", "teacher"];
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException("Only student, teacher and staff can create a report");
    }
    return this.reportsService.create(
      dto.type,
      dto.reporter,
      dto.description,
      dto.isAnonymous,
      req.user,
      dto.suspects || [],
      dto.victims || [],
      dto.frequency || "",
    );
  }

  @Get()
  async findAll(@Request() req) {
    if (req.user.role === "student") {
      return this.reportsService.findByStudent(req.user.id);
    }
    return this.reportsService.findAll();
  }

  @Get("victims/search")
  async searchByVictim(@Query("name") name: string, @Request() req) {
    if (req.user.role !== "admin" && req.user.role !== "director") {
      throw new ForbiddenException("Access denied");
    }
    if (!name || name.trim().length < 2) return [];
    return this.reportsService.findByVictimName(name.trim());
  }

  @Get("victims/stats")
  async victimStats(@Request() req) {
    if (req.user.role !== "admin" && req.user.role !== "director") {
      throw new ForbiddenException("Access denied");
    }
    return this.reportsService.countByVictim();
  }

  @Patch("suspects/:suspectId/resolve")
  async resolveSuspect(
    @Param("suspectId") suspectId: string,
    @Body() dto: { resolvedUserId: string | null },
    @Request() req,
  ) {
    if (req.user.role !== "admin") throw new ForbiddenException("Access denied");
    return this.reportsService.resolveSuspect(suspectId, dto.resolvedUserId);
  }

  @Patch("victims/:victimId/resolve")
  async resolveVictim(
    @Param("victimId") victimId: string,
    @Body() dto: { resolvedUserId: string | null },
    @Request() req,
  ) {
    if (req.user.role !== "admin") throw new ForbiddenException("Access denied");
    return this.reportsService.resolveVictim(victimId, dto.resolvedUserId);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Request() req) {
    validateUUID(id);
    const report = await this.reportsService.findOne(id);
    if (req.user.role === "student" && report.student.id !== req.user.id) {
      throw new ForbiddenException("Access denied");
    }
    return report;
  }

  @Patch(":id")
  async update(@Param("id") id: string, @Body() dto: UpdateReportDto, @Request() req) {
    validateUUID(id);
    if (req.user.role === "student") throw new ForbiddenException("Access denied");
    return this.reportsService.update(id, dto);
  }

  @Get(":id/notes")
  async getNotes(@Param("id") id: string, @Request() req) {
    validateUUID(id);
    if (req.user.role === "student") {
      const report = await this.reportsService.findOne(id);
      if (report.student.id !== req.user.id) throw new ForbiddenException("Access denied");
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
    if (dto.content && dto.content.length > 1500) throw new BadRequestException("Le contenu ne peut pas dépasser 1500 caractères");
    if (req.user.role === "student") throw new ForbiddenException("Access denied");
    return this.reportsService.addNote(id, dto.content, dto.type || "note", req.user, dto.targetRole);
  }
}
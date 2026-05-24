import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
<<<<<<< HEAD
=======
  Query,
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
  Request,
  UseGuards,
  ForbiddenException,
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
<<<<<<< HEAD
    const allowedRoles = ["student", "teacher", "staff"];
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException(
        "Only student, teacher and staff can create a report",
      );
=======
    const allowedRoles = ["student", "teacher"];
    if (!allowedRoles.includes(req.user.role)) {
      throw new ForbiddenException("Only student, teacher and staff can create a report");
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    }
    return this.reportsService.create(
      dto.type,
      dto.reporter,
      dto.description,
      dto.isAnonymous,
      req.user,
      dto.suspects || [],
<<<<<<< HEAD
      dto.frequency || "",
      dto.schoolClass || "",
=======
      dto.victims || [],
      dto.frequency || "",
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
    );
  }

  @Get()
  async findAll(@Request() req) {
    if (req.user.role === "student") {
      return this.reportsService.findByStudent(req.user.id);
    }
    return this.reportsService.findAll();
  }

<<<<<<< HEAD
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

=======
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

>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
  @Get(":id/notes")
  async getNotes(@Param("id") id: string, @Request() req) {
    validateUUID(id);
    if (req.user.role === "student") {
      const report = await this.reportsService.findOne(id);
<<<<<<< HEAD
      if (report.student.id !== req.user.id)
        throw new ForbiddenException("Access denied");
=======
      if (report.student.id !== req.user.id) throw new ForbiddenException("Access denied");
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
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
<<<<<<< HEAD
    if (req.user.role === "student")
      throw new ForbiddenException("Access denied");
    return this.reportsService.addNote(
      id,
      dto.content,
      dto.type || "note",
      req.user,
      dto.targetRole,
    );
=======
    if (req.user.role === "student") throw new ForbiddenException("Access denied");
    return this.reportsService.addNote(id, dto.content, dto.type || "note", req.user, dto.targetRole);
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
  }
}
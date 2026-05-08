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
  schoolClass: string;
  dateOfBirth: string;
  userId: string;
}

class UpdateProfileDto {
  schoolClass?: string;
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
    if (req.user.role !== "admin" && req.user.role !== "director")
      throw new ForbiddenException("Only admin can create a profile");
    return this.studentProfilesService.create(
      dto.schoolClass,
      dto.dateOfBirth,
      dto.userId,
    );
  }

  @Get()
  async findAll(@Request() req) {
    if (req.user.role !== "admin" && req.user.role !== "director")
      throw new ForbiddenException("Access for admins only");
    return this.studentProfilesService.findAll();
  }

  @Get(":userId")
  async findOne(@Param("userId") userId: string, @Request() req) {
    validateUUID(userId);
    if (req.user.role === "student" && req.user.id !== userId)
      throw new ForbiddenException("Access denied");
    return this.studentProfilesService.findByUserId(userId);
  }

  @Patch(":userId")
  async update(
    @Param("userId") userId: string,
    @Body() dto: UpdateProfileDto,
    @Request() req,
  ) {
    validateUUID(userId);
    if (req.user.role === "student" && req.user.id !== userId)
      throw new ForbiddenException("Access denied");
    return this.studentProfilesService.update(userId, dto);
  }
}

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
import { StaffProfilesService } from "./staff-profiles.service";
import { CreateStaffProfileDto } from "./dto/create-staff-profile.dto";
import { UpdateStaffProfileDto } from "./dto/update-staff-profile.dto";
import { validateUUID } from "../utils/validate-uuid";
import { Request as ExpressRequest } from 'express';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Controller("staff-profiles")
@UseGuards(AuthGuard("jwt"))
export class StaffProfilesController {
  constructor(private readonly staffProfilesService: StaffProfilesService) {}

  @Post()
  async create(@Body() dto: CreateStaffProfileDto, @Request() req: ExpressRequest & { user: JwtUser }) {
    if (req.user.role !== "admin")
      throw new ForbiddenException("Accès réservé à l'admin");
    return this.staffProfilesService.create(dto);
  }

  @Get("by-user/:userId")
  async findByUserId(@Param("userId") userId: string, @Request() req: ExpressRequest & { user: JwtUser }) {
    validateUUID(userId);
    if (req.user.role !== "admin" && req.user.id !== userId)
      throw new ForbiddenException("Accès refusé");
    return this.staffProfilesService.findByUserId(userId);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateStaffProfileDto,
    @Request() req: ExpressRequest & { user: JwtUser },
  ) {
    validateUUID(id);
    if (req.user.role !== "admin")
      throw new ForbiddenException("Accès réservé à l'admin");
    return this.staffProfilesService.update(id, dto);
  }
}
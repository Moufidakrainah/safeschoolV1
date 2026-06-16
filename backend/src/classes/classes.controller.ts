import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, Request, ForbiddenException } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ClassesService } from "./classes.service";
import { CreateClassDto } from "./dto/create-class.dto";
import { UpdateClassDto } from "./dto/update-class.dto";
import { validateUUID } from "../utils/validate-uuid";
import { Request as ExpressRequest } from 'express';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Controller("classes")
@UseGuards(AuthGuard("jwt"))
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  async create(@Body() dto: CreateClassDto, @Request() req: ExpressRequest & { user: JwtUser }) {
    if (req.user.role !== "admin")
      throw new ForbiddenException("Accès réservé à l'admin");
    return this.classesService.create(dto.level, dto.section);
  }

  @Get()
  async findAll() {
    return this.classesService.findAll();
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateClassDto,
    @Request() req: ExpressRequest & { user: JwtUser },
  ) {
    validateUUID(id);
    if (req.user.role !== "admin")
      throw new ForbiddenException("Accès réservé à l'admin");
    return this.classesService.update(id, dto);
  }

  @Delete(":id")
  async remove(@Param("id") id: string, @Request() req: ExpressRequest & { user: JwtUser }) {
    validateUUID(id);
    if (req.user.role !== "admin")
      throw new ForbiddenException("Accès réservé à l'admin");
    return this.classesService.remove(id);
  }
}
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { ParentsService } from "./parents.service";
import { CreateParentDto } from "./dto/create-parent.dto";
import { UpdateParentDto } from "./dto/update-parent.dto";
import { validateUUID } from "../utils/validate-uuid";
import { Request as ExpressRequest } from "express";
import { JwtUser } from "../common/interfaces/jwt-user.interface";

@Controller("parents")
@UseGuards(AuthGuard("jwt"))
export class ParentsController {
  constructor(private readonly parentsService: ParentsService) {}

  @Post()
  async create(
    @Body() dto: CreateParentDto,
    @Request() req: ExpressRequest & { user: JwtUser },
  ) {
    if (req.user.role !== "admin")
      throw new ForbiddenException("Accès réservé à l'admin");
    return this.parentsService.create(dto);
  }

  @Patch(":id")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateParentDto,
    @Request() req: ExpressRequest & { user: JwtUser },
  ) {
    validateUUID(id);
    if (req.user.role !== "admin")
      throw new ForbiddenException("Accès réservé à l'admin");
    return this.parentsService.update(id, dto);
  }

  @Delete(":id")
  async remove(
    @Param("id") id: string,
    @Request() req: ExpressRequest & { user: JwtUser },
  ) {
    validateUUID(id);
    if (req.user.role !== "admin")
      throw new ForbiddenException("Accès réservé à l'admin");
    return this.parentsService.remove(id);
  }
}

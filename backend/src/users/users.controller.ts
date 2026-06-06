
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import * as path from "path";
import * as fs from "fs";
import { AuthGuard } from "@nestjs/passport";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";
import { validateUUID } from "../utils/validate-uuid";

@Controller("users")
@UseGuards(AuthGuard("jwt"))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("search")
  async search(@Query("q") q: string) {
    if (!q || q.length < 2) return [];
    return this.usersService.search(q);
  }

  @Get()
  async findAll(
    @Request() req,
    @Query("role") role?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string,
  ) {
    if (req.user.role !== "admin" && req.user.role !== "director") {
      throw new ForbiddenException("Accès refusé");
    }
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    return this.usersService.findAll(role, pageNum, limitNum);
  }

  @Get(":id")
  async findOne(@Param("id") id: string, @Request() req) {
    validateUUID(id);
    if (req.user.role !== "admin" && req.user.role !== "director" && req.user.id !== id) {
      throw new ForbiddenException("Accès refusé");
    }
    return this.usersService.findById(id);
  }

  @Post()
  async createUser(@Request() req, @Body() dto: CreateUserDto) {
    if (req.user.role !== "admin") {
      throw new ForbiddenException("Seul l'admin peut créer des utilisateurs");
    }
    return this.usersService.createByAdmin(dto);
  }

  @Patch(":id")
  async updateUser(@Request() req, @Param("id") id: string, @Body() dto: UpdateUserDto) {
    validateUUID(id);
    if (req.user.role !== "admin") {
      throw new ForbiddenException("Seul l'admin peut modifier des utilisateurs");
    }
    return this.usersService.updateByAdmin(id, dto);
  }

  @Patch(":id/password")
  async changePassword(@Request() req, @Param("id") id: string, @Body() dto: { password: string }) {
    validateUUID(id);
    if (req.user.role !== "admin" && req.user.id !== id) {
      throw new ForbiddenException("Accès refusé");
    }
    return this.usersService.changePassword(id, dto.password);
  }

  @Get(':id/can-delete')
  async canDelete(@Request() req, @Param('id') id: string) {
    validateUUID(id);
    if (req.user.role !== 'admin') throw new ForbiddenException();
    return this.usersService.canDelete(id);
  }

  @Delete(":id")
  async deleteUser(@Request() req, @Param("id") id: string) {
    validateUUID(id);
    if (req.user.role !== "admin") {
      throw new ForbiddenException("Seul l'admin peut supprimer des utilisateurs");
    }
    return this.usersService.deleteByAdmin(id, req.user.id);
  }

  @Post(':id/avatar')
  @UseInterceptors(FileInterceptor('avatar', {
    storage: diskStorage({
      destination: './uploads/avatars',
      filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
        cb(null, `${req.params.id}${ext}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
        return cb(new BadRequestException('Seules les images jpg/png/webp sont acceptées'), false);
      }
      cb(null, true);
    },
    limits: { fileSize: 2 * 1024 * 1024 },
  }))
  async uploadAvatar(@Param('id') id: string, @UploadedFile() file: any, @Request() req) {
    validateUUID(id);
    if (req.user.role !== 'admin' && req.user.id !== id) {
      throw new ForbiddenException('Accès refusé');
    }
    if (!file) throw new BadRequestException('Aucun fichier envoyé');
    const user = await this.usersService.findById(id);
    const ext = path.extname(file.filename);
    let newFilename = file.filename;
    if (user) {
      const nom = user.lastName.toLowerCase().replace(/\s+/g, '-');
      const prenom = user.firstName.toLowerCase().replace(/\s+/g, '-');
      newFilename = `${nom}.${prenom}${ext}`;
      const oldPath = path.join(process.cwd(), 'uploads', 'avatars', file.filename);
      const newPath = path.join(process.cwd(), 'uploads', 'avatars', newFilename);
      fs.renameSync(oldPath, newPath);
    }
    return this.usersService.updateAvatar(id, newFilename);
  }
}
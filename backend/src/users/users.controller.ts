import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(AuthGuard('jwt'))
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('search')
  async search(@Query('q') q: string) {
    if (!q || q.length < 2) return [];
    return this.usersService.search(q);
  }

  @Get()
  async findAll(@Request() req) {
    if (req.user.role !== 'admin' && req.user.role !== 'director') throw new ForbiddenException('Accès refusé');
    return this.usersService.findAll();
  }

  @Post()
  async createUser(@Request() req, @Body() dto: { email: string; password: string; firstName: string; lastName: string; role: string; schoolClass?: string }) {
    if (req.user.role !== 'admin' && req.user.role !== 'director') throw new ForbiddenException('Accès refusé');
    return this.usersService.createByAdmin(dto);
  }

  @Patch(':id')
  async updateUser(@Request() req, @Param('id') id: string, @Body() dto: { email?: string; firstName?: string; lastName?: string; role?: string; schoolClass?: string }) {
    if (req.user.role !== 'admin' && req.user.role !== 'director') throw new ForbiddenException('Accès refusé');
    return this.usersService.updateByAdmin(id, dto);
  }

  @Delete(':id')
  async deleteUser(@Request() req, @Param('id') id: string) {
    if (req.user.role !== 'admin' && req.user.role !== 'director') throw new ForbiddenException('Accès refusé');
    return this.usersService.deleteByAdmin(id);
  }
}

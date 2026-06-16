import { Controller, Get, Patch, Param, Request, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { NotificationsService } from "./notifications.service";
import { Request as ExpressRequest } from 'express';
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@UseGuards(AuthGuard("jwt"))
@Controller("notifications")
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getMyNotifications(@Request() req: ExpressRequest & { user: JwtUser }) {
    return this.notificationsService.getForUser(req.user.id);
  }

  @Get("unread-count")
  async getUnreadCount(@Request() req: ExpressRequest & { user: JwtUser }) {
    return { count: await this.notificationsService.countUnread(req.user.id) };
  }

  @Patch(":id/read")
  async markAsRead(@Param("id") id: string) {
    await this.notificationsService.markAsRead(id);
    return { success: true };
  }
}

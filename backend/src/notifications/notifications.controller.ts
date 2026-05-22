import {
  Controller,
  Get,
  Patch,
  Param,
  Request,
  UseGuards,
} from "@nestjs/common";
import { NotificationsService } from "./notifications.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@UseGuards(JwtAuthGuard)
@Controller("notifications")
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getMyNotifications(@Request() req) {
    return this.notificationsService.getForUser(req.user.id);
  }

  @Get("unread-count")
  async getUnreadCount(@Request() req) {
    return { count: await this.notificationsService.countUnread(req.user.id) };
  }

  @Patch(":id/read")
  async markAsRead(@Param("id") id: string) {
    await this.notificationsService.markAsRead(id);
    return { success: true };
  }
}

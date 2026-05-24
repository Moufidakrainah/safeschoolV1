import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Notification } from "./notification.entity";

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async create(
    userId: string,
    reportId: string,
    message: string,
  ): Promise<Notification> {
    const notification = this.notificationsRepository.create({
      user: { id: userId },
      report: { id: reportId },
      message,
    });
    return this.notificationsRepository.save(notification);
  }

  async getForUser(userId: string): Promise<Notification[]> {
    return this.notificationsRepository
      .createQueryBuilder("notification")
      .leftJoinAndSelect("notification.report", "report")
      .where('notification."userId" = :userId', { userId })
      .orderBy('notification."createdAt"', "DESC")
      .getMany();
  }

  async countUnread(userId: string): Promise<number> {
    return this.notificationsRepository
      .createQueryBuilder("notification")
      .where('notification."userId" = :userId', { userId })
      .andWhere('notification."isRead" = false')
      .getCount();
  }

  async markAsRead(id: string): Promise<void> {
    await this.notificationsRepository.update(id, { isRead: true });
  }
}

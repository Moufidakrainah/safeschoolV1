import { Injectable, NestMiddleware } from "@nestjs/common";
import { Request, Response, NextFunction } from "express";
import { LoggerService } from "./logger.service";
import { JwtUser } from '../common/interfaces/jwt-user.interface';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const start = Date.now();
    res.on("finish", () => {
      const user = (req as Request & { user?: JwtUser }).user;
      this.logger.http({
        type: "http_request",
        method,
        url: originalUrl,
        statusCode: res.statusCode,
        responseTime: `${Date.now() - start}ms`,
        userId: user?.id || "anonymous",
        userRole: user?.role || "anonymous",
        ip: ip || "unknown",
      });
    });
    next();
  }
}

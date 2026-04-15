// =============================================================
// http-logger.middleware.ts — Middleware de logging HTTP
//
// Intercepte TOUTES les requêtes HTTP reçues par NestJS et
// envoie un log structuré après que la réponse est envoyée.
//
// Ce que chaque log contient :
//   - méthode HTTP (GET, POST, PATCH...)
//   - URL appelée (/reports, /auth/login...)
//   - code de statut (200, 201, 401, 404...)
//   - temps de réponse en millisecondes
//   - ID et rôle de l'utilisateur connecté (si disponible)
//   - adresse IP du client
// =============================================================

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { LoggerService } from './logger.service';

@Injectable()
export class HttpLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: LoggerService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const { method, originalUrl, ip } = req;
    const start = Date.now();

    // On écoute l'événement "finish" qui se déclenche quand la réponse est envoyée
    res.on('finish', () => {
      const responseTime = Date.now() - start;
      const { statusCode } = res;

      // req.user est injecté par Passport (JwtStrategy) après validation du token
      const user = (req as any).user;

      this.logger.http({
        type: 'http_request',
        method,
        url: originalUrl,
        statusCode,
        responseTime: `${responseTime}ms`,
        userId: user?.id || 'anonymous',
        userRole: user?.role || 'anonymous',
        ip: ip || 'unknown',
      });
    });

    next();
  }
}

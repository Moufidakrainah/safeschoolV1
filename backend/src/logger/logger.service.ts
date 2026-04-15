// =============================================================
// logger.service.ts — Service de logging centralisé
//
// Remplace les console.log() dispersés dans le code par un système
// structuré qui envoie les logs vers Logstash (et donc Elasticsearch/Kibana).
//
// Utilisation dans n'importe quel service :
//   constructor(private logger: LoggerService) {}
//   this.logger.log('message simple')
//   this.logger.http({ type: 'http_request', method: 'POST', ... })
//   this.logger.auth({ type: 'auth_event', action: 'login_success', ... })
//   this.logger.report({ type: 'report_event', action: 'created', ... })
//   this.logger.error('message erreur', stack)
// =============================================================

import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { LogstashTransport } from './logstash.transport';

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    const transports: winston.transport[] = [
      // ── Transport 1 : Console ─────────────────────────────
      // Affiche les logs dans le terminal Docker (couleurs pour la lisibilité)
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: 'HH:mm:ss' }),
          winston.format.printf(({ timestamp, level, message, type }) => {
            const tag = type ? `[${type}] ` : '';
            return `${timestamp} ${level}: ${tag}${message}`;
          }),
        ),
      }),
    ];

    // ── Transport 2 : Logstash (si activé dans .env) ──────────
    // Envoie les logs structurés en JSON vers Logstash via TCP
    const logstashHost = process.env.LOGSTASH_HOST;
    const logstashPort = parseInt(process.env.LOGSTASH_PORT || '5044', 10);

    if (logstashHost) {
      transports.push(
        new LogstashTransport({
          host: logstashHost,
          port: logstashPort,
        }),
      );
      console.log(`[Logger] Logstash activé → ${logstashHost}:${logstashPort}`);
    } else {
      console.log('[Logger] Logstash désactivé (LOGSTASH_HOST non défini) — logs console uniquement');
    }

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports,
    });
  }

  // ── Méthodes standard NestJS ──────────────────────────────

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }

  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context, type: 'error' });
  }

  warn(message: string, context?: string): void {
    this.logger.warn(message, { context });
  }

  debug(message: string, context?: string): void {
    this.logger.debug(message, { context });
  }

  verbose(message: string, context?: string): void {
    this.logger.verbose(message, { context });
  }

  // ── Méthodes spécialisées SafeSchool ─────────────────────
  // Ces méthodes envoient des logs structurés avec des champs métier
  // qui seront indexés dans Elasticsearch et visualisables dans Kibana

  // Log d'une requête HTTP
  // Appelé par HttpLoggerMiddleware pour chaque requête reçue
  http(data: {
    type: 'http_request';
    method: string;
    url: string;
    statusCode: number;
    responseTime: string;
    userId?: string;
    userRole?: string;
    ip?: string;
  }): void {
    this.logger.info(
      `${data.method} ${data.url} → ${data.statusCode} (${data.responseTime})`,
      data,
    );
  }

  // Log d'un événement d'authentification
  // Appelé dans auth.service.ts
  auth(data: {
    type: 'auth_event';
    action: 'login_success' | 'login_failure' | 'register';
    email: string;
    userId?: string;
    userRole?: string;
    reason?: string;
  }): void {
    const level = data.action === 'login_failure' ? 'warn' : 'info';
    this.logger.log(level, `[Auth] ${data.action} — ${data.email}`, data);
  }

  // Log d'un événement lié aux signalements
  // Appelé dans reports.service.ts
  report(data: {
    type: 'report_event';
    action: 'created' | 'updated' | 'note_added' | 'convocation_sent';
    reportId?: string;
    caseNumber?: string;
    grade?: string;
    score?: number;
    status?: string;
    userId?: string;
    userRole?: string;
  }): void {
    this.logger.info(`[Report] ${data.action} — ${data.caseNumber || data.reportId}`, data);
  }

  // Log du scoring IA
  // Appelé dans scoring.service.ts
  scoring(data: {
    type: 'scoring_event';
    reportId?: string;
    typeScore: number;
    frequencyScore: number;
    classScore: number;
    recidiveScore: number;
    suspectRoleScore: number;
    aiScore: number;
    finalScore: number;
    grade: string;
    aiReason?: string;
    urgency?: boolean;
  }): void {
    this.logger.info(
      `[Scoring] Score: ${data.finalScore}/100 → ${data.grade} | IA: ${data.aiScore}pts | urgence: ${data.urgency}`,
      data,
    );
  }
}

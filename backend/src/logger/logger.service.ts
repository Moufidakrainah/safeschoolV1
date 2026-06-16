import { Injectable, LoggerService as NestLoggerService } from "@nestjs/common";
import * as winston from "winston";
import { LogstashTransport } from "./logstash.transport";

@Injectable()
export class LoggerService implements NestLoggerService {
  private readonly logger: winston.Logger;

  constructor() {
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: "HH:mm:ss" }),
          winston.format.printf(({ timestamp, level, message, type }) => {
            const tag = type ? `[${type as string}] ` : "";
            return `${String(timestamp)} ${level}: ${tag}${String(message)}`;
          }),
        ),
      }),
    ];

    const logstashHost = process.env.LOGSTASH_HOST;
    const logstashPort = parseInt(process.env.LOGSTASH_PORT || "5044", 10);

    if (logstashHost) {
      transports.push(
        new LogstashTransport({ host: logstashHost, port: logstashPort }),
      );
      console.log(`[Logger] Logstash activé → ${logstashHost}:${logstashPort}`);
    } else {
      console.log("[Logger] Logstash désactivé — logs console uniquement");
    }

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
      ),
      transports,
    });
  }

  log(message: string, context?: string): void {
    this.logger.info(message, { context });
  }
  error(message: string, trace?: string, context?: string): void {
    this.logger.error(message, { trace, context, type: "error" });
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

  http(data: {
    type: "http_request";
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

  auth(data: {
    type: "auth_event";
    action: "login_success" | "login_failure" ;
    email: string;
    userId?: string;
    userRole?: string;
    reason?: string;
  }): void {
    const level = data.action === "login_failure" ? "warn" : "info";
    this.logger.log(level, `[Auth] ${data.action} — ${data.email}`, data);
  }

  report(data: {
    type: "report_event";
    action: "created" | "updated" | "note_added" | "convocation_sent";
    reportId?: string;
    caseNumber?: string;
    grade?: string;
    score?: number;
    status?: string;
    userId?: string;
    userRole?: string;
  }): void {
    this.logger.info(
      `[Report] ${data.action} — ${data.caseNumber || data.reportId}`,
      data,
    );
  }

  scoring(data: {
    type: "scoring_event";
    reportId?: string;
    typeScore: number;
    frequencyScore: number;
    classScore: number;
    recidiveScore: number;
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

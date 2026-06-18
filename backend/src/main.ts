import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { join } from "path";
import { ValidationPipe } from "@nestjs/common";
import helmet from "helmet";
import { LoggerService } from "./logger/logger.service";

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useLogger(app.get(LoggerService));
// Sécurité : HSTS désactivé pour éviter de bloquer localhost en HTTP (make dev).
// CORP configuré en "cross-origin" pour permettre au frontend (5173) de charger les avatars du backend (5000).
  app.use(
    helmet({
      hsts: false,
      crossOriginResourcePolicy: { policy: "cross-origin" },
    }),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // supprime les champs non définis dans le DTO
      forbidNonWhitelisted: true, // erreur si champs inconnus envoyés
      transform: true, // active les transformations (@Transform)
    }),
  );
  // Origines autorisées par le CORS. En prod (nginx, même origine) le CORS
  // n'est pas sollicité ; cette liste sert au mode dev (5173 -> 5000).
  app.enableCors({
    origin: (process.env.FRONTEND_URL ?? "http://localhost:5173")
      .split(",")
      .map((o) => o.trim()),
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  // Servir les fichiers uploadés statiquement
  app.useStaticAssets(join(__dirname, "..", "uploads"), {
    prefix: "/uploads",
  });
  await app.listen(process.env.BACKEND_PORT ?? 3000);
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});

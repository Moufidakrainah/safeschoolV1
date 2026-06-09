import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { join } from "path";
import { ValidationPipe } from '@nestjs/common';
import helmet from "helmet";

async function bootstrap() {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET manquant dans les variables d'environnement");
  }
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  // En-têtes de sécurité HTTP (HSTS, X-Frame-Options, etc.).
  // crossOriginResourcePolicy en "cross-origin" : sinon les avatars servis
  // par le backend seraient bloqués quand le frontend de dev (port 5173)
  // les charge depuis une autre origine (port 5000).
  app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }));
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,             // supprime les champs non définis dans le DTO
    forbidNonWhitelisted: true,  // erreur si champs inconnus envoyés
    transform: true,             // active les transformations (@Transform)
  }));
  // Origines autorisées par le CORS. En prod (nginx, même origine) le CORS
  // n'est pas sollicité ; cette liste sert surtout au mode dev (5173 -> 5000).
  // FRONTEND_URL peut contenir plusieurs origines séparées par des virgules.
  app.enableCors({
    origin: (process.env.FRONTEND_URL ?? 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim()),
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  });
  // Servir les fichiers uploadés statiquement
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

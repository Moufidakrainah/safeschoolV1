import { NestFactory } from "@nestjs/core";
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { join } from "path";
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
// if (!process.env.JWT_SECRET) {
//     throw new Error("JWT_SECRET manquant dans les variables d'environnement");
//   }
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,             // supprime les champs non définis dans le DTO
    forbidNonWhitelisted: true,  // erreur si champs inconnus envoyés
    transform: true,             // active les transformations (@Transform)
  }));
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
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

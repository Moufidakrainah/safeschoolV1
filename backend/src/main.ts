import { NestFactory } from "@nestjs/core";
<<<<<<< HEAD
import { AppModule } from "./app.module";
=======
import { NestExpressApplication } from "@nestjs/platform-express";
import { AppModule } from "./app.module";
import { join } from "path";
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
<<<<<<< HEAD
=======
  });
  // Servir les fichiers uploadés statiquement
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads',
>>>>>>> 857fb437763aac2bda1f5c81879bb935f61a291e
  });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();

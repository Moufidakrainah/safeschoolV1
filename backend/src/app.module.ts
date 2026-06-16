import { Module, NestModule, MiddlewareConsumer } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { ReportsModule } from "./reports/reports.module";
import { StudentProfilesModule } from "./student-profiles/student-profiles.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { LoggerModule } from "./logger/logger.module";
import { HttpLoggerMiddleware } from "./logger/http-logger.middleware";
import { ClassesModule } from "./classes/classes.module";
import { StaffProfilesModule } from "./staff/staff-profiles.module";
import { ParentsModule } from "./parents/parents.module";
import { QuizRealtimeModule } from "./quiz-realtime/quiz-realtime.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 7,
    }]),
    TypeOrmModule.forRoot({
      type: "postgres",
      host: process.env.DB_HOST,
      port: parseInt(process.env.DB_PORT ?? "5432", 10),
      username: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || "safeschool",
      entities: [__dirname + "/**/*.entity{.ts,.js}"],
      synchronize: true,
    }),
    LoggerModule,
    AuthModule,
    UsersModule,
    ReportsModule,
    NotificationsModule,
    StudentProfilesModule,
    ClassesModule,
    StaffProfilesModule,
    ParentsModule,
    QuizRealtimeModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(HttpLoggerMiddleware).forRoutes("*");
  }
}
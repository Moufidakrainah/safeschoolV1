import { Module } from "@nestjs/common";
import { QuizRealtimeGateway } from "./quiz-realtime.gateway";
import { QuizRealtimeService } from "./quiz-realtime.service";

@Module({
  providers: [QuizRealtimeGateway, QuizRealtimeService],
})
export class QuizRealtimeModule {}

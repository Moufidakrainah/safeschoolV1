import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QuizRealtimeGateway } from './quiz-realtime.gateway';
import { QuizRealtimeService } from './quiz-realtime.service';

@Module({
	imports: [
		JwtModule.register({
			secret: process.env.JWT_SECRET,
			verifyOptions: { algorithms: ['HS256'] },
		}),
	],
	providers: [QuizRealtimeGateway, QuizRealtimeService],
})
export class QuizRealtimeModule {}

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { QuizRealtimeGateway } from './quiz-realtime.gateway';
import { QuizRealtimeService } from './quiz-realtime.service';

@Module({
	imports: [
		JwtModule.registerAsync({
			useFactory: () => {
				const secret = process.env.JWT_SECRET;
				if (!secret) throw new Error('JWT_SECRET non défini');
				return {
				secret,
				verifyOptions: { algorithms: ['HS256'] },
				};
			},
		}),
	],
	providers: [QuizRealtimeGateway, QuizRealtimeService],
})
export class QuizRealtimeModule {}

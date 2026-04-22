import { Injectable } from '@nestjs/common';

@Injectable()
export class QuizRealtimeService {
	createPongMessage(payload: string | undefined, clientId: string) {
		return {
			message: payload || 'pong',
			clientId,
		};
	}
}
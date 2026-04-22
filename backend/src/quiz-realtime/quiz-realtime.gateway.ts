import {
	ConnectedSocket,
	MessageBody,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { QuizRealtimeService } from './quiz-realtime.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class QuizRealtimeGateway
	implements OnGatewayConnection, OnGatewayDisconnect
{
	constructor(private readonly quizRealtimeService: QuizRealtimeService) {}

	@WebSocketServer()
	server: Server;

	handleConnection(client: Socket) {
		console.log(`quiz client connected: ${client.id}`);
	}

	handleDisconnect(client: Socket) {
		console.log(`quiz client disconnected: ${client.id}`);
	}

	@SubscribeMessage('quiz:ping')
	handlePing(
		@MessageBody() payload: string,
		@ConnectedSocket() client: Socket,
	) {
		return {
			event: 'quiz:pong',
			data: this.quizRealtimeService.createPongMessage(payload, client.id),
		};
	}
}

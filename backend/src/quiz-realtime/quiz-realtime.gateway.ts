import {
	ConnectedSocket,
	MessageBody,
	OnGatewayInit,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { QuizRealtimeService } from './quiz-realtime.service';

interface JoinRoomPayload {
	roomId: string;
	playerName?: string;
}

interface LeaveRoomPayload {
	roomId: string;
}

interface StartGamePayload {
	roomId: string;
}

interface SubmitAnswerPayload {
	roomId: string;
	questionId: number;
	selectedIndex: number;
}

@WebSocketGateway({ cors: { origin: '*' } })
export class QuizRealtimeGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	constructor(private readonly quizRealtimeService: QuizRealtimeService) {}

	@WebSocketServer()
	server: Server;

	afterInit() {
		console.log('quiz realtime gateway initialized');
	}

	handleConnection(client: Socket) {
		console.log(`quiz client connected: ${client.id}`);
	}

	handleDisconnect(client: Socket) {
		console.log(`quiz client disconnected: ${client.id}`);

		const updates = this.quizRealtimeService.removeClientFromAllRooms(client.id);
		for (const update of updates) {
			if (update.result.status === 'room-closed') {
				this.server.to(update.roomId).emit('quiz:room:closed', {
					roomId: update.roomId,
				});
				continue;
			}

			if (update.result.snapshot) {
				this.server
					.to(update.roomId)
					.emit('quiz:room:update', update.result.snapshot);
			}
		}
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

	@SubscribeMessage('quiz:join')
	handleJoin(
		@MessageBody() payload: JoinRoomPayload,
		@ConnectedSocket() client: Socket,
	) {
		const result = this.quizRealtimeService.joinRoom({
			roomId: payload.roomId,
			clientId: client.id,
			playerName: payload.playerName,
		});

		if (result.status === 'joined') {
			client.join(payload.roomId);
		}

		if (result.snapshot) {
			this.server.to(payload.roomId).emit('quiz:room:update', result.snapshot);
		}

		if (result.status === 'already-joined') {
			console.log(`client: ${client.id} already in ${payload.roomId}`);
			return {
				event: 'quiz:join:ignored',
				data: {
					roomId: payload.roomId,
					reason: 'already-in-room',
					snapshot: result.snapshot,
				},
			};
		}

		console.log(`client: ${client.id} joined ${payload.roomId}`);

		return {
			event: 'quiz:joined',
			data: result.snapshot,
		};
	}

	@SubscribeMessage('quiz:leave')
	handleLeave(
		@MessageBody() payload: LeaveRoomPayload,
		@ConnectedSocket() client: Socket,
	) {
		const result = this.quizRealtimeService.leaveRoom(payload.roomId, client.id);

		if (result.status === 'room-not-found') {
			return {
				event: 'quiz:leave:ignored',
				data: {
					roomId: payload.roomId,
					reason: 'room-not-found',
				},
			};
		}

		if (result.status === 'not-in-room') {
			return {
				event: 'quiz:leave:ignored',
				data: {
					roomId: payload.roomId,
					reason: 'not-in-room',
					snapshot: result.snapshot,
				},
			};
		}

		client.leave(payload.roomId);
		console.log(`client: ${client.id} left ${payload.roomId}`);

		if (result.status === 'room-closed') {
			this.server.to(payload.roomId).emit('quiz:room:closed', {
				roomId: payload.roomId,
			});
			return {
				event: 'quiz:left',
				data: { roomId: payload.roomId, closed: true },
			};
		}

		if (result.snapshot) {
			this.server.to(payload.roomId).emit('quiz:room:update', result.snapshot);
		}

		return {
			event: 'quiz:left',
			data: result.snapshot,
		};
	}

	@SubscribeMessage('quiz:start')
	handleStart(
		@MessageBody() payload: StartGamePayload,
		@ConnectedSocket() client: Socket,
	) {
		const snapshot = this.quizRealtimeService.startGame(
			payload.roomId,
			client.id,
		);

		this.server.to(payload.roomId).emit('quiz:game:started', snapshot);

		const questionSnapshot = this.quizRealtimeService.getQuestionForRoom(payload.roomId);

		if (questionSnapshot)
			this.server.to(payload.roomId).emit('quiz:question', questionSnapshot);

		return {
			event: 'quiz:started',
			data: snapshot,
		};
	}

	@SubscribeMessage('quiz:answer')
	handleAnswer(
		@MessageBody() payload: SubmitAnswerPayload,
		@ConnectedSocket() client: Socket,
	) {
		const result = this.quizRealtimeService.submitAnswer({
			roomId: payload.roomId,
			clientId: client.id,
			questionId: payload.questionId,
			selectedIndex: payload.selectedIndex,
		});

		if (result.status !== 'accepted') {
			return {
				event: 'quiz:answer:ignored',
				data: {
					roomId: payload.roomId,
					playerId: client.id,
					questionId: payload.questionId,
					reason: result.status,
					snapshot: result.roomSnapshot,
				},
			};
		}

		client.emit('quiz:answer:result', result.answerResult);

		if (result.roomSnapshot) {
			this.server.to(payload.roomId).emit('quiz:score:update', result.roomSnapshot);
		}

		return {
			event: 'quiz:answer:accepted',
			data: {
				roomId: payload.roomId,
				playerId: client.id,
				questionId: payload.questionId,
			},
		};
	}
}

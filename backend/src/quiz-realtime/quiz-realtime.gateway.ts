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
import { JwtService } from '@nestjs/jwt';
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

@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL ?? 'http://localhost:5173' } })
export class QuizRealtimeGateway
	implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
	constructor(
		private readonly quizRealtimeService: QuizRealtimeService,
		private readonly jwtService: JwtService,
	) {}

	@WebSocketServer()
	server: Server;

	afterInit() {
		this.quizRealtimeService.setOnQuestionRevealed((payload) => {
			this.server.to(payload.roomId).emit('quiz:question:reveal', payload);
		});

		this.quizRealtimeService.setOnQuestionTimedOut(
			({ roomId, roomSnapshot, nextQuestionSnapshot }) => {
				this.server.to(roomId).emit('quiz:score:update', roomSnapshot);

				if (nextQuestionSnapshot) {
					this.server.to(roomId).emit('quiz:question', nextQuestionSnapshot);
					return;
				}

				this.server.to(roomId).emit('quiz:game:over', roomSnapshot);
				void this.server.in(roomId).socketsLeave(roomId);
			},
		);
	}

	handleConnection(client: Socket) {
		const token = this.extractToken(client);

		if (!token) {
			client.emit('quiz:unauthorized', { reason: 'missing-token' });
			client.disconnect(true);
			return;
		}

		try {
			const payload = this.jwtService.verify<{ sub: string; email: string; role: string }>(
				token,
			);
			client.data.user = payload;
		} catch {
			client.emit('quiz:unauthorized', { reason: 'invalid-token' });
			client.disconnect(true);
			return;
		}

		console.log(`quiz client connected: ${client.id}`);
	}

	private extractToken(client: Socket): string | undefined {
		const authToken = client.handshake.auth?.token;
		if (typeof authToken === 'string' && authToken.length > 0) {
			return authToken.replace(/^Bearer\s+/i, '');
		}

		const header = client.handshake.headers?.authorization;
		if (typeof header === 'string' && header.length > 0) {
			return header.replace(/^Bearer\s+/i, '');
		}

		return undefined;
	}

	handleDisconnect(client: Socket) {
		console.log(`quiz client disconnected: ${client.id}`);

		const updates = this.quizRealtimeService.removeClientFromAllRooms(client.id);
		for (const update of updates) {
			if (update.result.status === 'room-closed') {
				this.server.to(update.roomId).emit('quiz:room:closed', { roomId: update.roomId });
				continue;
			}

			if (update.result.snapshot) {
				this.server.to(update.roomId).emit('quiz:room:update', update.result.snapshot);
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

		if (result.status === 'roomcode-bad-format') {
			return {
				event: 'quiz:join:ignored',
				data: { roomId: payload.roomId, reason: 'code-bad-format', snapshot: result.snapshot },
			}
		}

		if (result.status === 'quiz-already-started') {
			return {
				event: 'quiz:join:ignored',
				data: { roomId: payload.roomId, reason: 'quiz-already-started', snapshot: result.snapshot },
			};
		}

		if (result.status === 'room-is-full') {
			return {
				event: 'quiz:join:ignored',
				data: { roomId: payload.roomId, reason: 'room-is-full', snapshot: result.snapshot },
			}
		}

		if (result.status === 'joined') {
			void client.join(payload.roomId);
		}

		if (result.snapshot) {
			this.server.to(payload.roomId).emit('quiz:room:update', result.snapshot);
		}

		if (result.status === 'already-joined') {
			return {
				event: 'quiz:join:ignored',
				data: { roomId: payload.roomId, reason: 'already-in-room', snapshot: result.snapshot },
			};
		}

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
				data: { roomId: payload.roomId, reason: 'room-not-found' },
			};
		}

		if (result.status === 'not-in-room') {
			return {
				event: 'quiz:leave:ignored',
				data: { roomId: payload.roomId, reason: 'not-in-room', snapshot: result.snapshot },
			};
		}

		void client.leave(payload.roomId);

		if (result.status === 'room-closed') {
			this.server.to(payload.roomId).emit('quiz:room:closed', { roomId: payload.roomId });
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
		const result = this.quizRealtimeService.startGame(payload.roomId, client.id);

		if (result.status !== 'started') {
			return {
				event: 'quiz:start:ignored',
				data: { roomId: payload.roomId, reason: result.status },
			};
		}

		this.server.to(payload.roomId).emit('quiz:game:started', result.snapshot);

		const questionSnapshot = this.quizRealtimeService.getQuestionSnapshot(payload.roomId);
		if (questionSnapshot) {
			this.server.to(payload.roomId).emit('quiz:question', questionSnapshot);
		}

		return {
			event: 'quiz:started',
			data: result.snapshot,
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

		if (result.revealPayload) {
			this.server.to(payload.roomId).emit('quiz:question:reveal', result.revealPayload);
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

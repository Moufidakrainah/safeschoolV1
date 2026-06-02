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
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { QuizRealtimeService } from './quiz-realtime.service';

function isNonEmptyString(value: unknown): value is string {
	return typeof value === 'string' && value.length > 0;
}

function isInteger(value: unknown): value is number {
	return typeof value === 'number' && Number.isInteger(value);
}

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

	private readonly logger = new Logger(QuizRealtimeGateway.name);

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

		this.logger.log(`quiz client connected: ${client.id}`);
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
		this.logger.log(`quiz client disconnected: ${client.id}`);

		const updates = this.quizRealtimeService.markDisconnected(client.id);
		for (const update of updates) {
			if (update.closed) {
				this.server.to(update.roomId).emit('quiz:room:closed', { roomId: update.roomId });
				continue;
			}

			if (update.snapshot) {
				this.server.to(update.roomId).emit('quiz:room:update', update.snapshot);
			}
		}
	}

	private getPlayerId(client: Socket): string | undefined {
		const user = client.data.user as { sub?: string } | undefined;
		return user?.sub;
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
		if (!payload || !isNonEmptyString(payload.roomId)) {
			return {
				event: 'quiz:join:ignored',
				data: { roomId: null, reason: 'invalid-payload', snapshot: null },
			};
		}
		if (payload.playerName !== undefined && typeof payload.playerName !== 'string') {
			return {
				event: 'quiz:join:ignored',
				data: { roomId: payload.roomId, reason: 'invalid-payload', snapshot: null },
			};
		}

		const playerId = this.getPlayerId(client);
		if (!playerId) {
			return {
				event: 'quiz:join:ignored',
				data: { roomId: payload.roomId, reason: 'unauthorized', snapshot: null },
			};
		}

		const result = this.quizRealtimeService.joinRoom({
			roomId: payload.roomId,
			playerId,
			socketId: client.id,
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

		if (result.status === 'server-at-capacity') {
			return {
				event: 'quiz:join:ignored',
				data: { roomId: payload.roomId, reason: 'server-at-capacity', snapshot: result.snapshot },
			};
		}

		if (result.status === 'joined' || result.status === 'reconnected') {
			void client.join(payload.roomId);
		}

		if (result.snapshot) {
			this.server.to(payload.roomId).emit('quiz:room:update', result.snapshot);
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
		if (!payload || !isNonEmptyString(payload.roomId)) {
			return {
				event: 'quiz:leave:ignored',
				data: { roomId: null, reason: 'invalid-payload' },
			};
		}

		const playerId = this.getPlayerId(client);
		if (!playerId) {
			return {
				event: 'quiz:leave:ignored',
				data: { roomId: payload.roomId, reason: 'unauthorized' },
			};
		}

		const result = this.quizRealtimeService.leaveRoom(payload.roomId, playerId);

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
		if (!payload || !isNonEmptyString(payload.roomId)) {
			return {
				event: 'quiz:start:ignored',
				data: { roomId: null, reason: 'invalid-payload' },
			};
		}

		const playerId = this.getPlayerId(client);
		if (!playerId) {
			return {
				event: 'quiz:start:ignored',
				data: { roomId: payload.roomId, reason: 'unauthorized' },
			};
		}

		const result = this.quizRealtimeService.startGame(payload.roomId, playerId);

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
		const playerId = this.getPlayerId(client);
		if (
			!playerId ||
			!payload ||
			!isNonEmptyString(payload.roomId) ||
			!isInteger(payload.questionId) ||
			!isInteger(payload.selectedIndex) ||
			payload.selectedIndex < 0
		) {
			return {
				event: 'quiz:answer:ignored',
				data: {
					roomId: payload?.roomId ?? null,
					playerId: playerId ?? null,
					questionId: payload?.questionId ?? null,
					reason: playerId ? 'invalid-payload' : 'unauthorized',
					snapshot: null,
				},
			};
		}

		const result = this.quizRealtimeService.submitAnswer({
			roomId: payload.roomId,
			playerId,
			questionId: payload.questionId,
			selectedIndex: payload.selectedIndex,
		});

		if (result.status !== 'accepted') {
			return {
				event: 'quiz:answer:ignored',
				data: {
					roomId: payload.roomId,
					playerId,
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
				playerId,
				questionId: payload.questionId,
			},
		};
	}
}

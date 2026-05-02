import { Injectable } from '@nestjs/common';

interface QuestionInternal {
	id: number;
	text: string;
	options: string[];
	correctIndex: number;
}

interface QuestionPublic {
	id: number;
	text: string;
	options: string[];
}

const QUESTIONS: QuestionInternal[] = [
	{
		id: 1,
		text: 'what is 1+1?',
		options: ['2', '3', '1', '-42'],
		correctIndex: 0,
	},
	{
		id: 2,
		text: 'what is 2+2?',
		options: ['0', '1', '2.5', '4'],
		correctIndex: 3,
	},
];

const QUESTION_TIME_LIMIT_MS = 30_000;

type GameStatus = 'waiting' | 'in-progress' | 'finished';

interface QuizPlayer {
	clientId: string;
	name: string;
	score: number;
}

interface QuizRoom {
	roomId: string;
	hostId: string;
	status: GameStatus;
	players: Map<string, QuizPlayer>;
	currentQuestionIndex: number;
	answeredPlayerIds: Set<string>;
	startedAt: number | null;
	questionEndsAt: number | null;
	questionTimer: NodeJS.Timeout | null;
}

interface TimeoutAdvancePayload {
	roomId: string;
	roomSnapshot: RoomSnapshot;
	nextQuestionSnapshot: ReturnType<QuizRealtimeService['getQuestionSnapshot']>;
}

interface JoinRoomInput {
	roomId: string;
	clientId: string;
	playerName?: string;
}

interface SubmitAnswerInput {
	roomId: string;
	clientId: string;
	questionId: number;
	selectedIndex: number;
}

type RoomSnapshot = ReturnType<QuizRealtimeService['getRoomSnapshot']>;

type StartGameResult =
	| { status: 'started'; snapshot: RoomSnapshot }
	| { status: 'room-not-found' | 'not-host'; snapshot: null };

type SubmitAnswerResult =
	| {
			status: 'accepted';
			roomSnapshot: RoomSnapshot;
			answerResult: {
				roomId: string;
				playerId: string;
				questionId: number;
				isCorrect: boolean;
			};
			questionAdvanced: boolean;
	  }
	| {
			status:
				| 'room-not-found'
				| 'player-not-in-room'
				| 'no-active-question'
				| 'question-mismatch'
				| 'already-answered';
			roomSnapshot: RoomSnapshot | null;
			answerResult: null;
	  };

type JoinRoomResult = {
	status: 'joined' | 'already-joined' | 'quiz-already-started';
	snapshot: RoomSnapshot;
};

type LeaveRoomResult =
	| { status: 'left'; snapshot: RoomSnapshot }
	| { status: 'room-closed'; snapshot: null }
	| { status: 'room-not-found' | 'not-in-room'; snapshot: RoomSnapshot | null };

@Injectable()
export class QuizRealtimeService {
	private readonly rooms = new Map<string, QuizRoom>();
	private onQuestionTimedOut?: (payload: TimeoutAdvancePayload) => void;

	createPongMessage(payload: string | undefined, clientId: string) {
		return {
			message: payload || 'pong',
			clientId,
		};
	}

	joinRoom({ roomId, clientId, playerName }: JoinRoomInput): JoinRoomResult {
		let room = this.rooms.get(roomId);

		if (!room) {
			room = {
				roomId,
				hostId: clientId,
				status: 'waiting',
				players: new Map<string, QuizPlayer>(),
				currentQuestionIndex: 0,
				answeredPlayerIds: new Set<string>(),
				startedAt: null,
				questionEndsAt: null,
				questionTimer: null,
			};
			this.rooms.set(roomId, room);
		} else if (room.status === 'in-progress') {
			return {
				status: 'quiz-already-started',
				snapshot: this.getRoomSnapshot(roomId),
			};
		}

		if (room.players.has(clientId)) {
			return {
				status: 'already-joined',
				snapshot: this.getRoomSnapshot(roomId),
			};
		}

		room.players.set(clientId, {
			clientId,
			name: playerName?.trim() || `Player-${clientId.slice(0, 5)}`,
			score: 0,
		});

		return {
			status: 'joined',
			snapshot: this.getRoomSnapshot(roomId),
		};
	}

	leaveRoom(roomId: string, clientId: string): LeaveRoomResult {
		const room = this.rooms.get(roomId);
		if (!room) {
			return { status: 'room-not-found', snapshot: null };
		}

		if (!room.players.has(clientId)) {
			return {
				status: 'not-in-room',
				snapshot: this.getRoomSnapshot(roomId),
			};
		}

		room.players.delete(clientId);

		if (room.players.size === 0) {
			this.clearQuestionTimer(room);
			this.rooms.delete(roomId);
			return { status: 'room-closed', snapshot: null };
		}

		if (room.hostId === clientId) {
			const nextHost = room.players.values().next().value as QuizPlayer | undefined;
			if (nextHost) {
				room.hostId = nextHost.clientId;
			}
		}

		return {
			status: 'left',
			snapshot: this.getRoomSnapshot(roomId),
		};
	}

	startGame(roomId: string, clientId: string): StartGameResult {
		const room = this.rooms.get(roomId);
		if (!room) return { status: 'room-not-found', snapshot: null };
		if (room.hostId !== clientId) return { status: 'not-host', snapshot: null };

		this.clearQuestionTimer(room);
		room.status = 'in-progress';
		room.currentQuestionIndex = 0;
		room.answeredPlayerIds.clear();
		room.startedAt = Date.now();
		this.scheduleQuestionTimer(room);

		return { status: 'started', snapshot: this.getRoomSnapshot(roomId) };
	}

	submitAnswer({ roomId, clientId, questionId, selectedIndex }: SubmitAnswerInput): SubmitAnswerResult {
		const room = this.rooms.get(roomId);
		if (!room) {
			return { status: 'room-not-found', roomSnapshot: null, answerResult: null };
		}

		const player = room.players.get(clientId);
		if (!player) {
			return { status: 'player-not-in-room', roomSnapshot: this.getRoomSnapshot(roomId), answerResult: null };
		}

		if (room.status !== 'in-progress') {
			return { status: 'no-active-question', roomSnapshot: this.getRoomSnapshot(roomId), answerResult: null };
		}

		const currentQuestion = QUESTIONS[room.currentQuestionIndex];
		if (!currentQuestion) {
			return { status: 'no-active-question', roomSnapshot: this.getRoomSnapshot(roomId), answerResult: null };
		}

		if (currentQuestion.id !== questionId) {
			return { status: 'question-mismatch', roomSnapshot: this.getRoomSnapshot(roomId), answerResult: null };
		}

		if (room.answeredPlayerIds.has(clientId)) {
			return { status: 'already-answered', roomSnapshot: this.getRoomSnapshot(roomId), answerResult: null };
		}

		const isCorrect = selectedIndex === currentQuestion.correctIndex;
		if (isCorrect) {
			player.score += 1;
		}

		room.answeredPlayerIds.add(clientId);

		const allAnswered = [...room.players.keys()].every((id) => room.answeredPlayerIds.has(id));
		let questionAdvanced = false;
		if (allAnswered) {
			this.advanceToNextQuestion(room);
			questionAdvanced = true;
		}

		return {
			status: 'accepted',
			roomSnapshot: this.getRoomSnapshot(roomId),
			answerResult: { roomId, playerId: clientId, questionId, isCorrect },
			questionAdvanced,
		};
	}

	setOnQuestionTimedOut(handler: ((payload: TimeoutAdvancePayload) => void) | undefined) {
		this.onQuestionTimedOut = handler;
	}

	removeClientFromAllRooms(clientId: string) {
		const updates: Array<{ roomId: string; result: LeaveRoomResult }> = [];

		for (const roomId of this.rooms.keys()) {
			const room = this.rooms.get(roomId);
			if (!room || !room.players.has(clientId)) continue;

			const result = this.leaveRoom(roomId, clientId);
			updates.push({ roomId, result });
		}

		return updates;
	}

	getRoomSnapshot(roomId: string) {
		const room = this.rooms.get(roomId);
		if (!room) return null;

		return {
			roomId: room.roomId,
			hostId: room.hostId,
			status: room.status,
			players: Array.from(room.players.values()).map((player) => ({
				clientId: player.clientId,
				name: player.name,
				score: player.score,
			})),
		};
	}

	getQuestionSnapshot(roomId: string) {
		const room = this.rooms.get(roomId);
		if (!room) return null;

		const question = QUESTIONS[room.currentQuestionIndex];
		if (!question) return null;

		return {
			roomId: room.roomId,
			question: this.toPublicQuestion(question),
			questionNumber: room.currentQuestionIndex + 1,
			totalQuestions: QUESTIONS.length,
			timeLimitMs: QUESTION_TIME_LIMIT_MS,
			endsAt: room.questionEndsAt,
		};
	}

	private clearQuestionTimer(room: QuizRoom) {
		if (room.questionTimer) {
			clearTimeout(room.questionTimer);
			room.questionTimer = null;
		}
		room.questionEndsAt = null;
	}

	private scheduleQuestionTimer(room: QuizRoom) {
		this.clearQuestionTimer(room);

		const currentQuestion = QUESTIONS[room.currentQuestionIndex];
		if (!currentQuestion || room.status !== 'in-progress') {
			return;
		}

		room.questionEndsAt = Date.now() + QUESTION_TIME_LIMIT_MS;
		room.questionTimer = setTimeout(() => {
			const timeoutResult = this.advanceQuestionFromTimeout(room.roomId);
			if (!timeoutResult || !this.onQuestionTimedOut) {
				return;
			}

			this.onQuestionTimedOut({
				roomId: room.roomId,
				roomSnapshot: timeoutResult.roomSnapshot,
				nextQuestionSnapshot: timeoutResult.nextQuestionSnapshot,
			});
		}, QUESTION_TIME_LIMIT_MS);
	}

	private advanceQuestionFromTimeout(roomId: string) {
		const room = this.rooms.get(roomId);
		if (!room || room.status !== 'in-progress') {
			return null;
		}

		return this.advanceToNextQuestion(room);
	}

	private advanceToNextQuestion(room: QuizRoom) {
		this.clearQuestionTimer(room);
		room.currentQuestionIndex += 1;
		room.answeredPlayerIds.clear();

		const hasMoreQuestions = room.currentQuestionIndex < QUESTIONS.length;
		if (!hasMoreQuestions) {
			const roomSnapshot = this.getRoomSnapshot(room.roomId);
			room.status = 'finished';
			room.players.clear();
			this.rooms.delete(room.roomId);
			return {
				roomSnapshot,
				nextQuestionSnapshot: null,
			};
		}

		this.scheduleQuestionTimer(room);
		return {
			roomSnapshot: this.getRoomSnapshot(room.roomId),
			nextQuestionSnapshot: this.getQuestionSnapshot(room.roomId),
		};
	}

	private toPublicQuestion(q: QuestionInternal): QuestionPublic {
		return { id: q.id, text: q.text, options: q.options };
	}
}

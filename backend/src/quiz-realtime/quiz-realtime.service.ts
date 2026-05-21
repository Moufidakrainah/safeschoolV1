import { Injectable } from '@nestjs/common';
import questionsData from './questions.json';

interface QuestionInternal {
	id: number;
	text: string;
	options: string[];
	correctIndex: number;
	score: number;
}

interface QuestionPublic {
	id: number;
	text: string;
	options: string[];
}

const ALL_QUESTIONS: QuestionInternal[] = questionsData;
const QUESTIONS_PER_GAME = 10;
const QUESTION_TIME_LIMIT_MS = 30_000;

function pickRandomQuestions(questions: QuestionInternal[], count: number): QuestionInternal[] {
	const shuffled = [...questions].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, Math.min(count, shuffled.length));
}
const REVEAL_TIME_MS = 5_000;

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
	questions: QuestionInternal[];
	currentQuestionIndex: number;
	answeredPlayerIds: Set<string>;
	selectedAnswerByPlayerId: Map<string, number>;
	startedAt: number | null;
	questionEndsAt: number | null;
	questionTimer: NodeJS.Timeout | null;
	revealEndsAt: number | null;
	revealTimer: NodeJS.Timeout | null;
}

interface AnswerStatistic {
	index: number;
	count: number;
	percentage: number;
}

interface TimeoutAdvancePayload {
	roomId: string;
	roomSnapshot: RoomSnapshot;
	nextQuestionSnapshot: ReturnType<QuizRealtimeService['getQuestionSnapshot']>;
}

interface QuestionRevealPayload {
	roomId: string;
	questionId: number;
	correctIndex: number;
	answerStatistics: AnswerStatistic[];
	roomSnapshot: RoomSnapshot;
	revealEndsAt: number;
	revealDurationMs: number;
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
				pointValue: number;
			};
			revealPayload: QuestionRevealPayload | null;
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
	status: 'joined' | 'already-joined' | 'quiz-already-started' | 'roomcode-bad-format' | 'room-is-full';
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
	private onQuestionRevealed?: (payload: QuestionRevealPayload) => void;

	createPongMessage(payload: string | undefined, clientId: string) {
		return {
			message: payload || 'pong',
			clientId,
		};
	}

	joinRoom({ roomId, clientId, playerName }: JoinRoomInput): JoinRoomResult {
		if (roomId.length < 3 || roomId.length > 10) {
			return {
				status : "roomcode-bad-format",
				snapshot: this.getRoomSnapshot(roomId),
			};
		}

		let room = this.rooms.get(roomId);

		if (!room) {
			room = {
				roomId,
				hostId: clientId,
				status: 'waiting',
				players: new Map<string, QuizPlayer>(),
				questions: [],
				currentQuestionIndex: 0,
				answeredPlayerIds: new Set<string>(),
				selectedAnswerByPlayerId: new Map<string, number>(),
				startedAt: null,
				questionEndsAt: null,
				questionTimer: null,
				revealEndsAt: null,
				revealTimer: null,
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

		if (room.players.size >= 32) {
			return {
				status: 'room-is-full',
				snapshot: this.getRoomSnapshot(roomId),
			}
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
			this.clearRevealTimer(room);
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
		room.questions = pickRandomQuestions(ALL_QUESTIONS, QUESTIONS_PER_GAME);
		room.currentQuestionIndex = 0;
		room.answeredPlayerIds.clear();
		room.selectedAnswerByPlayerId.clear();
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

		if (room.revealEndsAt !== null) {
			return { status: 'no-active-question', roomSnapshot: this.getRoomSnapshot(roomId), answerResult: null };
		}

		const currentQuestion = room.questions[room.currentQuestionIndex];
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
			player.score += currentQuestion.score;
		}

		room.selectedAnswerByPlayerId.set(clientId, selectedIndex);
		room.answeredPlayerIds.add(clientId);

		const allAnswered = [...room.players.keys()].every((id) => room.answeredPlayerIds.has(id));
		let revealPayload: QuestionRevealPayload | null = null;
		if (allAnswered) {
			revealPayload = this.enterRevealPhase(room);
		}

		return {
			status: 'accepted',
			roomSnapshot: this.getRoomSnapshot(roomId),
			answerResult: { roomId, playerId: clientId, questionId, isCorrect, pointValue: currentQuestion.score },
			revealPayload,
		};
	}

	setOnQuestionTimedOut(handler: ((payload: TimeoutAdvancePayload) => void) | undefined) {
		this.onQuestionTimedOut = handler;
	}

	setOnQuestionRevealed(handler: ((payload: QuestionRevealPayload) => void) | undefined) {
		this.onQuestionRevealed = handler;
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

		const question = room.questions[room.currentQuestionIndex];
		if (!question) return null;

		return {
			roomId: room.roomId,
			question: this.toPublicQuestion(question),
			questionNumber: room.currentQuestionIndex + 1,
			totalQuestions: room.questions.length,
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

		const currentQuestion = room.questions[room.currentQuestionIndex];
		if (!currentQuestion || room.status !== 'in-progress') {
			return;
		}

		room.questionEndsAt = Date.now() + QUESTION_TIME_LIMIT_MS;
		room.questionTimer = setTimeout(() => {
			const targetRoom = this.rooms.get(room.roomId);
			if (!targetRoom || targetRoom.status !== 'in-progress') {
				return;
			}

			const revealPayload = this.enterRevealPhase(targetRoom);
			if (revealPayload && this.onQuestionRevealed) {
				this.onQuestionRevealed(revealPayload);
			}
		}, QUESTION_TIME_LIMIT_MS);
	}

	private enterRevealPhase(room: QuizRoom): QuestionRevealPayload | null {
		if (room.status !== 'in-progress') return null;

		const currentQuestion = room.questions[room.currentQuestionIndex];
		if (!currentQuestion) return null;

		this.clearQuestionTimer(room);
		this.clearRevealTimer(room);

		room.revealEndsAt = Date.now() + REVEAL_TIME_MS;
		room.revealTimer = setTimeout(() => {
			const advanceResult = this.advanceFromReveal(room.roomId);
			if (!advanceResult || !this.onQuestionTimedOut) {
				return;
			}

			this.onQuestionTimedOut({
				roomId: room.roomId,
				roomSnapshot: advanceResult.roomSnapshot,
				nextQuestionSnapshot: advanceResult.nextQuestionSnapshot,
			});
		}, REVEAL_TIME_MS);

		return {
			roomId: room.roomId,
			questionId: currentQuestion.id,
			correctIndex: currentQuestion.correctIndex,
			answerStatistics: this.getAnswerStatistics(room, currentQuestion.options.length),
			roomSnapshot: this.getRoomSnapshot(room.roomId),
			revealEndsAt: room.revealEndsAt,
			revealDurationMs: REVEAL_TIME_MS,
		};
	}

	private advanceFromReveal(roomId: string) {
		const room = this.rooms.get(roomId);
		if (!room) return null;
		this.clearRevealTimer(room);
		return this.advanceToNextQuestion(room);
	}

	private clearRevealTimer(room: QuizRoom) {
		if (room.revealTimer) {
			clearTimeout(room.revealTimer);
			room.revealTimer = null;
		}
		room.revealEndsAt = null;
	}

	private advanceToNextQuestion(room: QuizRoom) {
		this.clearQuestionTimer(room);
		this.clearRevealTimer(room);
		room.currentQuestionIndex += 1;
		room.answeredPlayerIds.clear();
		room.selectedAnswerByPlayerId.clear();

		const hasMoreQuestions = room.currentQuestionIndex < room.questions.length;
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

	private getAnswerStatistics(room: QuizRoom, optionCount: number): AnswerStatistic[] {
		const counts = Array.from({ length: optionCount }, () => 0);

		for (const selectedIndex of room.selectedAnswerByPlayerId.values()) {
			if (selectedIndex >= 0 && selectedIndex < optionCount) {
				counts[selectedIndex] += 1;
			}
		}

		const totalAnswers = counts.reduce((total, count) => total + count, 0);

		return counts.map((count, index) => ({
			index,
			count,
			percentage: totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0,
		}));
	}
}

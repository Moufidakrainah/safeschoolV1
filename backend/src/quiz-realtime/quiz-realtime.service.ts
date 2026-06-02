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
const QUESTIONS_PER_GAME = 15;
const QUESTION_TIME_LIMIT_MS = 30_000;
// Hard cap on concurrent rooms to prevent a client from exhausting memory by
// flooding `quiz:join` with unique room codes.
const MAX_CONCURRENT_ROOMS = 500;

const REVEAL_TIME_MS = 5_000;
// How long a disconnected player's state is kept so they can reconnect and
// resume an in-progress game. After this, their state is dropped from the room
const RECONNECT_GRACE_MS = 60_000;

// Speed tiers: faster correct answers are worth more base points
const SPEED_TIERS: { withinMs: number; points: number }[] = [
	{ withinMs: 3_000, points: 3 },
	{ withinMs: 7_000, points: 2 },
];
// If answered in more than 7 seconds the 1 point is given
const SPEED_SLOW_POINTS = 1;
// Max possible combo streak
const MAX_STREAK_MULTIPLIER = 5;

function speedBasePoints(elapsedMs: number): number {
	for (const tier of SPEED_TIERS) {
		if (elapsedMs <= tier.withinMs) return tier.points;
	}
	return SPEED_SLOW_POINTS;
}

function streakMultiplier(streak: number): number {
	return Math.min(Math.max(streak, 1), MAX_STREAK_MULTIPLIER);
}

function pickRandomQuestions(questions: QuestionInternal[], count: number): QuestionInternal[] {
	const shuffled = [...questions].sort(() => Math.random() - 0.5);
	return shuffled.slice(0, Math.min(count, shuffled.length));
}

type GameStatus = 'waiting' | 'in-progress' | 'finished';

interface QuizPlayer {
	// Stable identity (JWT `sub`) that survives socket reconnects
	playerId: string;
	// Current live socket id, or null while the player is disconnected
	socketId: string | null;
	name: string;
	score: number;
	streak: number;
	connected: boolean;
	disconnectTimer: NodeJS.Timeout | null;
	graceEndsAt: number | null;
}

interface QuizRoom {
	roomId: string;
	// Host identity (stable playerId, not a socket id)
	hostId: string;
	status: GameStatus;
	// Keyed by stable playerId.
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
	playerId: string;
	socketId: string;
	playerName?: string;
}

interface SubmitAnswerInput {
	roomId: string;
	playerId: string;
	questionId: number;
	selectedIndex: number;
}

// One entry per room a disconnecting socket was part of
interface DisconnectUpdate {
	roomId: string;
	// The room was emptied and deleted as a result of the disconnect.
	closed: boolean;
	snapshot: RoomSnapshot | null;
}

type RoomSnapshot = ReturnType<QuizRealtimeService['getRoomSnapshot']>;

type StartGameResult =
	| { status: 'started'; snapshot: RoomSnapshot }
	| { status: 'room-not-found' | 'not-host' | 'already-in-progress'; snapshot: null };

type SubmitAnswerResult =
	| {
			status: 'accepted';
			roomSnapshot: RoomSnapshot;
			answerResult: {
				roomId: string;
				playerId: string;
				questionId: number;
				isCorrect: boolean;
				basePoints: number;
				multiplier: number;
				pointsEarned: number;
				streak: number;
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
	status:
		| 'joined'
		| 'reconnected'
		| 'quiz-already-started'
		| 'roomcode-bad-format'
		| 'room-is-full'
		| 'server-at-capacity';
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

	joinRoom({ roomId, playerId, socketId, playerName }: JoinRoomInput): JoinRoomResult {
		if (roomId.length < 3 || roomId.length > 10) {
			return {
				status : "roomcode-bad-format",
				snapshot: this.getRoomSnapshot(roomId),
			};
		}

		let room = this.rooms.get(roomId);

		// Reconnect: the player is already a member (possibly mid-game). Re-attach
		// the new socket and cancel any pending grace-period removal
		if (room && room.players.has(playerId)) {
			const player = room.players.get(playerId)!;
			if (player.disconnectTimer) {
				clearTimeout(player.disconnectTimer);
				player.disconnectTimer = null;
			}
			player.socketId = socketId;
			player.connected = true;
			player.graceEndsAt = null;
			if (playerName?.trim()) {
				player.name = playerName.trim();
			}
			return {
				status: 'reconnected',
				snapshot: this.getRoomSnapshot(roomId),
			};
		}

		if (!room && this.rooms.size >= MAX_CONCURRENT_ROOMS) {
			return {
				status: 'server-at-capacity',
				snapshot: null,
			};
		}

		if (!room) {
			room = {
				roomId,
				hostId: playerId,
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

		if (room.players.size >= 32) {
			return {
				status: 'room-is-full',
				snapshot: this.getRoomSnapshot(roomId),
			}
		}

		room.players.set(playerId, {
			playerId,
			socketId,
			name: playerName?.trim() || `Player-${playerId.slice(0, 5)}`,
			score: 0,
			streak: 0,
			connected: true,
			disconnectTimer: null,
			graceEndsAt: null,
		});

		return {
			status: 'joined',
			snapshot: this.getRoomSnapshot(roomId),
		};
	}

	leaveRoom(roomId: string, playerId: string): LeaveRoomResult {
		const room = this.rooms.get(roomId);
		if (!room) {
			return { status: 'room-not-found', snapshot: null };
		}

		const player = room.players.get(playerId);
		if (!player) {
			return {
				status: 'not-in-room',
				snapshot: this.getRoomSnapshot(roomId),
			};
		}

		if (player.disconnectTimer) {
			clearTimeout(player.disconnectTimer);
			player.disconnectTimer = null;
		}
		room.players.delete(playerId);
		room.answeredPlayerIds.delete(playerId);
		room.selectedAnswerByPlayerId.delete(playerId);

		if (room.players.size === 0) {
			this.clearQuestionTimer(room);
			this.clearRevealTimer(room);
			this.rooms.delete(roomId);
			return { status: 'room-closed', snapshot: null };
		}

		if (room.hostId === playerId) {
			// Prefer a still-connected player as the new host.
			const nextHost =
				[...room.players.values()].find((candidate) => candidate.connected) ??
				(room.players.values().next().value as QuizPlayer | undefined);
			if (nextHost) {
				room.hostId = nextHost.playerId;
			}
		}

		return {
			status: 'left',
			snapshot: this.getRoomSnapshot(roomId),
		};
	}

	startGame(roomId: string, playerId: string): StartGameResult {
		const room = this.rooms.get(roomId);
		if (!room) return { status: 'room-not-found', snapshot: null };
		if (room.hostId !== playerId) return { status: 'not-host', snapshot: null };

		// Prevent a host from restarting a game mid-game
		if (room.status !== 'waiting') return { status: 'already-in-progress', snapshot: null };

		this.clearQuestionTimer(room);
		this.clearRevealTimer(room);
		room.status = 'in-progress';
		room.questions = pickRandomQuestions(ALL_QUESTIONS, QUESTIONS_PER_GAME);
		room.currentQuestionIndex = 0;
		room.answeredPlayerIds.clear();
		room.selectedAnswerByPlayerId.clear();
		room.startedAt = Date.now();
		this.scheduleQuestionTimer(room);

		return { status: 'started', snapshot: this.getRoomSnapshot(roomId) };
	}

	submitAnswer({ roomId, playerId, questionId, selectedIndex }: SubmitAnswerInput): SubmitAnswerResult {
		const room = this.rooms.get(roomId);
		if (!room) {
			return { status: 'room-not-found', roomSnapshot: null, answerResult: null };
		}

		const player = room.players.get(playerId);
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

		if (room.answeredPlayerIds.has(playerId)) {
			return { status: 'already-answered', roomSnapshot: this.getRoomSnapshot(roomId), answerResult: null };
		}

		const isCorrect = selectedIndex === currentQuestion.correctIndex;

		let basePoints = 0;
		let multiplier = 0;
		let pointsEarned = 0;
		if (isCorrect) {
			const now = Date.now();
			const elapsedMs = room.questionEndsAt !== null
				? Math.max(0, Math.min(QUESTION_TIME_LIMIT_MS, QUESTION_TIME_LIMIT_MS - (room.questionEndsAt - now)))
				: QUESTION_TIME_LIMIT_MS;
			player.streak += 1;
			basePoints = speedBasePoints(elapsedMs);
			multiplier = streakMultiplier(player.streak);
			pointsEarned = basePoints * multiplier;
			player.score += pointsEarned;
		} else {
			player.streak = 0;
		}

		room.selectedAnswerByPlayerId.set(playerId, selectedIndex);
		room.answeredPlayerIds.add(playerId);

		const allAnswered = [...room.players.keys()].every((id) => room.answeredPlayerIds.has(id));
		let revealPayload: QuestionRevealPayload | null = null;
		if (allAnswered) {
			revealPayload = this.enterRevealPhase(room);
		}

		return {
			status: 'accepted',
			roomSnapshot: this.getRoomSnapshot(roomId),
			answerResult: { roomId, playerId, questionId, isCorrect, basePoints, multiplier, pointsEarned, streak: player.streak },
			revealPayload,
		};
	}

	setOnQuestionTimedOut(handler: ((payload: TimeoutAdvancePayload) => void) | undefined) {
		this.onQuestionTimedOut = handler;
	}

	setOnQuestionRevealed(handler: ((payload: QuestionRevealPayload) => void) | undefined) {
		this.onQuestionRevealed = handler;
	}

	// Called when a socket disconnects. During a running game the player is kept
	// in a "disconnected" state for a grace period so they can reconnect and
	// resume; outside of a running game they are removed immediately
	markDisconnected(socketId: string): DisconnectUpdate[] {
		const updates: DisconnectUpdate[] = [];

		for (const room of this.rooms.values()) {
			const player = [...room.players.values()].find((candidate) => candidate.socketId === socketId);
			if (!player) continue;

			const roomId = room.roomId;

			// No live game to resume — drop the player straight away.
			if (room.status !== 'in-progress') {
				const result = this.leaveRoom(roomId, player.playerId);
				updates.push({
					roomId,
					closed: result.status === 'room-closed',
					snapshot: result.snapshot,
				});
				continue;
			}

			player.connected = false;
			player.socketId = null;
			player.graceEndsAt = Date.now() + RECONNECT_GRACE_MS;
			if (player.disconnectTimer) clearTimeout(player.disconnectTimer);
			const playerId = player.playerId;
			player.disconnectTimer = setTimeout(
				() => this.expirePlayer(roomId, playerId),
				RECONNECT_GRACE_MS,
			);

			updates.push({
				roomId,
				closed: false,
				snapshot: this.getRoomSnapshot(roomId),
			});
		}

		return updates;
	}

	// Grace period elapsed without a reconnect: remove the player for good.
	private expirePlayer(roomId: string, playerId: string) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		const player = room.players.get(playerId);
		if (!player || player.connected) return; // reconnected in the meantime

		this.leaveRoom(roomId, playerId);
	}

	getRoomSnapshot(roomId: string) {
		const room = this.rooms.get(roomId);
		if (!room) return null;

		return {
			roomId: room.roomId,
			hostId: room.hostId,
			status: room.status,
			players: Array.from(room.players.values()).map((player) => ({
				clientId: player.playerId,
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

		if (room.revealEndsAt !== null) return null;

		const currentQuestion = room.questions[room.currentQuestionIndex];
		if (!currentQuestion) return null;

		// Players who never answered this question lose their streak.
		for (const player of room.players.values()) {
			if (!room.answeredPlayerIds.has(player.playerId)) {
				player.streak = 0;
			}
		}

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

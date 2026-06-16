import { Injectable } from "@nestjs/common";
import questionsData from "./questions.json";

// Les questions sont stockées avec leur texte et leurs options traduits dans chaque langue
// supportée. Le client reçoit toutes les langues et choisit librement laquelle afficher
type QuizLocale = "fr" | "en" | "de";
type LocalizedText = Record<QuizLocale, string>;
type LocalizedOptions = Record<QuizLocale, string[]>;

interface QuestionInternal {
  id: number;
  text: LocalizedText;
  options: LocalizedOptions;
  correctIndex: number;
  score: number;
}

interface QuestionPublic {
  id: number;
  text: LocalizedText;
  options: LocalizedOptions;
}

const ALL_QUESTIONS: QuestionInternal[] = questionsData;
const QUESTIONS_PER_GAME = 15;
const QUESTION_TIME_LIMIT_MS = 30_000;
// Limite stricte du nombre de salles simultanées pour empêcher un client de
// saturer la mémoire en inondant `quiz:join` de codes de salle uniques
const MAX_CONCURRENT_ROOMS = 500;

const REVEAL_TIME_MS = 5_000;
// Durée de conservation de l'état d'un joueur déconnecté pour qu'il puisse se reconnecter et
// reprendre une partie en cours. Passé ce délai, son état est supprimé de la salle
const RECONNECT_GRACE_MS = 60_000;

// Paliers de vitesse : répondre correctement plus vite rapporte plus de points de base
const SPEED_TIERS: { withinMs: number; points: number }[] = [
	{ withinMs: 3_000, points: 3 },
	{ withinMs: 7_000, points: 2 },
];
// Si la réponse prend plus de 7 secondes, 1 point est attribué
const SPEED_SLOW_POINTS = 1;
// Série de combo maximale possible
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

function pickRandomQuestions(
  questions: QuestionInternal[],
  count: number,
): QuestionInternal[] {
  const shuffled = [...questions].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

type GameStatus = "waiting" | "in-progress" | "finished";

interface QuizPlayer {
	// Identité stable (JWT `sub`) qui survit aux reconnexions du socket
	playerId: string;
	// Id du socket actif actuel, ou null tant que le joueur est déconnecté
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
	// Identité de l'hôte (playerId stable, pas un id de socket)
	hostId: string;
	status: GameStatus;
	// Indexé par playerId stable
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
  nextQuestionSnapshot: ReturnType<QuizRealtimeService["getQuestionSnapshot"]>;
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

// Une entrée par salle dont le socket en déconnexion faisait partie
interface DisconnectUpdate {
	roomId: string;
	// La salle a été vidée et supprimée suite à la déconnexion
	closed: boolean;
	snapshot: RoomSnapshot | null;
	// Défini quand la déconnexion fait que tous les joueurs connectés restants ont "répondu",
	// pour que la question soit révélée immédiatement
	revealPayload: QuestionRevealPayload | null;
}

interface PlayerExpiredPayload {
	roomId: string;
	result: LeaveRoomResult;
	revealPayload: QuestionRevealPayload | null;
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
	revealPayload?: QuestionRevealPayload | null;
};

type LeaveRoomResult =
  | { status: "left"; snapshot: RoomSnapshot }
  | { status: "room-closed"; snapshot: null }
  | { status: "room-not-found" | "not-in-room"; snapshot: RoomSnapshot | null };

@Injectable()
export class QuizRealtimeService {
  private readonly rooms = new Map<string, QuizRoom>();
  private onQuestionTimedOut?: (payload: TimeoutAdvancePayload) => void;
  private onQuestionRevealed?: (payload: QuestionRevealPayload) => void;
  private onPlayerExpired?: (payload: PlayerExpiredPayload) => void;

  createPongMessage(payload: string | undefined, clientId: string) {
    return {
      message: payload || "pong",
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

		// Reconnexion : le joueur est déjà membre (peut-être en pleine partie). On rattache
		// le nouveau socket et on annule toute suppression de période de grâce en attente
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

			let revealPayload: QuestionRevealPayload | null = null;
			if (
				room.status === 'in-progress' &&
				room.revealEndsAt === null &&
				this.allConnectedAnswered(room)
			) {
				revealPayload = this.enterRevealPhase(room);
			}

			return {
				status: 'reconnected',
				snapshot: this.getRoomSnapshot(roomId),
				revealPayload,
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
        status: "room-is-full",
        snapshot: this.getRoomSnapshot(roomId),
      };
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
      status: "joined",
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
      this.clearAllDisconnectTimers(room);
      this.rooms.delete(roomId);
      return { status: "room-closed", snapshot: null };
    }

		if (room.hostId === playerId) {
			// On préfère un joueur encore connecté comme nouvel hôte
			const nextHost =
				[...room.players.values()].find((candidate) => candidate.connected) ??
				(room.players.values().next().value as QuizPlayer | undefined);
			if (nextHost) {
				room.hostId = nextHost.playerId;
			}
		}

    return {
      status: "left",
      snapshot: this.getRoomSnapshot(roomId),
    };
  }

	// Renvoie la salle dans laquelle ce compte est actuellement EN LIGNE (connecté sur un
	// socket autre que `exceptSocketId`), ou null. Sert à refuser un deuxième onglet ou une
	// deuxième salle tant que le compte est encore activement dans une. Une présence laissée
	// dans un état de grâce "déconnecté" ne compte pas, donc se reconnecter
	// après une vraie coupure reste autorisé
	getActiveRoomId(playerId: string, exceptSocketId: string): string | null {
		for (const room of this.rooms.values()) {
			const player = room.players.get(playerId);
			if (player && player.connected && player.socketId !== exceptSocketId) {
				return room.roomId;
			}
		}
		return null;
	}

	// Impose une seule salle par compte : retire complètement ce joueur de toutes les salles
	// sauf `keepRoomId`. Renvoie les résultats de sortie pour que la gateway puisse rafraîchir
	// les salles dont le joueur a été retiré
	evictFromOtherRooms(
		playerId: string,
		keepRoomId: string,
	): Array<{ roomId: string; result: LeaveRoomResult }> {
		const evictions: Array<{ roomId: string; result: LeaveRoomResult }> = [];

		for (const otherRoomId of [...this.rooms.keys()]) {
			if (otherRoomId === keepRoomId) continue;
			const room = this.rooms.get(otherRoomId);
			if (!room || !room.players.has(playerId)) continue;

			const result = this.leaveRoom(otherRoomId, playerId);
			evictions.push({ roomId: otherRoomId, result });
		}

		return evictions;
	}

	startGame(roomId: string, playerId: string): StartGameResult {
		const room = this.rooms.get(roomId);
		if (!room) return { status: 'room-not-found', snapshot: null };
		if (room.hostId !== playerId) return { status: 'not-host', snapshot: null };

		// Empêche un hôte de relancer une partie en pleine partie
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

    return { status: "started", snapshot: this.getRoomSnapshot(roomId) };
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

    if (room.status !== "in-progress") {
      return {
        status: "no-active-question",
        roomSnapshot: this.getRoomSnapshot(roomId),
        answerResult: null,
      };
    }

    if (room.revealEndsAt !== null) {
      return {
        status: "no-active-question",
        roomSnapshot: this.getRoomSnapshot(roomId),
        answerResult: null,
      };
    }

    const currentQuestion = room.questions[room.currentQuestionIndex];
    if (!currentQuestion) {
      return {
        status: "no-active-question",
        roomSnapshot: this.getRoomSnapshot(roomId),
        answerResult: null,
      };
    }

    if (currentQuestion.id !== questionId) {
      return {
        status: "question-mismatch",
        roomSnapshot: this.getRoomSnapshot(roomId),
        answerResult: null,
      };
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

    // Les joueurs déconnectés sont ignorés : seuls les joueurs connectés ont besoin
    // d'avoir répondu pour que la question avance
    let revealPayload: QuestionRevealPayload | null = null;
    if (this.allConnectedAnswered(room)) {
      revealPayload = this.enterRevealPhase(room);
    }

		return {
			status: 'accepted',
			roomSnapshot: this.getRoomSnapshot(roomId),
			answerResult: { roomId, playerId, questionId, isCorrect, basePoints, multiplier, pointsEarned, streak: player.streak },
			revealPayload,
		};
	}

	private allConnectedAnswered(room: QuizRoom): boolean {
		const connected = [...room.players.values()].filter((player) => player.connected);
		if (connected.length === 0) return false;
		return connected.every((player) => room.answeredPlayerIds.has(player.playerId));
	}

  setOnQuestionTimedOut(
    handler: ((payload: TimeoutAdvancePayload) => void) | undefined,
  ) {
    this.onQuestionTimedOut = handler;
  }

  setOnQuestionRevealed(
    handler: ((payload: QuestionRevealPayload) => void) | undefined,
  ) {
    this.onQuestionRevealed = handler;
  }

  setOnPlayerExpired(
    handler: ((payload: PlayerExpiredPayload) => void) | undefined,
  ) {
    this.onPlayerExpired = handler;
  }

	// Appelé quand un socket se déconnecte. Pendant une partie en cours, le joueur est gardé
	// dans un état "déconnecté" pendant une période de grâce pour qu'il puisse se reconnecter et
	// reprendre ; en dehors d'une partie en cours, il est retiré immédiatement
	markDisconnected(socketId: string): DisconnectUpdate[] {
		const updates: DisconnectUpdate[] = [];

		for (const room of this.rooms.values()) {
			const player = [...room.players.values()].find((candidate) => candidate.socketId === socketId);
			if (!player) continue;

			const roomId = room.roomId;

			// Aucune partie en cours à reprendre — on retire le joueur tout de suite
			if (room.status !== 'in-progress') {
				const result = this.leaveRoom(roomId, player.playerId);
				updates.push({
					roomId,
					closed: result.status === 'room-closed',
					snapshot: result.snapshot,
					revealPayload: null,
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

			// Maintenant que ce joueur ne compte plus, les joueurs connectés restants
			// ont peut-être déjà tous répondu — on révèle immédiatement pour que personne n'attende
			let revealPayload: QuestionRevealPayload | null = null;
			if (room.revealEndsAt === null && this.allConnectedAnswered(room)) {
				revealPayload = this.enterRevealPhase(room);
			}

			updates.push({
				roomId,
				closed: false,
				snapshot: this.getRoomSnapshot(roomId),
				revealPayload,
			});
		}

		return updates;
	}

	// La période de grâce s'est écoulée sans reconnexion : on retire le joueur définitivement
	private expirePlayer(roomId: string, playerId: string) {
		const room = this.rooms.get(roomId);
		if (!room) return;

		const player = room.players.get(playerId);
		if (!player || player.connected) return; // reconnecté entre-temps

		const result = this.leaveRoom(roomId, playerId);

		// Les retirer peut compléter la question en cours pour tous ceux encore présents
		let revealPayload: QuestionRevealPayload | null = null;
		const remaining = this.rooms.get(roomId);
		if (
			remaining &&
			remaining.status === 'in-progress' &&
			remaining.revealEndsAt === null &&
			this.allConnectedAnswered(remaining)
		) {
			revealPayload = this.enterRevealPhase(remaining);
		}

		this.onPlayerExpired?.({ roomId, result, revealPayload });
	}

	private clearAllDisconnectTimers(room: QuizRoom) {
		for (const player of room.players.values()) {
			if (player.disconnectTimer) {
				clearTimeout(player.disconnectTimer);
				player.disconnectTimer = null;
			}
		}
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
				connected: player.connected,
			})),
		};
	}

  // Vue par joueur de la question en cours, utilisée pour restaurer l'état d'UI
  // "déjà répondu" d'un joueur qui se reconnecte
  getPlayerAnswerState(roomId: string, playerId: string) {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const currentQuestion = room.questions[room.currentQuestionIndex];
    return {
      questionId: currentQuestion?.id ?? null,
      hasAnswered: room.answeredPlayerIds.has(playerId),
      selectedIndex: room.selectedAnswerByPlayerId.get(playerId) ?? null,
    };
  }

  // Données de révélation de la question en cours de révélation, le cas échéant. Sert à
  // mettre à jour un joueur qui se reconnecte jusqu'à la phase de révélation
  getRevealSnapshot(roomId: string): QuestionRevealPayload | null {
    const room = this.rooms.get(roomId);
    if (!room || room.revealEndsAt === null) return null;

    const currentQuestion = room.questions[room.currentQuestionIndex];
    if (!currentQuestion) return null;

    return {
      roomId: room.roomId,
      questionId: currentQuestion.id,
      correctIndex: currentQuestion.correctIndex,
      answerStatistics: this.getAnswerStatistics(
        room,
		this.getSafeOptionCount(room, currentQuestion),
      ),
      roomSnapshot: this.getRoomSnapshot(room.roomId),
      revealEndsAt: room.revealEndsAt,
      revealDurationMs: REVEAL_TIME_MS,
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
    if (!currentQuestion || room.status !== "in-progress") {
      return;
    }

    room.questionEndsAt = Date.now() + QUESTION_TIME_LIMIT_MS;
    room.questionTimer = setTimeout(() => {
      const targetRoom = this.rooms.get(room.roomId);
      if (!targetRoom || targetRoom.status !== "in-progress") {
        return;
      }

      const revealPayload = this.enterRevealPhase(targetRoom);
      if (revealPayload && this.onQuestionRevealed) {
        this.onQuestionRevealed(revealPayload);
      }
    }, QUESTION_TIME_LIMIT_MS);
  }

  private enterRevealPhase(room: QuizRoom): QuestionRevealPayload | null {
    if (room.status !== "in-progress") return null;

		if (room.revealEndsAt !== null) return null;

		const currentQuestion = room.questions[room.currentQuestionIndex];
		if (!currentQuestion) return null;

		// Les joueurs qui n'ont jamais répondu à cette question perdent leur série
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
      answerStatistics: this.getAnswerStatistics(
        room,
		this.getSafeOptionCount(room, currentQuestion),
      ),
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
      room.status = "finished";
      this.clearAllDisconnectTimers(room);
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

	private getSafeOptionCount(room: QuizRoom, question: QuestionInternal): number {
		const localeLengths = Object.values(question.options).map(
			(options) => options.length,
		);
		const maxLocaleLength = localeLengths.length > 0 ? Math.max(...localeLengths) : 0;	
		// Sécurise aussi les statistiques si des indices déjà soumis dépassent la taille
		// d'une locale, ou si correctIndex pointe au-delà
		const maxSelectedIndex = Array.from(room.selectedAnswerByPlayerId.values()).reduce(
			(max, selectedIndex) => Math.max(max, selectedIndex),
			-1,
		);	
		return Math.max(maxLocaleLength, question.correctIndex + 1, maxSelectedIndex + 1, 0);
	}

  private getAnswerStatistics(
    room: QuizRoom,
    optionCount: number,
  ): AnswerStatistic[] {
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
      percentage:
        totalAnswers > 0 ? Math.round((count / totalAnswers) * 100) : 0,
    }));
  }
}

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
		options: ['2','3','1','-42'],
		correctIndex: 0,
	},
]


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
	answeredPlayerIds: Map<string, boolean>;
	startedAt: number | null;
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

type RoomSnapshot = ReturnType<QuizRealtimeService['getRoomSnapshot']>;

type JoinRoomResult = {
	status: 'joined' | 'already-joined';
	snapshot: RoomSnapshot;
};

type LeaveRoomResult =
	| {
		status: 'left';
		snapshot: RoomSnapshot;
	  }
	| {
		status: 'room-closed';
		snapshot: null;
	  }
	| {
		status: 'room-not-found' | 'not-in-room';
		snapshot: RoomSnapshot | null;
	  };

@Injectable()
export class QuizRealtimeService {
	private readonly rooms = new Map<string, QuizRoom>();

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
				answeredPlayerIds: new Map<string, boolean>(),
				startedAt: null,
			};
			this.rooms.set(roomId, room);
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
			return {
				status: 'room-not-found',
				snapshot: null,
			};
		}

		if (!room.players.has(clientId)) {
			return {
				status: 'not-in-room',
				snapshot: this.getRoomSnapshot(roomId),
			};
		}

		room.players.delete(clientId);

		if (room.players.size === 0) {
			this.rooms.delete(roomId);
			return {
				status: 'room-closed',
				snapshot: null,
			};
		}

		if (room.hostId === clientId) {
			const nextHost = room.players.values().next().value as
				| QuizPlayer
				| undefined;
			if (nextHost) {
				room.hostId = nextHost.clientId;
			}
		}

		return {
			status: 'left',
			snapshot: this.getRoomSnapshot(roomId),
		};
	}

	startGame(roomId: string, clientId: string) {
    	const room = this.rooms.get(roomId);
    	if (!room) 
			throw new Error('Room not found');
    	if (room.hostId !== clientId) 
			throw new Error('Only host can start the game');

    	room.status = 'in-progress';
    	room.currentQuestionIndex = 0;
    	room.answeredPlayerIds.clear();
    	room.startedAt = Date.now();

    	return this.getRoomSnapshot(roomId);
	}

	submitAnswer({ roomId, clientId, questionId, selectedIndex }: SubmitAnswerInput): SubmitAnswerResult {
	    const room = this.rooms.get(roomId);
	    if (!room) {
	        return {
	        	status: 'room-not-found',
	        	roomSnapshot: null,
	        	answerResult: null,
	        };
	    }

	    const player = room.players.get(clientId);
	    if (!player) {
	        return {
	        	status: 'player-not-in-room',
	        	roomSnapshot: this.getRoomSnapshot(roomId),
	        	answerResult: null,
	        };
	    }

	    const currentQuestion = QUESTIONS[room.currentQuestionIndex];
	    if (!currentQuestion) {
	        return {
	        	status: 'no-active-question',
	        	roomSnapshot: this.getRoomSnapshot(roomId),
	        	answerResult: null,
	        };
	    }

	    if (currentQuestion.id !== questionId) {
	        return {
	        	status: 'question-mismatch',
	        	roomSnapshot: this.getRoomSnapshot(roomId),
	        	answerResult: null,
	        };
	    }

	    if (room.answeredPlayerIds.get(clientId)) {
	        return {
	        	status: 'already-answered',
	        	roomSnapshot: this.getRoomSnapshot(roomId),
	        	answerResult: null,
	        };
	    }

	    const isCorrect = selectedIndex === currentQuestion.correctIndex;
	    if (isCorrect) {
	        player.score += 1;
	    }

	    room.answeredPlayerIds.set(clientId, true);

	    return {
	    	status: 'accepted',
	        roomSnapshot: this.getRoomSnapshot(roomId),
	        answerResult: {
	            roomId,
	            playerId: clientId,
	            questionId,
	            isCorrect,
	        },
	    };
	}

	getQuestionForRoom(roomId: string) { 
		return this.getQuestionSnapshot(roomId);
	}

	removeClientFromAllRooms(clientId: string) {
		const updates: Array<{ roomId: string; result: LeaveRoomResult }> = [];

		for (const roomId of this.rooms.keys()) {
			const room = this.rooms.get(roomId);
			if (!room || !room.players.has(clientId)) {
				continue;
			}

			const result = this.leaveRoom(roomId, clientId);
			updates.push({ roomId, result });
		}

		return updates;
	}

	private getRoomSnapshot(roomId: string) {
		const room = this.rooms.get(roomId);
		if (!room) {
			return null;
		}

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

	private toPublicQuestion(q: QuestionInternal): QuestionPublic {
    	return { id: q.id, text: q.text, options: q.options };
	}

	private getQuestionSnapshot(roomId: string) {
    	const room = this.rooms.get(roomId);
    	if (!room) {
    	    return null;
    	}

    	const question = QUESTIONS[room.currentQuestionIndex];
    	if (!question) {
    	    return null;
    	}

    	return {
    	    roomId: room.roomId,
    	    question: this.toPublicQuestion(question),
    	    questionNumber: room.currentQuestionIndex + 1,
    	    totalQuestions: QUESTIONS.length,
    	};
	}
}
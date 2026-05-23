import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type QuestionPayload = {
  roomId: string;
  question: {
    id: number;
    text: string;
    options: string[];
  };
  questionNumber: number;
  totalQuestions: number;
  timeLimitMs: number;
  endsAt: number | null;
};

type AnswerResultPayload = {
  roomId: string;
  playerId: string;
  questionId: number;
  isCorrect: boolean;
  pointValue: number;
};

type RevealPayload = {
  roomId: string;
  questionId: number;
  correctIndex: number;
  answerStatistics: {
    index: number;
    count: number;
    percentage: number;
  }[];
  revealEndsAt: number;
  revealDurationMs: number;
};

export type Player = {
  clientId: string;
  name: string;
  score: number;
};

type RoomSnapshot = {
  roomId: string;
  hostId: string;
  status: string;
  players: Player[];
};

export type GamePhase = 'lobby' | 'playing' | 'over';

export type QuestionState = {
  question: QuestionPayload['question'];
  questionNumber: number;
  totalQuestions: number;
  timeLimitMs: number;
  endsAt: number;
  hasAnswered: boolean;
  selectedIndex: number | null;
  correctIndex: number | null;
  revealEndsAt: number | null;
  answerStatistics: RevealPayload['answerStatistics'];
  answerResult: string;
  lastAnswerCorrect: boolean | null;
  pointsEarned: number | null;
} | null;

function toSecureUrl(url: string): string {
  if (/localhost|127\.0\.0\.1/.test(url)) return url;
  return url.replace(/^http:\/\//, 'https://').replace(/^ws:\/\//, 'wss://');
}

const SOCKET_URL = toSecureUrl(
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:5000'
);

function resetRoomState(
  setJoinedRoom: (v: string | null) => void,
  setQuestionState: (v: QuestionState) => void,
  setTimeLeftMs: (v: number) => void,
  setGamePhase: (v: GamePhase) => void,
  setPlayers: (v: Player[]) => void,
  setFinalLeaderboard: (v: Player[] | null) => void,
  setIsHost: (v: boolean) => void,
) {
  setJoinedRoom(null);
  setQuestionState(null);
  setTimeLeftMs(0);
  setGamePhase('lobby');
  setPlayers([]);
  setFinalLeaderboard(null);
  setIsHost(false);
}

export function useQuizSocket(playerName: string | undefined) {
  const socketRef = useRef<Socket | null>(null);
  const [myClientId, setMyClientId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [reconnecting, setReconnecting] = useState(false);
  const [socketError, setSocketError] = useState('');
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby');
  const [questionState, setQuestionState] = useState<QuestionState>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [finalLeaderboard, setFinalLeaderboard] = useState<Player[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    function connectSocket() {
      const socket = io(SOCKET_URL, {
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 5000,
      });

      if (cancelled) {
        socket.disconnect();
        return;
      }

      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        if (socket.id) setMyClientId(socket.id);
        setSocketError('');
      });

      socket.on('disconnect', () => setConnected(false));

      socket.on('connect_error', () => {
        setConnected(false);
        setSocketError('Impossible de se connecter au serveur.');
      });

      socket.io.on('reconnect_attempt', () => {
        setReconnecting(true);
      });

      socket.io.on('reconnect', () => {
        setConnected(true);
        setReconnecting(false);
        if (socket.id) setMyClientId(socket.id);
        resetRoomState(setJoinedRoom, setQuestionState, setTimeLeftMs, setGamePhase, setPlayers, setFinalLeaderboard, setIsHost);
        setSocketError('Connexion rétablie. Veuillez rejoindre la salle.');
      });

      socket.io.on('reconnect_failed', () => {
        setReconnecting(false);
        setSocketError('Impossible de se reconnecter. Veuillez recharger la page.');
        resetRoomState(setJoinedRoom, setQuestionState, setTimeLeftMs, setGamePhase, setPlayers, setFinalLeaderboard, setIsHost);
      });

      socket.on('quiz:left', () => {
        resetRoomState(setJoinedRoom, setQuestionState, setTimeLeftMs, setGamePhase, setPlayers, setFinalLeaderboard, setIsHost);
      });

      socket.on('quiz:joined', (data: { roomId: string; hostId: string }) => {
        setJoinedRoom(data.roomId);
        setSocketError('');
        setIsHost(data.hostId === socket.id);
      });

      socket.on('quiz:game:started', () => setGamePhase('playing'));

      socket.on('quiz:score:update', (data: RoomSnapshot) => {
        if (data?.players) setPlayers(data.players);
      });

      socket.on('quiz:question', (data: QuestionPayload) => {
        const endsAt = data.endsAt ?? Date.now() + data.timeLimitMs;
        setQuestionState({
          question: data.question,
          questionNumber: data.questionNumber,
          totalQuestions: data.totalQuestions,
          timeLimitMs: data.timeLimitMs,
          endsAt,
          hasAnswered: false,
          selectedIndex: null,
          correctIndex: null,
          revealEndsAt: null,
          answerStatistics: [],
          answerResult: '',
          lastAnswerCorrect: null,
          pointsEarned: null,
        });
        setTimeLeftMs(Math.max(0, endsAt - Date.now()));
      });

      socket.on('quiz:question:reveal', (data: RevealPayload) => {
        setQuestionState((prev) =>
          prev && prev.question.id === data.questionId
            ? { ...prev, correctIndex: data.correctIndex, revealEndsAt: data.revealEndsAt, answerStatistics: data.answerStatistics }
            : prev
        );
      });

      socket.on('quiz:game:over', (data: RoomSnapshot) => {
        const sorted = [...(data?.players ?? [])].sort((a, b) => b.score - a.score);
        setFinalLeaderboard(sorted);
        setQuestionState(null);
        setTimeLeftMs(0);
        setGamePhase('over');
      });

      socket.on('quiz:answer:result', (data: AnswerResultPayload) => {
        setQuestionState((prev) =>
          prev
            ? {
                ...prev,
                answerResult: data.isCorrect ? 'Bonne réponse !' : 'Mauvaise réponse.',
                lastAnswerCorrect: data.isCorrect,
                pointsEarned: data.isCorrect ? data.pointValue : 0,
              }
            : prev
        );
      });

      socket.on('quiz:join:ignored', (data: { reason: string }) => {
        if (data.reason === 'quiz-already-started') setSocketError('Le quiz a déjà commencé.');
        else if (data.reason === 'room-is-full') setSocketError('Cette salle est pleine.');
        else setSocketError('Impossible de rejoindre la salle.');
      });

      socket.on('quiz:room:update', (data: RoomSnapshot) => {
        if (data?.hostId !== undefined) setIsHost(data.hostId === socket.id);
        if (data?.players) setPlayers(data.players);
      });
    }

    connectSocket();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Timer countdown
  const revealEndsAt = questionState?.revealEndsAt ?? null;
  const endsAt = questionState?.endsAt ?? null;
  const activeDeadline = revealEndsAt ?? endsAt;

  useEffect(() => {
    if (!activeDeadline || gamePhase !== 'playing') {
      setTimeLeftMs(0);
      return;
    }
    const tick = () => setTimeLeftMs(Math.max(0, activeDeadline - Date.now()));
    tick();
    const id = window.setInterval(tick, 200);
    return () => window.clearInterval(id);
  }, [activeDeadline, gamePhase]);

  function joinRoom(roomCode: string) {
    if (!connected) { setSocketError('Socket non connecté.'); return; }
    const trimmed = roomCode.trim();
    if (!trimmed || trimmed.length < 3 || trimmed.length > 10) {
      setSocketError('Le code doit faire entre 3 et 10 caractères.');
      return;
    }
    socketRef.current?.emit('quiz:join', { roomId: trimmed, playerName: playerName || undefined });
  }

  function leaveRoom() {
    if (!joinedRoom) return;
    socketRef.current?.emit('quiz:leave', { roomId: joinedRoom });
    resetRoomState(setJoinedRoom, setQuestionState, setTimeLeftMs, setGamePhase, setPlayers, setFinalLeaderboard, setIsHost);
  }

  function startGame() {
    if (!joinedRoom) return;
    if (!connected) { setSocketError('Socket non connecté.'); return; }
    socketRef.current?.emit('quiz:start', { roomId: joinedRoom });
  }

  function submitAnswer(selectedIndex: number) {
    if (!joinedRoom || !questionState) return;
    if (questionState.hasAnswered || timeLeftMs <= 0 || questionState.revealEndsAt !== null) return;
    socketRef.current?.emit('quiz:answer', {
      roomId: joinedRoom,
      questionId: questionState.question.id,
      selectedIndex,
    });
    setQuestionState((prev) => prev ? { ...prev, hasAnswered: true, selectedIndex } : prev);
  }

  return {
    connected,
    reconnecting,
    socketError,
    myClientId,
    isHost,
    joinedRoom,
    gamePhase,
    questionState,
    timeLeftMs,
    players,
    finalLeaderboard,
    joinRoom,
    leaveRoom,
    startGame,
    submitAnswer,
  };
}

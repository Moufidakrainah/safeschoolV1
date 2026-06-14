import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Chaque question arrive traduite dans toutes les langues supportées ; le client choisit
// librement laquelle afficher selon la langue active (voir QuizPlaying)
export type QuizLocale = 'fr' | 'en' | 'de';
export type LocalizedText = Record<QuizLocale, string>;
export type LocalizedOptions = Record<QuizLocale, string[]>;

type QuestionPayload = {
  roomId: string;
  question: {
    id: number;
    text: LocalizedText;
    options: LocalizedOptions;
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
  basePoints: number;
  multiplier: number;
  pointsEarned: number;
  streak: number;
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
  connected?: boolean;
};

type RoomSnapshot = {
  roomId: string;
  hostId: string;
  status: string;
  players: Player[];
};

// Durée pendant laquelle on continue d'essayer de rejoindre une partie en cours après avoir perdu le socket
// Reflète la fenêtre de grâce de reconnexion du backend
const RECONNECT_WINDOW_MS = 60_000;

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
  basePoints: number | null;
  multiplier: number | null;
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

export function useQuizSocket(playerName: string | undefined, selfId: string | undefined) {
  const socketRef = useRef<Socket | null>(null);
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
  const [myStreak, setMyStreak] = useState(0);
  const nextStreakRef = useRef(0);

  // "Moi" est désormais l'id utilisateur stable (correspond à l'identité du joueur côté backend), donc
  // il survit aux reconnexions du socket où socket.id aurait changé
  const myClientId = selfId ?? null;
  const selfIdRef = useRef<string | undefined>(selfId);
  selfIdRef.current = selfId;

  // Maintenu synchronisé avec l'état pour que les handlers du socket (créés une seule fois) puissent lire la
  // salle/le nom actuels afin de rejoindre automatiquement après une reconnexion
  const joinedRoomRef = useRef<string | null>(null);
  const playerNameRef = useRef<string | undefined>(playerName);
  playerNameRef.current = playerName;
  const gamePhaseRef = useRef<GamePhase>('lobby');
  gamePhaseRef.current = gamePhase;

  useEffect(() => {
    joinedRoomRef.current = joinedRoom;
  }, [joinedRoom]);

  useEffect(() => {
    let cancelled = false;
    let giveUpTimer: number | null = null;

    function clearGiveUpTimer() {
      if (giveUpTimer !== null) {
        window.clearTimeout(giveUpTimer);
        giveUpTimer = null;
      }
    }

    function connectSocket() {
      const socket = io(SOCKET_URL, {
        transports: ['polling', 'websocket'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        timeout: 5000,
        auth: { token: localStorage.getItem('token') ?? '' },
      });

      if (cancelled) {
        socket.disconnect();
        return;
      }

      socketRef.current = socket;

      socket.on('connect', () => {
        clearGiveUpTimer();
        setConnected(true);
        setReconnecting(false);
        setSocketError('');
        // Si on était dans une salle, on la rejoint de façon transparente. Le backend nous reconnaît
        // via notre id stable et restaure la partie en cours (dans sa fenêtre de
        // grâce) ; sinon c'est simplement un nouveau join sans conséquence
        if (joinedRoomRef.current) {
          socket.emit('quiz:join', {
            roomId: joinedRoomRef.current,
            playerName: playerNameRef.current || undefined,
          });
        }
      });

      socket.on('disconnect', (reason) => {
        setConnected(false);
        // Déconnexion intentionnelle (on quitte / démontage) : pas de fenêtre de reconnexion
        if (reason === 'io client disconnect') return;
        // Démarre la fenêtre de reconnexion d'1 minute. Si on n'est toujours pas connecté
        // à son expiration, on arrête d'essayer et on retire le joueur de la partie
        if (giveUpTimer === null) {
          giveUpTimer = window.setTimeout(() => {
            giveUpTimer = null;
            socket.disconnect();
            setReconnecting(false);
            setSocketError('Reconnexion impossible. Veuillez recharger la page.');
            resetRoomState(setJoinedRoom, setQuestionState, setTimeLeftMs, setGamePhase, setPlayers, setFinalLeaderboard, setIsHost);
          }, RECONNECT_WINDOW_MS);
        }
      });

      socket.on('connect_error', () => {
        setConnected(false);
        setSocketError('Impossible de se connecter au serveur.');
      });

      socket.on('quiz:unauthorized', () => {
        clearGiveUpTimer();
        setConnected(false);
        setSocketError('Vous devez être connecté pour accéder au quiz.');
        socket.disconnect();
        resetRoomState(setJoinedRoom, setQuestionState, setTimeLeftMs, setGamePhase, setPlayers, setFinalLeaderboard, setIsHost);
      });

      socket.io.on('reconnect_attempt', () => {
        setReconnecting(true);
      });

      socket.on('quiz:left', () => {
        resetRoomState(setJoinedRoom, setQuestionState, setTimeLeftMs, setGamePhase, setPlayers, setFinalLeaderboard, setIsHost);
      });

      socket.on('quiz:joined', (data: { roomId: string; hostId: string; status?: string; selfId?: string }) => {
        setJoinedRoom(data.roomId);
        setSocketError('');
        setIsHost(data.hostId === (data.selfId ?? selfIdRef.current));

        if (data.status === 'waiting' && gamePhaseRef.current === 'playing') {
          setGamePhase('lobby');
          setQuestionState(null);
          setTimeLeftMs(0);
          setFinalLeaderboard(null);
          setSocketError('La partie a été interrompue pendant la déconnexion.');
        }
      });

      socket.on('quiz:game:started', () => {
        setMyStreak(0);
        nextStreakRef.current = 0;
        setGamePhase('playing');
      });

      socket.on('quiz:score:update', (data: RoomSnapshot) => {
        if (data?.players) setPlayers(data.players);
      });

      socket.on('quiz:question', (data: QuestionPayload) => {
        const endsAt = data.endsAt ?? Date.now() + data.timeLimitMs;
        // Recevoir une question implique que la partie tourne — ça restaure aussi
        // la phase de jeu pour un client qui s'est reconnecté en pleine partie
        setGamePhase('playing');
        setFinalLeaderboard(null);
        setQuestionState((prev) => {
          // Valide la série de la question qui vient de se terminer, maintenant qu'on a
          // dépassé sa révélation — une bonne réponse la conserve, tout le reste la remet à zéro
          if (prev) setMyStreak(prev.hasAnswered ? nextStreakRef.current : 0);
          return {
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
            basePoints: null,
            multiplier: null,
          };
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

      // Envoyé uniquement à un client qui se reconnecte pour restaurer la réponse qu'il avait déjà
      // envoyée à la question en cours avant de se déconnecter
      socket.on('quiz:answer:restore', (data: { questionId: number; selectedIndex: number | null; hasAnswered: boolean }) => {
        setQuestionState((prev) =>
          prev && prev.question.id === data.questionId
            ? { ...prev, hasAnswered: data.hasAnswered, selectedIndex: data.selectedIndex }
            : prev
        );
      });

      socket.on('quiz:answer:result', (data: AnswerResultPayload) => {
        nextStreakRef.current = data.streak;
        setQuestionState((prev) =>
          prev
            ? {
                ...prev,
                answerResult: data.isCorrect ? 'Bonne réponse !' : 'Mauvaise réponse.',
                lastAnswerCorrect: data.isCorrect,
                pointsEarned: data.pointsEarned,
                basePoints: data.basePoints,
                multiplier: data.multiplier,
              }
            : prev
        );
      });

      socket.on('quiz:join:ignored', (data: { reason: string }) => {
        if (data.reason === 'quiz-already-started') setSocketError('Le quiz a déjà commencé.');
        else if (data.reason === 'room-is-full') setSocketError('Cette salle est pleine.');
        else if (data.reason === 'already-in-room') setSocketError('Vous êtes déjà connecté à une salle dans un autre onglet ou une autre fenêtre. Quittez-la avant d\'en rejoindre une autre.');
        else setSocketError('Impossible de rejoindre la salle.');
      });

      socket.on('quiz:room:update', (data: RoomSnapshot) => {
        if (data?.hostId !== undefined) setIsHost(data.hostId === selfIdRef.current);
        if (data?.players) setPlayers(data.players);
      });

      socket.on('quiz:room:closed', () => {
        setSocketError('La salle a été fermée.');
        resetRoomState(setJoinedRoom, setQuestionState, setTimeLeftMs, setGamePhase, setPlayers, setFinalLeaderboard, setIsHost);
      });
    }

    connectSocket();

    const handleOffline = () => {
      setConnected(false);
      setReconnecting(true);
      socketRef.current?.io.engine?.close();
    };

    const handleOnline = () => {
      const socket = socketRef.current;
      if (socket && !socket.connected && socket.active) socket.io.open();
    };
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      cancelled = true;
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      clearGiveUpTimer();
      if (joinedRoomRef.current) {
        socketRef.current?.emit('quiz:leave', { roomId: joinedRoomRef.current });
      }
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Décompte du minuteur
  const revealEndsAt = questionState?.revealEndsAt ?? null;
  const endsAt = questionState?.endsAt ?? null;
  const activeDeadline = revealEndsAt ?? endsAt;

  useEffect(() => {
    if (!activeDeadline || gamePhase !== 'playing') {
      const id = window.setTimeout(() => setTimeLeftMs(0), 0);
      return () => window.clearTimeout(id);
    }
    const tick = () => setTimeLeftMs(Math.max(0, activeDeadline - Date.now()));
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
    myStreak,
    joinRoom,
    leaveRoom,
    startGame,
    submitAnswer,
  };
}

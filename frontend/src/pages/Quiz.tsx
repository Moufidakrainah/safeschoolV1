import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import ReporterHeader from '../components/layout/ReporterHeader/ReporterHeader';

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

type Player = {
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

type GamePhase = 'lobby' | 'playing' | 'over';

type QuestionState = {
  question: QuestionPayload['question'];
  questionNumber: number;
  totalQuestions: number;
  endsAt: number | null;
  hasAnswered: boolean;
  selectedIndex: number | null;
  correctIndex: number | null;
  revealEndsAt: number | null;
  answerStatistics: RevealPayload['answerStatistics'];
  answerResult: string;
  pointsEarned: number | null;
} | null;

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:5000';

const RANK_STYLES: Record<number, string> = {
  1: 'bg-amber-400 text-white',
  2: 'bg-gray-300 text-gray-700',
  3: 'bg-orange-500 text-white',
};

export default function Quiz() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [viewSection, setViewSection] = useState<'profile' | 'report' | 'quiz'>('quiz');

  useEffect(() => {
    if (viewSection === 'profile') navigate('/reporter?section=profile');
    if (viewSection === 'report') navigate('/reporter?section=report');
  }, [viewSection, navigate]);

  const socketRef = useRef<Socket | null>(null);
  const [myClientId, setMyClientId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [socketError, setSocketError] = useState<string>('');
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby');
  const [questionState, setQuestionState] = useState<QuestionState>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [players, setPlayers] = useState<Player[]>([]);
  const [finalLeaderboard, setFinalLeaderboard] = useState<Player[] | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function connectSocket() {
      const socketProbeUrl = `${SOCKET_URL.replace(/\/$/, '')}/socket.io/?EIO=4&transport=polling&t=${Date.now()}`;

      try {
        const response = await fetch(socketProbeUrl);
        if (!response.ok) throw new Error('Quiz server is unavailable.');
      } catch {
        if (!cancelled) {
          setConnected(false);
          setSocketError('Quiz server is unavailable.');
        }
        return;
      }

      if (cancelled) return;

      const socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: false,
        timeout: 5000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        setMyClientId(socket.id ?? null);
        setSocketError('');
      });

      socket.on('disconnect', () => setConnected(false));

      socket.on('connect_error', (error) => {
        setConnected(false);
        setSocketError(error.message);
      });

      socket.on('quiz:left', () => {
        setRoomCode('');
        setJoinedRoom(null);
        setQuestionState(null);
        setTimeLeftMs(0);
        setGamePhase('lobby');
        setPlayers([]);
        setFinalLeaderboard(null);
      });

      socket.on('quiz:joined', (data: { roomId: string; hostId: string }) => {
        setJoinedRoom(data.roomId);
        setSocketError('');
        setIsHost(data.hostId === socket.id);
      });

      socket.on('quiz:game:started', () => {
        setGamePhase('playing');
      });

      socket.on('quiz:score:update', (data: RoomSnapshot) => {
        if (data?.players) setPlayers(data.players);
      });

      socket.on('quiz:question', (data: QuestionPayload) => {
        setQuestionState({
          question: data.question,
          questionNumber: data.questionNumber,
          totalQuestions: data.totalQuestions,
          endsAt: data.endsAt,
          hasAnswered: false,
          selectedIndex: null,
          correctIndex: null,
          revealEndsAt: null,
          answerStatistics: [],
          answerResult: '',
          pointsEarned: null,
        });
        setTimeLeftMs(data.endsAt ? Math.max(0, data.endsAt - Date.now()) : data.timeLimitMs);
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
                pointsEarned: data.isCorrect ? data.pointValue : 0,
              }
            : prev
        );
      });

      socket.on('quiz:join:ignored', (data) => {
        if (data.reason === 'quiz-already-started') setSocketError('Le quiz a déjà commencé.');
        else if (data.reason === 'room-is-full') setSocketError('Cette salle est pleine.');
      });

      socket.on('quiz:room:update', (data: RoomSnapshot) => {
        if (data?.hostId === socket.id) setIsHost(true);
        if (data?.players) setPlayers(data.players);
      });
    }

    void connectSocket();

    return () => {
      cancelled = true;
      socketRef.current?.disconnect();
      socketRef.current = null;
    };
  }, []);

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
    const intervalId = window.setInterval(tick, 200);
    return () => window.clearInterval(intervalId);
  }, [activeDeadline, gamePhase]);

  function handleJoinRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = roomCode.trim();
    if (!connected) { setSocketError('Socket non connecté.'); return; }
    if (!trimmed || trimmed.length < 3 || trimmed.length > 10) {
      setSocketError('Le code doit faire entre 3 et 10 caractères.');
      return;
    }
    socketRef.current?.emit('quiz:join', { roomId: trimmed, playerName: user?.firstName || undefined });
  }

  function handleLeaveRoom() {
    if (gamePhase === 'over') {
      setRoomCode('');
      setJoinedRoom(null);
      setQuestionState(null);
      setTimeLeftMs(0);
      setGamePhase('lobby');
      setPlayers([]);
      setFinalLeaderboard(null);
      return;
    }
    if (!joinedRoom) return;
    if (!connected) { setSocketError('Socket non connecté.'); return; }
    socketRef.current?.emit('quiz:leave', { roomId: joinedRoom });
  }

  function handleStartGame() {
    if (!joinedRoom) return;
    if (!connected) { setSocketError('Socket non connecté.'); return; }
    socketRef.current?.emit('quiz:start', { roomId: joinedRoom });
  }

  function handleAnswer(selectedIndex: number) {
    if (!joinedRoom || !questionState) return;
    if (questionState.hasAnswered || timeLeftMs <= 0) return;
    if (questionState.revealEndsAt !== null) return;
    socketRef.current?.emit('quiz:answer', {
      roomId: joinedRoom,
      questionId: questionState.question.id,
      selectedIndex,
    });
    setQuestionState((prev) => prev ? { ...prev, hasAnswered: true, selectedIndex } : prev);
  }

  const headerProps = { user, logoutUser, viewSection, setViewSection };

  // ── Lobby: join screen
  if (!joinedRoom) {
    return (
      <>
        <ReporterHeader {...headerProps} />
        <div className="flex items-center justify-center min-h-screen bg-surface">
          <div className="w-full max-w-sm rounded-[1.5rem] border border-gray-200 bg-white p-8 shadow-sm flex flex-col gap-5">
            <h1 className="text-center text-2xl font-black text-gray-900">Quiz</h1>
            {socketError && <p className="text-sm text-red-500 text-center">{socketError}</p>}
            <form onSubmit={handleJoinRoom} className="flex flex-col gap-3">
              <label htmlFor="room-code" className="text-sm font-medium text-gray-700">Code de salle</label>
              <input
                id="room-code"
                type="text"
                maxLength={10}
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value)}
                placeholder="Entrez le code"
                className="w-full rounded-lg border border-gray-200 px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary"
              />
              <button
                type="submit"
                disabled={!connected}
                className="rounded-full bg-primary px-6 py-3 text-white font-semibold hover:bg-primary-hover disabled:opacity-50"
              >
                Rejoindre
              </button>
            </form>
          </div>
        </div>
      </>
    );
  }

  // ── Waiting room
  if (gamePhase === 'lobby') {
    return (
      <>
        <ReporterHeader {...headerProps} />
        <div className="flex items-center justify-center min-h-screen bg-surface">
          <div className="w-full max-w-sm rounded-[1.5rem] border border-gray-200 bg-white p-8 shadow-sm flex flex-col gap-5">
            <h1 className="text-center text-2xl font-black text-gray-900">Salle : {joinedRoom}</h1>
            {socketError && <p className="text-sm text-red-500 text-center">{socketError}</p>}
            {players.length > 0 && (
              <ul className="space-y-1">
                {players.map((p) => (
                  <li key={p.clientId} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className={`w-2 h-2 rounded-full ${p.clientId === myClientId ? 'bg-primary' : 'bg-gray-300'}`} />
                    <span className={p.clientId === myClientId ? 'font-semibold text-primary' : ''}>{p.name}</span>
                    {p.clientId === myClientId && <span className="text-xs text-gray-400">(vous)</span>}
                  </li>
                ))}
              </ul>
            )}
            <button
              onClick={handleStartGame}
              disabled={!isHost}
              className="rounded-full bg-primary px-6 py-3 text-white font-semibold hover:bg-primary-hover disabled:opacity-50"
            >
              {isHost ? 'Lancer le quiz' : 'En attente de l\'hôte…'}
            </button>
            <button
              onClick={handleLeaveRoom}
              className="rounded-full border border-gray-200 px-6 py-3 text-gray-700 font-semibold hover:bg-gray-50"
            >
              Quitter la salle
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Game over: leaderboard
  if (gamePhase === 'over') {
    const board = finalLeaderboard ?? [];
    return (
      <>
        <ReporterHeader {...headerProps} />
        <div className="flex items-center justify-center min-h-screen bg-surface py-8">
          <div className="w-full max-w-md rounded-[1.5rem] border border-gray-200 bg-white p-8 shadow-sm flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-2xl font-black text-gray-900">Résultats finaux</h1>
              <p className="text-sm text-gray-500 mt-1">Salle : {joinedRoom}</p>
            </div>

            {board.length === 0 ? (
              <p className="text-center text-gray-500">Aucun score disponible.</p>
            ) : (
              <ol className="space-y-2">
                {board.map((player, index) => {
                  const rank = index + 1;
                  const isMe = player.clientId === myClientId;
                  const rankStyle = RANK_STYLES[rank] ?? 'bg-gray-100 text-gray-500';
                  return (
                    <li
                      key={player.clientId}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                        isMe ? 'border-2 border-primary bg-surface' : 'border border-gray-100 bg-gray-50'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${rankStyle}`}>
                        {rank}
                      </span>
                      <span className={`flex-1 font-medium truncate ${isMe ? 'text-primary' : 'text-gray-800'}`}>
                        {player.name}
                        {isMe && <span className="ml-1 text-xs font-normal text-gray-400">(vous)</span>}
                      </span>
                      <span className="font-bold text-gray-900 shrink-0">{player.score} pts</span>
                    </li>
                  );
                })}
              </ol>
            )}

            <button
              onClick={handleLeaveRoom}
              className="rounded-full bg-primary px-6 py-3 text-white font-semibold hover:bg-primary-hover"
            >
              Retour à l'accueil
            </button>
          </div>
        </div>
      </>
    );
  }

  // ── Playing
  const secondsLeft = Math.ceil(timeLeftMs / 1000);
  const isRevealing = questionState?.revealEndsAt !== null && questionState?.revealEndsAt !== undefined;
  const timerPct = questionState?.endsAt
    ? Math.min(100, (timeLeftMs / (questionState.endsAt - (questionState.endsAt - 30_000))) * 100)
    : 0;

  return (
    <>
      <ReporterHeader {...headerProps} />
      <div className="flex items-center justify-center min-h-screen bg-surface py-8">
        <div className="w-full max-w-lg rounded-[1.5rem] border border-gray-200 bg-white p-8 shadow-sm flex flex-col gap-5">

          {/* Header row */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Salle : {joinedRoom}</span>
            <span>{questionState?.questionNumber ?? '–'} / {questionState?.totalQuestions ?? '–'}</span>
          </div>

          {/* Timer bar */}
          {!isRevealing && (
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200"
                style={{ width: `${timerPct}%` }}
              />
            </div>
          )}

          {questionState ? (
            <>
              {/* Question */}
              <h2 className="text-lg font-bold text-gray-900 leading-snug">{questionState.question.text}</h2>

              {/* Answer feedback */}
              {questionState.answerResult && (
                <p className={`text-sm font-semibold ${questionState.pointsEarned ? 'text-green-600' : 'text-red-500'}`}>
                  {questionState.answerResult}
                  {questionState.pointsEarned != null && questionState.pointsEarned > 0 && (
                    <span className="ml-1 text-gray-500 font-normal">(+{questionState.pointsEarned} pts)</span>
                  )}
                </p>
              )}

              {/* Waiting states */}
              {!isRevealing && questionState.hasAnswered && (
                <p className="text-sm text-gray-400">Réponse envoyée. En attente des autres joueurs…</p>
              )}
              {!isRevealing && !questionState.hasAnswered && timeLeftMs <= 0 && (
                <p className="text-sm text-gray-400">Temps écoulé. Prochaine question…</p>
              )}
              {isRevealing && (
                <p className="text-sm text-gray-400">Prochaine question dans {secondsLeft}s</p>
              )}

              {/* Answer buttons */}
              <ul className="grid grid-cols-2 gap-3">
                {questionState.question.options.map((opt, i) => {
                  let cls = 'w-full rounded-2xl px-4 py-4 text-white font-semibold text-sm disabled:opacity-50 text-center flex items-center justify-center h-full min-h-[4rem] ';
                  if (isRevealing) {
                    if (i === questionState.correctIndex) cls += 'bg-green-500';
                    else if (i === questionState.selectedIndex) cls += 'bg-red-400';
                    else cls += 'bg-gray-300';
                  } else {
                    cls += questionState.selectedIndex === i
                      ? 'bg-primary-hover'
                      : 'bg-primary hover:bg-primary-hover';
                  }
                  return (
                    <li key={i} className="flex">
                      <button
                        onClick={() => handleAnswer(i)}
                        disabled={questionState.hasAnswered || timeLeftMs <= 0 || isRevealing}
                        className={cls}
                      >
                        <span className="whitespace-normal break-words">{opt}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              {/* Reveal stats */}
              {isRevealing && questionState.answerStatistics.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Résultats</p>
                  <ul className="space-y-2">
                    {questionState.answerStatistics.map((stat) => (
                      <li key={stat.index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="whitespace-pre-wrap break-words text-gray-700">{questionState.question.options[stat.index]}</span>
                          <span className="font-semibold text-gray-900 ml-2 shrink-0">{stat.count} ({stat.percentage}%)</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-primary" style={{ width: `${stat.percentage}%` }} />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Live scores during reveal */}
              {isRevealing && players.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Scores</p>
                  <ol className="space-y-1">
                    {[...players]
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 5)
                      .map((p, idx) => (
                        <li key={p.clientId} className="flex items-center gap-2 text-sm">
                          <span className="w-5 text-gray-400 text-xs text-right shrink-0">{idx + 1}.</span>
                          <span className={`flex-1 truncate ${p.clientId === myClientId ? 'font-semibold text-primary' : 'text-gray-700'}`}>
                            {p.name}
                          </span>
                          <span className="font-bold text-gray-900 shrink-0">{p.score} pts</span>
                        </li>
                      ))}
                  </ol>
                </div>
              )}
            </>
          ) : (
            <p className="text-gray-400 text-sm">En attente de la question…</p>
          )}
        </div>
      </div>
    </>
  );
}

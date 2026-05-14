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
};

type RevealPayload = {
  roomId: string;
  questionId: number;
  correctIndex: number;
  revealEndsAt: number;
  revealDurationMs: number;
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
  answerResult: string;
} | null;

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:5000';

export default function Quiz() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [viewSection, setViewSection] = useState<'profile' | 'report' | 'quiz'>('quiz');

useEffect(() => {
    if (viewSection === 'profile') {
      navigate('/reporter?section=profile');
    }
    if (viewSection === 'report') {
      navigate('/reporter?section=report');
    }
  }, [viewSection, navigate]);

  const socketRef = useRef<Socket | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [socketError, setSocketError] = useState<string>('');
  const [gamePhase, setGamePhase] = useState<GamePhase>('lobby');
  const [questionState, setQuestionState] = useState<QuestionState>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function connectSocket() {
      const socketProbeUrl = `${SOCKET_URL.replace(/\/$/, '')}/socket.io/?EIO=4&transport=polling&t=${Date.now()}`;

      try {
        const response = await fetch(socketProbeUrl);
        if (!response.ok) {
          throw new Error('Quiz server is unavailable.');
        }
      } catch {
        if (!cancelled) {
          setConnected(false);
          setSocketError('Quiz server is unavailable.');
        }
        return;
      }

      if (cancelled) {
        return;
      }

      const socket = io(SOCKET_URL, {
        transports: ['websocket'],
        reconnection: false,
        timeout: 5000,
      });

      socketRef.current = socket;

      socket.on('connect', () => {
        setConnected(true);
        setSocketError('');
      });

      socket.on('disconnect', () => {
        setConnected(false);
      });

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
      });

      socket.on('quiz:joined', (data: { roomId: string; hostId: string }) => {
        setJoinedRoom(data.roomId);
        setSocketError('');
        setIsHost(data.hostId === socket.id);
      });

      socket.on('quiz:game:started', () => {
        setGamePhase('playing');
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
          answerResult: '',
        });
        setTimeLeftMs(data.endsAt ? Math.max(0, data.endsAt - Date.now()) : data.timeLimitMs);
      });

      socket.on('quiz:question:reveal', (data: RevealPayload) => {
        setQuestionState((prev) =>
          prev && prev.question.id === data.questionId
            ? { ...prev, correctIndex: data.correctIndex, revealEndsAt: data.revealEndsAt }
            : prev
        );
      });

      socket.on('quiz:game:over', () => {
        setQuestionState(null);
        setTimeLeftMs(0);
        setGamePhase('over');
      });

      socket.on('quiz:answer:result', (data: AnswerResultPayload) => {
        setQuestionState((prev) =>
          prev ? { ...prev, answerResult: data.isCorrect ? 'Correct answer!' : 'Wrong answer.' } : prev
        );
      });

      socket.on('quiz:join:ignored', (data) => {
        if (data.reason === 'quiz-already-started') {
          setSocketError('The quiz has already started.');
        }
        else if (data.reason === 'room-is-full') {
          setSocketError('This room is already full.');
        }
      });

      socket.on('quiz:room:update', (data) => {
        if (data?.hostId === socket.id) setIsHost(true);
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

    const tick = () => {
      setTimeLeftMs(Math.max(0, activeDeadline - Date.now()));
    };

    tick();
    const intervalId = window.setInterval(tick, 200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [activeDeadline, gamePhase]);

  function handleJoinRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = roomCode.trim();

    if (!connected) {
      setSocketError('Socket is not connected.');
      return;
    }

    if (!trimmed || trimmed.length < 3 || trimmed.length > 10) {
      setSocketError('Please enter a room code between 3 and 10 characters.');
      return;
    }

    socketRef.current?.emit('quiz:join', { roomId: trimmed });
  }

  function handleLeaveRoom() {
    if (gamePhase === 'over') {
      setRoomCode('');
      setJoinedRoom(null);
      setQuestionState(null);
      setTimeLeftMs(0);
      setGamePhase('lobby');
    }
    if (!joinedRoom) return;

    if (!connected) {
      setSocketError('Socket is not connected.');
      return;
    }

    socketRef.current?.emit('quiz:leave', { roomId: joinedRoom });
  }

  function handleStartGame() {
    if (!joinedRoom) return;

    if (!connected) {
      setSocketError('Socket is not connected.');
      return;
    }

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

  if (!joinedRoom) {
    return (
		<>
	<ReporterHeader {...headerProps} />
      <div className="flex items-center justify-center h-screen">
        <div className="w-full max-w-sm rounded-[1.5rem] border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4">
          <h1 className="text-center text-2xl font-black">Quiz</h1>
          {socketError ? <p className="text-red-500">{socketError}</p> : null}
          <form onSubmit={handleJoinRoom}>
            <label htmlFor="room-code" className="text-sm font-medium text-gray-700">Room code</label>
            <input
              id="room-code"
              type="text"
              maxLength={10}
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value)}
              placeholder="Enter room id"
              className="w-full rounded-lg border border-gray-200 px-4 py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus:border-primary"
            />
            <button type="submit" disabled={!connected} className="mt-2 rounded-full bg-primary px-6 py-3 text-white font-semibold hover:bg-primary-hover disabled:opacity-50">
              Join
            </button>
          </form>
        </div>
      </div>
	  </>
    );
  }

  if (gamePhase === 'playing' || gamePhase === 'over') {
    const secondsLeft = Math.ceil(timeLeftMs / 1000);
    const isRevealing = questionState?.revealEndsAt !== null && questionState?.revealEndsAt !== undefined;

    return (
<>
	<ReporterHeader {...headerProps} />
      <div className="flex items-center justify-center h-screen">
        <div className="w-full max-w-sm rounded-[1.5rem] border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4">
          <h1 className="text-center text-2xl font-black">Quiz</h1>
          <p>Room: {joinedRoom}</p>
          {socketError ? <p className="text-red-500">{socketError}</p> : null}
          {gamePhase === 'over' ? <h2>Game over</h2> : null}
          {questionState ? (
            <>
              <p>{questionState.questionNumber} / {questionState.totalQuestions}</p>
              <p>{isRevealing ? `Next question in: ${secondsLeft}s` : `Time left: ${secondsLeft}s`}</p>
              <h2>{questionState.question.text}</h2>
              {questionState.answerResult ? <p>{questionState.answerResult}</p> : null}
              <ul className="grid grid-cols-2 gap-4">
                {questionState.question.options.map((opt, i) => {
                  let optionClass = 'w-full mt-2 rounded-full px-16 py-3 text-white font-semibold disabled:opacity-50 ';
                  if (isRevealing) {
                    if (i === questionState.correctIndex) {
                      optionClass += 'bg-green-500';
                    } else if (i === questionState.selectedIndex) {
                      optionClass += 'bg-red-500';
                    } else {
                      optionClass += 'bg-gray-400';
                    }
                  } else {
                    optionClass += 'bg-primary hover:bg-primary-hover';
                  }
                  return (
                    <li key={i}>
                      <button
                        onClick={() => handleAnswer(i)}
                        disabled={questionState.hasAnswered || timeLeftMs <= 0 || isRevealing}
                        className={optionClass}
                      >
                        {opt}
                      </button>
                    </li>
                  );
                })}
              </ul>
              {!isRevealing && questionState.hasAnswered ? <p>Answer submitted. Waiting for other players...</p> : null}
              {!isRevealing && !questionState.hasAnswered && timeLeftMs <= 0 ? <p>Time is up. Waiting for next question...</p> : null}
            </>
          ) : (
            <p>{gamePhase === 'over' ? 'Thanks for playing.' : 'Waiting for question...'}</p>,
            <button onClick={handleLeaveRoom} className="mt-2 rounded-full bg-primary px-6 py-3 text-white font-semibold hover:bg-primary-hover disabled:opacity-50">Leave</button>
          )}
        </div>
      </div>
	  </>
    );
  }

  return (

<>
	<ReporterHeader {...headerProps} />
    <div className="flex items-center justify-center h-screen">
      <div className="w-full max-w-sm rounded-[1.5rem] border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4">
        <h1 className="text-center text-2xl font-black">Room: {joinedRoom}</h1>
        {socketError ? <p className="text-red-500">{socketError}</p> : null}
        <button onClick={handleStartGame} disabled={!isHost} className="mt-2 rounded-full bg-primary px-6 py-3 text-white font-semibold hover:bg-primary-hover disabled:opacity-50">
          Start the quiz ?
        </button>
        <button onClick={handleLeaveRoom} className="mt-2 rounded-full bg-primary px-6 py-3 text-white font-semibold hover:bg-primary-hover disabled:opacity-50">Leave room</button>
      </div>
    </div>
	</>
  );
}

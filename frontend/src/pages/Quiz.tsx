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
};

type GamePhase = 'lobby' | 'playing' | 'over';

type QuestionState = {
  question: QuestionPayload['question'];
  questionNumber: number;
  totalQuestions: number;
  endsAt: number | null;
  hasAnswered: boolean;
  answerResult: string;
} | null;

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ??
  import.meta.env.VITE_API_URL ??
  'http://localhost:5000';

export default function Quiz() {
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
          answerResult: '',
        });
        setTimeLeftMs(data.endsAt ? Math.max(0, data.endsAt - Date.now()) : data.timeLimitMs);
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
          setSocketError('quiz-already-started');
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

  const endsAt = questionState?.endsAt ?? null;

  useEffect(() => {
    if (!endsAt || gamePhase !== 'playing') {
      setTimeLeftMs(0);
      return;
    }

    const tick = () => {
      setTimeLeftMs(Math.max(0, endsAt - Date.now()));
    };

    tick();
    const intervalId = window.setInterval(tick, 200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [endsAt, gamePhase]);

  function handleJoinRoom(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = roomCode.trim();

    if (!trimmed) {
      setSocketError('Please enter a room code.');
      return;
    }

    if (!connected) {
      setSocketError('Socket is not connected.');
      return;
    }

    socketRef.current?.emit('quiz:join', { roomId: trimmed });
  }

  function handleLeaveRoom() {
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

    socketRef.current?.emit('quiz:answer', {
      roomId: joinedRoom,
      questionId: questionState.question.id,
      selectedIndex,
    });

    setQuestionState((prev) => prev ? { ...prev, hasAnswered: true } : prev);
  }

  if (!joinedRoom) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-full max-w-sm rounded-[1.5rem] border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4">
          <h1 className="text-center text-2xl font-black">Quiz</h1>
          <p>Socket: {connected ? 'connected' : 'disconnected'}</p>
          {socketError ? <p>Socket error: {socketError}</p> : null}
          <form onSubmit={handleJoinRoom}>
            <label htmlFor="room-code" className="text-sm font-medium text-gray-700">Room code</label>
            <input
              id="room-code"
              type="text"
              value={roomCode}
              onChange={(event) => setRoomCode(event.target.value)}
              placeholder="Enter room id"
              className="w-full rounded-lg border border-gray-200 px-4 py-2 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10"
            />
            <button type="submit" disabled={!connected} className="mt-2 rounded-full bg-primary px-6 py-3 text-white font-semibold hover:bg-primary-hover disabled:opacity-50">
              Submit
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (gamePhase === 'playing' || gamePhase === 'over') {
    const secondsLeft = Math.ceil(timeLeftMs / 1000);

    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-full max-w-sm rounded-[1.5rem] border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4">
          <h1 className="text-center text-2xl font-black">Quiz</h1>
          <p>Room: {joinedRoom}</p>
          <p>Socket: {connected ? 'connected' : 'disconnected'}</p>
          {socketError ? <p>Socket error: {socketError}</p> : null}
          {gamePhase === 'over' ? <h2>Game over</h2> : null}
          {questionState ? (
            <>
              <p>{questionState.questionNumber} / {questionState.totalQuestions}</p>
              <p>Time left: {secondsLeft}s</p>
              <h2>{questionState.question.text}</h2>
              {questionState.answerResult ? <p>{questionState.answerResult}</p> : null}
              <ul>
                {questionState.question.options.map((opt, i) => (
                  <li key={i}>
                    <button
                      onClick={() => handleAnswer(i)}
                      disabled={questionState.hasAnswered || timeLeftMs <= 0}
                      className="mt-2 rounded-full bg-primary px-6 py-3 text-white font-semibold hover:bg-primary-hover disabled:opacity-50"
                    >
                      {opt}
                    </button>
                  </li>
                ))}
              </ul>
              {questionState.hasAnswered ? <p>Answer submitted. Waiting for other players...</p> : null}
              {!questionState.hasAnswered && timeLeftMs <= 0 ? <p>Time is up. Waiting for next question...</p> : null}
            </>
          ) : (
            <p>{gamePhase === 'over' ? 'Thanks for playing.' : 'Waiting for question...'}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="w-full max-w-sm rounded-[1.5rem] border border-gray-200 bg-white p-6 shadow-sm flex flex-col gap-4">
        <p>Room: {joinedRoom}</p>
        <p>Socket: {connected ? 'connected' : 'disconnected'}</p>
        {socketError ? <p>Socket error: {socketError}</p> : null}
        <button onClick={handleLeaveRoom} className="mt-2 rounded-full bg-primary px-6 py-3 text-white font-semibold hover:bg-primary-hover disabled:opacity-50">Leave room</button>
        <button onClick={handleStartGame} disabled={!isHost} className="mt-2 rounded-full bg-primary px-6 py-3 text-white font-semibold hover:bg-primary-hover disabled:opacity-50">
          Start the quiz?
        </button>
      </div>
    </div>
  );
}

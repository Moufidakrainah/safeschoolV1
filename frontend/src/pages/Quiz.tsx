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
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionPayload['question'] | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [questionEndsAt, setQuestionEndsAt] = useState<number | null>(null);
  const [timeLeftMs, setTimeLeftMs] = useState(0);
  const [hasAnsweredCurrentQuestion, setHasAnsweredCurrentQuestion] = useState(false);
  const [isGameOver, setIsGameOver] = useState(false);
  const [answerResultMessage, setAnswerResultMessage] = useState('');

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
        setCurrentQuestion(null);
        setQuestionNumber(0);
        setTotalQuestions(0);
        setQuestionEndsAt(null);
        setTimeLeftMs(0);
        setGameStarted(false);
        setIsGameOver(false);
        setHasAnsweredCurrentQuestion(false);
        setAnswerResultMessage('');
      });

      socket.on('quiz:joined', (data: { roomId: string; hostId: string }) => {
        setJoinedRoom(data.roomId);
        setSocketError('');
        setIsHost(data.hostId === socket.id);
      });

      socket.on('quiz:game:started', () => {
        setGameStarted(true);
        setIsGameOver(false);
      });

      socket.on('quiz:question', (data: QuestionPayload) => {
        setCurrentQuestion(data.question);
        setQuestionNumber(data.questionNumber);
        setTotalQuestions(data.totalQuestions);
        setQuestionEndsAt(data.endsAt);
        setTimeLeftMs(data.endsAt ? Math.max(0, data.endsAt - Date.now()) : data.timeLimitMs);
        setHasAnsweredCurrentQuestion(false);
        setAnswerResultMessage('');
      });

      socket.on('quiz:game:over', () => {
        setCurrentQuestion(null);
        setQuestionEndsAt(null);
        setTimeLeftMs(0);
        setIsGameOver(true);
      });

      socket.on('quiz:answer:result', (data: AnswerResultPayload) => {
        setAnswerResultMessage(data.isCorrect ? 'Correct answer!' : 'Wrong answer.');
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

  useEffect(() => {
    if (!questionEndsAt || !gameStarted || isGameOver) {
      setTimeLeftMs(0);
      return;
    }

    const tick = () => {
      setTimeLeftMs(Math.max(0, questionEndsAt - Date.now()));
    };

    tick();
    const intervalId = window.setInterval(tick, 200);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [questionEndsAt, gameStarted, isGameOver]);

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
    if (!joinedRoom || !currentQuestion) return;
    if (hasAnsweredCurrentQuestion || timeLeftMs <= 0) return;

    socketRef.current?.emit('quiz:answer', {
      roomId: joinedRoom,
      questionId: currentQuestion.id,
      selectedIndex,
    });

    setHasAnsweredCurrentQuestion(true);
  }

  if (!joinedRoom) {
    return (
      <div>
        <h1>Quiz</h1>
        <p>Socket: {connected ? 'connected' : 'disconnected'}</p>
        {socketError ? <p>Socket error: {socketError}</p> : null}
        <form onSubmit={handleJoinRoom}>
          <label htmlFor="room-code">Room code</label>
          <input
            id="room-code"
            type="text"
            value={roomCode}
            onChange={(event) => setRoomCode(event.target.value)}
            placeholder="Enter room id"
          />
          <button type="submit" disabled={!connected}>
            Submit
          </button>
        </form>
      </div>
    );
  }

  if (gameStarted) {
    const secondsLeft = Math.ceil(timeLeftMs / 1000);

    return (
      <div>
        <h1>Quiz</h1>
        <p>Room: {joinedRoom}</p>
        <p>Socket: {connected ? 'connected' : 'disconnected'}</p>
        {socketError ? <p>Socket error: {socketError}</p> : null}
        {isGameOver ? <h2>Game over</h2> : null}
        {currentQuestion ? (
          <>
            <p>{questionNumber} / {totalQuestions}</p>
            <p>Time left: {secondsLeft}s</p>
            <h2>{currentQuestion.text}</h2>
            {answerResultMessage ? <p>{answerResultMessage}</p> : null}
            <ul>
              {currentQuestion.options.map((opt, i) => (
                <li key={i}>
                  <button
                    onClick={() => handleAnswer(i)}
                    disabled={hasAnsweredCurrentQuestion || timeLeftMs <= 0}
                  >
                    {opt}
                  </button>
                </li>
              ))}
            </ul>
            {hasAnsweredCurrentQuestion ? <p>Answer submitted. Waiting for other players...</p> : null}
            {!hasAnsweredCurrentQuestion && timeLeftMs <= 0 ? <p>Time is up. Waiting for next question...</p> : null}
          </>
        ) : (
          <p>{isGameOver ? 'Thanks for playing.' : 'Waiting for question...'}</p>
        )}
      </div>
    );
  }

  return (
    <div>
      <p>Room: {joinedRoom}</p>
      <p>Socket: {connected ? 'connected' : 'disconnected'}</p>
      {socketError ? <p>Socket error: {socketError}</p> : null}
      <button onClick={handleLeaveRoom}>Leave room</button>
      <button onClick={handleStartGame} disabled={!isHost}>
        Start the quiz?
      </button>
    </div>
  );
}

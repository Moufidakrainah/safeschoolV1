import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Question {
  id: number;
  text: string;
  options: string[];
}

type QuestionPayload = {
  roomId: string;
  question: {
    id: number;
    text: string;
    options: string[];
  };
  questionNumber: number;
  totalQuestions: number;
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000';

export default function Quiz() {
  const socketRef = useRef<Socket | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinedRoom, setJoinedRoom] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastPong, setLastPong] = useState<string>('');
  const [socketError, setSocketError] = useState<string>('');
  const [gameStarted, setGameStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<QuestionPayload["question"] | null>(null);
  const [questionNumber, setQuestionNumber] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);

  useEffect(() => {
    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
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

    socket.on('quiz:pong', (data: { message: string; clientId: string }) => {
      setLastPong(`${data.message} from ${data.clientId}`);
    });

    socket.on('quiz:left', (snapshot) => {
      console.log("left quiz", snapshot);
      setRoomCode('');
      setJoinedRoom(null);
    });

    socket.on('quiz:joined', (data: { roomId: string, hostId: string}) => {
      setJoinedRoom(data.roomId);
      setSocketError('');
      setIsHost(data.hostId === socket.id);
    });

    socket.on('quiz:game:started', (data) => {
        setGameStarted(true);
    });

    socket.on('quiz:question', (data: QuestionPayload) => {
      setCurrentQuestion(data.question);
      setQuestionNumber(data.questionNumber);
      setTotalQuestions(data.totalQuestions);
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  function handlePing() {
    socketRef.current?.emit('quiz:ping', 'hello from Quiz.tsx');
  }

  function disconnect() {
    socketRef.current.disconnect();
  }

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
    const trimmed = roomCode.trim();

    if (!connected) {
      setSocketError('Socket is not connected.');
      return;
    }

    socketRef.current?.emit('quiz:leave', { roomId: trimmed });
  }

  function  handleStartGame() {
    const trimmed = roomCode.trim();

    if (!connected) {
      setSocketError('Socket is not connected.');
    return;
    }

    socketRef.current?.emit('quiz:start', { roomId: trimmed });
  }

  function handleAnswer(selectedIndex: number) {
    if (!joinedRoom || !currentQuestion) return;

    socketRef.current?.emit('quiz:answer', {
      roomId: joinedRoom,
      questionId: currentQuestion.id,
      selectedIndex,
    });
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
    return (
      <div>
        <h1>Quiz</h1>
        <p>Room: {joinedRoom}</p>
        <p>Socket: {connected ? 'connected' : 'disconnected'}</p>
        {socketError ? <p>Socket error: {socketError}</p> : null}
        <button onClick={handlePing} disabled={!connected}>
          Send ping
        </button>
        {lastPong ? <p>{lastPong}</p> : null}
        <button onClick={disconnect} disabled={!connected}>
          Disconnect socket
        </button>
        {currentQuestion ? (
          <>
            <p>{questionNumber} / {totalQuestions}</p>
            <h2>{currentQuestion.text}</h2>
            <ul>
              {currentQuestion.options.map((opt, i) => (
                <li key={i}>
                  <button onClick={() => handleAnswer(i)}>{opt}</button>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p>Waiting for question...</p>
        )}
      </div>
      
    );
  }

  return (
    <div>
      <p>Room: {joinedRoom}</p>
       <p>Socket: {connected ? 'connected' : 'disconnected'}</p>
        {socketError ? <p>Socket error: {socketError}</p> : null}
        <button onClick={handlePing} disabled={!connected}>
         Send ping
        </button>
         {lastPong ? <p>{lastPong}</p> : null}
      <button onClick={disconnect} disabled={!connected}>
        Disconnect socket
      </button>
      <button onClick={handleLeaveRoom}>
        Leave room
      </button>
      <button onClick={handleStartGame} disabled={!isHost}>
        Start the quiz?
      </button>
    </div>
  );
}

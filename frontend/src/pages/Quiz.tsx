import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface Question {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
}

const questions: Question[] = [
  {
    id: 1,
    text: 'what is 1+1?',
    options: ['2', '3', '1', '-42'],
    correctIndex: 0,
  },
];

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? 'http://localhost:5000';

export default function Quiz() {
  const socketRef = useRef<Socket | null>(null);
  const [current, setCurrent] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastPong, setLastPong] = useState<string>('');
  const [socketError, setSocketError] = useState<string>('');

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

  function handleAnswer(index: number) {
    if (index === questions[current].correctIndex) {
      setScore((s) => s + 1);
    }
    if (current + 1 < questions.length) {
      setCurrent((c) => c + 1);
    } else {
      setFinished(true);
    }
  }

  if (finished) {
    return (
      <div>
        <h1>Quiz finished</h1>
        <p>Score: {score} / {questions.length}</p>
        <button onClick={() => {setFinished(false); setScore(0); setCurrent(0)}} style={{padding: '8px 16px', background: 'transparent', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '13px'}}>restart</button>
      </div>
    );
  }

  const q = questions[current];
  return (
    <div>
      <h1>Quiz</h1>
      <p>Socket: {connected ? 'connected' : 'disconnected'}</p>
      {socketError ? <p>Socket error: {socketError}</p> : null}
      <button onClick={handlePing} disabled={!connected}>
        Send ping
      </button>
      {lastPong ? <p>{lastPong}</p> : null}
      <button onClick={disconnect} disabled={!connected}>
        Disconnect socket
      </button>
      <p>{current + 1} / {questions.length}</p>
      <h2>{q.text}</h2>
      <ul>
        {q.options.map((opt, i) => (
          <li key={i}>
            <button onClick={() => handleAnswer(i)}>{opt}</button>
          </li>
        ))}
      </ul>
    </div>
  );
}

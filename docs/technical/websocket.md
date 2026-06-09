# WebSocket and NestJS Gateway

> How real-time communication works in SafeSchool (Quiz module).

---

## The problem HTTP does not solve

With standard HTTP, the client always initiates the request. The server cannot push anything spontaneously.

For a real-time quiz this is a fundamental limitation: the server cannot send a new question to all participants at the right moment.

WebSocket opens a persistent, bidirectional connection:

```
Client ←──────────────────→ Server
         connection open
         either side can send at any time
```

---

## NestJS Gateway vs Controller

NestJS handles two types of network entry points:

| | Controller | Gateway |
|---|---|---|
| Protocol | HTTP | WebSocket |
| Trigger | Client request | Named event (`emit`) |
| Route decorator | `@Get()`, `@Post()`… | `@SubscribeMessage('name')` |
| Bidirectional | ❌ | ✅ |

A Gateway coexists with HTTP controllers — NestJS handles both in parallel on the same process.

```typescript
@WebSocketGateway({ cors: { origin: process.env.FRONTEND_URL } })
export class QuizGateway {

  @WebSocketServer()
  server: Server; // Socket.io server instance

  @SubscribeMessage('joinRoom')
  handleJoin(client: Socket, data: { roomId: string }) {
    client.join(data.roomId); // client joins the room
    client.emit('joined', { roomId: data.roomId });
  }

  @SubscribeMessage('submitAnswer')
  handleAnswer(client: Socket, data: { roomId: string; answer: string }) {
    // broadcast to all members of the room
    this.server.to(data.roomId).emit('answerReceived', data);
  }
}
```

---

## Rooms

A room is an isolated channel. Each quiz session has a unique `roomId` — events emitted to a room stay within that room.

```
Room "quiz-abc123"   ←→  player1, player2, player3
Room "quiz-xyz789"   ←→  player4, player5
```

A client can join multiple rooms simultaneously. `client.join(roomId)` is the only operation needed.

Targeting a room:
- `this.server.to(roomId).emit(...)` → all members of the room (excluding the emitter)
- `client.to(roomId).emit(...)` → all members of the room except this client
- `client.emit(...)` → this client only

---

## React side — socket.io-client

### Connection and cleanup

```typescript
useEffect(() => {
  const socket = io('http://localhost:5000', {
    auth: { token: localStorage.getItem('token') }
  });

  socket.on('question', (data) => {
    setCurrentQuestion(data);
  });

  socket.on('leaderboard', (data) => {
    setScores(data);
  });

  // Always disconnect on component unmount
  return () => {
    socket.disconnect();
  };
}, []); // [] = single connection on mount
```

Without the cleanup, every component re-render opens a new connection — resource leak and duplicate events.

### Emitting an event

```typescript
// Join a room
socket.emit('joinRoom', { roomId: 'quiz-abc123' });

// Submit an answer
socket.emit('submitAnswer', { roomId: 'quiz-abc123', answer: 'Paris' });
```

### Stable reference with useRef

If the socket needs to be used outside the `useEffect` (e.g. in a button handler), store it in a `useRef` to keep it out of the dependency array:

```typescript
const socketRef = useRef<Socket | null>(null);

useEffect(() => {
  socketRef.current = io('http://localhost:5000');
  return () => { socketRef.current?.disconnect(); };
}, []);

// In a handler
const handleAnswer = () => {
  socketRef.current?.emit('submitAnswer', { answer });
};
```

---

## Full quiz session flow

```
Player 1 clicks "Join"
  └── socket.emit('joinRoom', { roomId })
        ↓
NestJS Gateway — handleJoin()
  └── client.join(roomId)

Host starts the question
  └── gateway.server.to(roomId).emit('question', { text, options, duration })
        ↓
All players in the room
  └── setCurrentQuestion(data) → React re-renders the timer and answer choices

Player answers
  └── socket.emit('submitAnswer', { roomId, answer })
        ↓
NestJS Gateway — handleAnswer()
  └── computes score, emits leaderboard
        ↓
gateway.server.to(roomId).emit('leaderboard', scores)
```

---

## WebSocket vs HTTP in Docker

Both go through the same backend container (NestJS) but via different protocols:

```
Browser
  ├── HTTP  → POST /auth/login, GET /reports…  (NestJS Controllers)
  └── WS    → io('http://localhost:5000')       (NestJS Gateway, same port)

NestJS handles both on port 3000 (5000 on the host).
```

In production with nginx, WebSockets require specific headers (`Upgrade`, `Connection`) that nginx must forward explicitly.

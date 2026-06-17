# WebSocket and NestJS Gateway

> How the real-time quiz works in SafeSchool.
>
> Backend: [`backend/src/quiz-realtime/`](../../backend/src/quiz-realtime/) — `quiz-realtime.gateway.ts`, `quiz-realtime.service.ts`, `quiz-realtime.module.ts`.
> Frontend: [`frontend/src/hooks/useQuizSocket.ts`](../../frontend/src/hooks/useQuizSocket.ts) and the screens under `frontend/src/pages/quiz/`.

---

## The problem HTTP does not solve

With standard HTTP, the client always initiates the request. The server cannot push anything spontaneously.

For a real-time quiz this is a fundamental limitation: the server has to send the same question to every player at the same moment, reveal the answer when the timer runs out, and update the leaderboard live. None of that fits the request/response model.

WebSocket opens a persistent, bidirectional connection (here through Socket.IO):

```
Client ←──────────────────→ Server
         connection open
         either side can send at any time
```

---

## NestJS Gateway vs Controller

NestJS handles two types of network entry points:

|               | Controller           | Gateway                     |
| ------------- | -------------------- | --------------------------- |
| Protocol      | HTTP                 | WebSocket (Socket.IO)       |
| Trigger       | Client request       | Named event (`emit`)        |
| Decorator     | `@Get()`, `@Post()`… | `@SubscribeMessage('name')` |
| Bidirectional | ❌                   | ✅                          |

A Gateway coexists with HTTP controllers — NestJS runs both in parallel on the same process and the same port. In SafeSchool, the REST API and the quiz Gateway both live in the backend container.

The quiz Gateway is declared in `quiz-realtime.module.ts`, which also wires in `JwtModule` so the Gateway can verify tokens on connection:

```typescript
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      verifyOptions: { algorithms: ["HS256"] },
    }),
  ],
  providers: [QuizRealtimeGateway, QuizRealtimeService],
})
export class QuizRealtimeModule {}
```

The split between the two providers matters:

- **`QuizRealtimeGateway`** is the transport layer. It receives socket events, validates payloads, and emits results back to clients/rooms. It holds no game logic.
- **`QuizRealtimeService`** is the game engine. It owns all room and player state in memory and exposes pure methods (`joinRoom`, `submitAnswer`, …) that return a result describing what happened. It never touches sockets directly.

The Gateway talks to the Service through callbacks for events that happen on a timer (a question times out, a disconnected player's grace period expires). The Service calls `setOnQuestionTimedOut`, `setOnQuestionRevealed` and `setOnPlayerExpired`; the Gateway registers handlers in `afterInit()` that translate those into `server.to(roomId).emit(...)`.

---

## Authentication on the handshake

The quiz is reserved for authenticated users, so the Gateway authenticates the **connection itself**, not each message.

```typescript
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL ?? "http://localhost:5173" },
})
export class QuizRealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  handleConnection(client: Socket) {
    const token = this.extractToken(client); // handshake.auth.token or Authorization header
    if (!token) {
      client.emit("quiz:unauthorized", { reason: "missing-token" });
      client.disconnect(true);
      return;
    }
    try {
      const payload = this.jwtService.verify(token, { algorithms: ["HS256"] });
      client.data.user = payload; // { sub, email, role }
    } catch {
      client.emit("quiz:unauthorized", { reason: "invalid-token" });
      client.disconnect(true);
    }
  }
}
```

Two consequences:

- The token is read from `handshake.auth.token` (preferred) or the `Authorization` header, with any `Bearer ` prefix stripped.
- A player is identified by **`sub` (the stable user id from the JWT)**, not by `socket.id`. This is the key design decision behind reconnection: a player keeps the same identity across socket drops, even though `socket.id` changes every time.

---

## Rooms and the join-code model

A room is an isolated Socket.IO channel — events emitted to a room stay within it.

```
Room "abc123"   ←→  player1, player2, player3
Room "xyz789"   ←→  player4, player5
```

In SafeSchool the `roomId` **is the join code** the host shares with other players. There is no separate "create room" step: the first player to `quiz:join` a code that doesn't exist becomes the **host** and the room is created in `waiting` status. Constraints enforced by the service:

- Codes must be **3–10 characters** (`roomcode-bad-format` otherwise).
- A room holds at most **32 players** (`room-is-full`).
- At most **500 concurrent rooms** server-wide, to stop a client flooding `quiz:join` with unique codes and exhausting memory (`server-at-capacity`).
- **One active room per account.** If the same user is already connected in another room/tab, a new join is refused with `already-in-room`. Leftover presence from a real disconnection does _not_ count, so reconnecting after a drop still works.

Targeting helpers used by the Gateway:

- `server.to(roomId).emit(...)` → everyone in the room
- `client.emit(...)` → that one socket only

---

## Game lifecycle

A room moves through three states (`GameStatus`): `waiting` → `in-progress` → `finished`.

```
waiting        host gathers players in the lobby
  │  quiz:start (host only)
  ▼
in-progress    15 questions, each:
  │              ├── 30s to answer            (quiz:question)
  │              ├── reveal: correct answer + per-option stats, 5s   (quiz:question:reveal)
  │              └── advance to next question
  ▼
finished       final leaderboard, room destroyed   (quiz:game:over)
```

Key numbers (in `quiz-realtime.service.ts`):

| Constant                 | Value  | Meaning                                                 |
| ------------------------ | ------ | ------------------------------------------------------- |
| `QUESTIONS_PER_GAME`     | 15     | questions drawn at random per match                     |
| `QUESTION_TIME_LIMIT_MS` | 30 000 | answering window per question                           |
| `REVEAL_TIME_MS`         | 5 000  | how long the correct answer + stats are shown           |
| `RECONNECT_GRACE_MS`     | 60 000 | how long a disconnected player is kept for reconnection |

When the host starts the game, the service picks 15 random questions, sets the room to `in-progress` and schedules the first question timer. A question ends in one of two ways:

1. **The 30s timer fires** (`scheduleQuestionTimer`), or
2. **Every connected player has already answered** (`allConnectedAnswered`) — no point waiting for the clock.

Either way the room enters the **reveal phase** (`enterRevealPhase`): the correct index and answer statistics are broadcast, players who never answered lose their streak, and a 5s timer is set. When that fires, the room advances to the next question or, if it was the last one, emits `quiz:game:over` and deletes the room.

---

## Scoring

Scoring rewards both speed and consistency (`submitAnswer` + the `SPEED_TIERS` / `streakMultiplier` helpers):

- **Base points by speed:** answer correctly within 3s → 3 pts, within 7s → 2 pts, slower → 1 pt.
- **Streak multiplier:** each consecutive correct answer raises a multiplier, clamped to `[1, 5]`. A wrong answer (or not answering) resets the streak to 0.
- **Points earned = base × multiplier.**

Only correct answers score; the per-player streak lives on the server, so a reconnecting player keeps their streak.

---

## Event protocol

All event names are namespaced with `quiz:`.

### Client → server

| Event         | Payload                                 | Purpose                                  |
| ------------- | --------------------------------------- | ---------------------------------------- |
| `quiz:join`   | `{ roomId, playerName? }`               | Join (or create, or reconnect to) a room |
| `quiz:leave`  | `{ roomId }`                            | Leave a room                             |
| `quiz:start`  | `{ roomId }`                            | Host starts the game                     |
| `quiz:answer` | `{ roomId, questionId, selectedIndex }` | Submit an answer to the current question |
| `quiz:ping`   | `string`                                | Connectivity check (replies `quiz:pong`) |

Each handler validates its payload and returns a Socket.IO **acknowledgement** describing the outcome — `quiz:joined` / `quiz:join:ignored`, `quiz:started` / `quiz:start:ignored`, `quiz:answer:accepted` / `quiz:answer:ignored`, etc. The `*:ignored` acks carry a `reason` (`invalid-payload`, `unauthorized`, `quiz-already-started`, `room-is-full`, `already-in-room`, `already-answered`, `question-mismatch`, …) so the client can show a precise message.

### Server → client

| Event                  | Sent to    | Purpose                                                                        |
| ---------------------- | ---------- | ------------------------------------------------------------------------------ |
| `quiz:room:update`     | room       | Lobby/player list changed (join, leave, host migration)                        |
| `quiz:game:started`    | room       | Game moved from `waiting` to `in-progress`                                     |
| `quiz:question`        | room       | New question (text + options, **no correct index**), number, total, deadline   |
| `quiz:question:reveal` | room       | Correct index + per-option answer statistics, with a reveal deadline           |
| `quiz:score:update`    | room       | Updated room snapshot (player scores)                                          |
| `quiz:game:over`       | room       | Final snapshot; the client sorts it into the final leaderboard                 |
| `quiz:answer:result`   | one client | That player's result: correct?, base points, multiplier, points earned, streak |
| `quiz:answer:restore`  | one client | On reconnection, restores the answer already submitted to the live question    |
| `quiz:room:closed`     | room       | Room was emptied/destroyed                                                     |
| `quiz:unauthorized`    | one client | Missing/invalid token at connection time                                       |

Note that `quiz:question` deliberately omits the correct answer (`toPublicQuestion` strips `correctIndex`) — the correct index only ever reaches clients during the reveal phase, so it cannot be read from the network early.

---

## Reconnection, host migration and disconnects

Because players are identified by their stable user id, the service can survive socket drops mid-game.

- **On disconnect during a game** (`markDisconnected`): the player is _not_ removed immediately. They are flagged `connected: false`, and a 60s grace timer is started. The remaining connected players may now all have answered, so the question can reveal immediately instead of waiting on someone who left.
- **On reconnection** (`quiz:join` with the same identity): the grace timer is cancelled, the new socket is attached, and `sendReconnectState` replays the current question, scores, any active reveal and the player's own previous answer (`quiz:answer:restore`) so their UI is back in sync.
- **If the grace period expires** (`expirePlayer`): the player is removed for good; if that completes the current question, it reveals.
- **Host migration:** if the host leaves, the service promotes another (preferably connected) player to host.
- **Empty room:** as soon as the last player leaves — or a solo player disconnects with nobody else connected — the room and all its timers are destroyed, so no "ghost" rooms linger in memory.

The frontend mirrors this window: `useQuizSocket` keeps the joined room in a ref and re-emits `quiz:join` automatically on `connect`, giving up only after its own 60s reconnection window, after which it resets the UI to the lobby.

---

## React side — `useQuizSocket`

The whole client lifecycle lives in one hook ([`frontend/src/hooks/useQuizSocket.ts`](../../frontend/src/hooks/useQuizSocket.ts)).

### Connection and cleanup

```typescript
const socket = io(SOCKET_URL, {
  transports: ["polling", "websocket"],
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  auth: { token: localStorage.getItem("token") ?? "" },
});

// on unmount: leave the room, then disconnect
return () => {
  if (joinedRoomRef.current)
    socket.emit("quiz:leave", { roomId: joinedRoomRef.current });
  socket.disconnect();
};
```

The socket is created **once** (empty dependency array) and kept in a `useRef` so button handlers (`joinRoom`, `startGame`, `submitAnswer`, `leaveRoom`) can emit without re-running the effect. Without the cleanup, every re-render would open a new connection — a resource leak and duplicate events.

### Endpoint resolution

```typescript
const SOCKET_URL = toSecureUrl(
  import.meta.env.VITE_SOCKET_URL ??
    import.meta.env.VITE_API_URL ??
    "http://localhost:5000",
);
```

In development the socket connects to the backend directly (`http://localhost:5000`). In production the frontend is built with an empty `VITE_API_URL`, so the URL is **relative / same-origin** and the connection goes through nginx over HTTPS (`toSecureUrl` upgrades `http`/`ws` to `https`/`wss` for non-localhost hosts).

### Emitting an event

```typescript
socket.emit("quiz:join", { roomId: "abc123", playerName });
socket.emit("quiz:start", { roomId });
socket.emit("quiz:answer", { roomId, questionId, selectedIndex });
```

The hook keeps a local timer ticking from the `endsAt` / `revealEndsAt` deadlines the server sends, so the countdown stays accurate even though the authoritative clock is server-side.

---

## WebSocket through nginx (production)

In development the browser connects straight to the backend (port 5000). In production everything goes through nginx on a single HTTPS origin, so the Socket.IO endpoint (`/socket.io/`) needs the `Upgrade` / `Connection` headers forwarded explicitly — otherwise the connection silently falls back to long-polling instead of a real WebSocket.

```nginx
# nginx/nginx.conf
location /socket.io/ {
    proxy_pass http://backend:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade    $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_set_header Host       $host;
}
```

```
Browser ──HTTPS/WSS──► nginx (8443) ──HTTP/WS──► backend:3000 (NestJS Gateway)
```

See [`architecture.md`](./architecture.md) for how this fits the rest of the stack.

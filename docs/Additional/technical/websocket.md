# WebSocket et Gateway NestJS

> Comment fonctionne la communication temps réel dans SafeSchool (module Quiz).

---

## Le problème que HTTP ne résout pas

Avec HTTP classique, c'est toujours le client qui initie la requête. Le serveur ne peut pas envoyer quelque chose spontanément.

Pour un quiz en temps réel, c'est bloquant : le serveur ne peut pas pousser une nouvelle question à tous les participants au moment voulu.

WebSocket ouvre une connexion persistante et bidirectionnelle :

```
Client ←──────────────────→ Serveur
         connexion ouverte
         les deux peuvent envoyer à tout moment
```

---

## Gateway NestJS vs Controller

NestJS gère deux types de points d'entrée réseau :

| | Controller | Gateway |
|---|---|---|
| Protocole | HTTP | WebSocket |
| Déclenchement | Requête client | Événement nommé (`emit`) |
| Décorateur route | `@Get()`, `@Post()`… | `@SubscribeMessage('nom')` |
| Bidirectionnel | ❌ | ✅ |

Une Gateway cohabite avec les controllers HTTP — NestJS gère les deux en parallèle sur le même processus.

```typescript
// gateway.ts — écoute des événements WebSocket
@WebSocketGateway({ cors: { origin: '*' } })
export class QuizGateway {

  @WebSocketServer()
  server: Server; // instance Socket.io côté serveur

  @SubscribeMessage('joinRoom')
  handleJoin(client: Socket, data: { roomId: string }) {
    client.join(data.roomId); // le client rejoint la room
    client.emit('joined', { roomId: data.roomId });
  }

  @SubscribeMessage('submitAnswer')
  handleAnswer(client: Socket, data: { roomId: string; answer: string }) {
    // broadcast à tous les membres de la room
    this.server.to(data.roomId).emit('answerReceived', data);
  }
}
```

---

## Les rooms

Une room est un canal isolé. Chaque session quiz a un `roomId` unique — les événements émis vers une room ne sortent pas de cette room.

```
Room "quiz-abc123"   ←→  joueur1, joueur2, joueur3
Room "quiz-xyz789"   ←→  joueur4, joueur5
```

Un client peut rejoindre plusieurs rooms simultanément. `client.join(roomId)` est la seule opération nécessaire.

Pour cibler une room :
- `this.server.to(roomId).emit(...)` → tous les membres de la room (sauf l'émetteur)
- `client.to(roomId).emit(...)` → tous les membres de la room sauf ce client
- `client.emit(...)` → uniquement ce client

---

## Côté React — utilisation de Socket.io-client

### Connexion et cleanup

```typescript
useEffect(() => {
  const socket = io('http://localhost:5000', {
    auth: { token: localStorage.getItem('token') }
  });

  socket.on('connect', () => console.log('connecté'));

  socket.on('question', (data) => {
    setCurrentQuestion(data);
  });

  socket.on('leaderboard', (data) => {
    setScores(data);
  });

  // CRITIQUE : toujours déconnecter au démontage du composant
  return () => {
    socket.disconnect();
  };
}, []); // [] = une seule connexion au montage
```

Si le cleanup est absent, chaque re-render du composant ouvre une nouvelle connexion — fuite de ressources et doublons d'événements.

### Émettre un événement

```typescript
// Rejoindre une room
socket.emit('joinRoom', { roomId: 'quiz-abc123' });

// Soumettre une réponse
socket.emit('submitAnswer', { roomId: 'quiz-abc123', answer: 'Paris' });
```

### Référence stable avec useRef

Si le socket doit être utilisé hors du useEffect (dans un handler de bouton par exemple), on le stocke dans un `useRef` pour ne pas le remettre dans les dépendances :

```typescript
const socketRef = useRef<Socket | null>(null);

useEffect(() => {
  socketRef.current = io('http://localhost:5000');
  return () => { socketRef.current?.disconnect(); };
}, []);

// Dans un handler
const handleAnswer = () => {
  socketRef.current?.emit('submitAnswer', { answer });
};
```

---

## Flux complet d'une session quiz

```
Joueur 1 clique "Rejoindre"
  └── socket.emit('joinRoom', { roomId })
        ↓
NestJS Gateway — handleJoin()
  └── client.join(roomId)

Admin lance la question
  └── gateway.server.to(roomId).emit('question', { text, options, duration })
        ↓
Tous les joueurs de la room
  └── setCurrentQuestion(data) → React re-rend le timer + les choix

Joueur répond
  └── socket.emit('submitAnswer', { roomId, answer })
        ↓
NestJS Gateway — handleAnswer()
  └── calcule le score, émet le leaderboard
        ↓
gateway.server.to(roomId).emit('leaderboard', scores)
```

---

## Différence WebSocket / HTTP dans le docker-compose

Les deux passent par le même container backend (NestJS), mais via des protocoles différents :

```
Navigateur
  ├── HTTP  → POST /auth/login, GET /reports…  (NestJS Controllers)
  └── WS    → io('http://localhost:5000')       (NestJS Gateway, même port)

NestJS gère les deux sur le port 3000 (5000 côté hôte).
```

En production avec nginx, les WebSockets nécessitent des headers spécifiques (`Upgrade`, `Connection`) que nginx doit transmettre explicitement.

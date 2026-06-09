import { Button } from '../../components/ui/button';
import type { Player } from '../../hooks/useQuizSocket';

type QuizLobbyProps = {
  joinedRoom: string;
  socketError: string;
  players: Player[];
  myClientId: string | null;
  isHost: boolean;
  startGame: () => void;
  leaveRoom: () => void;
};

// ── Salle d'attente
export default function QuizLobby({
  joinedRoom,
  socketError,
  players,
  myClientId,
  isHost,
  startGame,
  leaveRoom,
}: QuizLobbyProps) {
  return (
    <div className="flex items-center justify-center flex-1 bg-surface py-8 px-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-[1.5rem] border border-gray-200 bg-white p-8 shadow-sm flex flex-col gap-5">
        <h1 className="text-center text-2xl font-black text-gray-900">Salle : {joinedRoom}</h1>
        {socketError && <p className="text-sm text-red-500 text-center">{socketError}</p>}
        {players.length > 0 && (
          <ul className="space-y-1">
            {players.map((p) => {
              const isDisconnected = p.connected === false;
              return (
                <li key={p.clientId} className={`flex items-center gap-2 text-sm ${isDisconnected ? 'text-gray-400' : 'text-gray-700'}`}>
                  <span className={`w-2 h-2 rounded-full ${isDisconnected ? 'bg-amber-400' : p.clientId === myClientId ? 'bg-primary' : 'bg-gray-300'}`} />
                  <span className={p.clientId === myClientId && !isDisconnected ? 'font-semibold text-primary' : ''}>{p.name}</span>
                  {p.clientId === myClientId && <span className="text-xs text-gray-400">(vous)</span>}
                  {isDisconnected && <span className="text-xs text-amber-500">(déconnecté)</span>}
                </li>
              );
            })}
          </ul>
        )}
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Comment jouer</p>
          <ul className="space-y-1 text-xs text-gray-600">
            <li>▸ 15 questions, 2 réponses possibles — une seule est correcte</li>
            <li>▸ Vous avez 30 secondes pour répondre à chaque question</li>
            <li>▸ Plus vous répondez vite, plus vous marquez : ≤3s = 3 pts, ≤7s = 2 pts, sinon 1 pt</li>
            <li>▸ Combo : chaque bonne réponse d'affilée augmente le multiplicateur (jusqu'à ×5)</li>
            <li>▸ Une mauvaise réponse (ou pas de réponse) remet le combo à zéro</li>
            <li>▸ Une seule tentative par question, pas de changement</li>
            <li>▸ Celui avec le plus de points à la fin gagne !</li>
          </ul>
        </div>
        <Button onClick={startGame} disabled={!isHost} variant="primary">
          {isHost ? 'Lancer le quiz' : "En attente de l'hôte…"}
        </Button>
        <Button onClick={leaveRoom} variant="primary">
          Quitter la salle
        </Button>
      </div>
    </div>
  );
}

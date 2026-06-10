import { Button } from '../../components/ui/button';
import type { Player } from '../../hooks/useQuizSocket';

const RANK_STYLES: Record<number, string> = {
  1: 'bg-amber-400 text-white',
  2: 'bg-gray-300 text-gray-700',
  3: 'bg-orange-500 text-white',
};

type QuizLeaderboardProps = {
  joinedRoom: string;
  finalLeaderboard: Player[] | null;
  myClientId: string | null;
  leaveRoom: () => void;
};

// ── Fin de partie : classement
export default function QuizLeaderboard({
  joinedRoom,
  finalLeaderboard,
  myClientId,
  leaveRoom,
}: QuizLeaderboardProps) {
  const board = finalLeaderboard ?? [];
  return (
    <div className="flex items-center justify-center flex-1 bg-surface py-8 px-4 overflow-y-auto">
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
              const isWinner = rank === 1;
              const rankStyle = RANK_STYLES[rank] ?? 'bg-gray-100 text-gray-500';
              return (
                <li
                  key={player.clientId}
                  style={{ animationDelay: `${index * 0.08}s` }}
                  className={`quiz-rise flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                    isWinner ? 'quiz-glow border-2 border-amber-400 bg-amber-50' :
                    isMe ? 'border-2 border-primary bg-surface' : 'border border-gray-100 bg-gray-50'
                  }`}
                >
                  <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${rankStyle}`}>
                    {isWinner ? '🏆' : rank}
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

        <Button onClick={leaveRoom} variant="primary">
          Quitter
        </Button>
      </div>
    </div>
  );
}

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { Player } from '@/hooks/useQuizSocket';

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
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center flex-1 bg-surface py-8 px-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-[1.5rem] border border-gray-200 bg-white p-8 shadow-sm flex flex-col gap-5">
        <h1 className="text-center text-2xl font-black text-gray-900">{t('quiz.room', { code: joinedRoom })}</h1>
        {socketError && <p className="text-sm text-red-500 text-center">{socketError}</p>}
        {players.length > 0 && (
          <ul className="space-y-1">
            {players.map((p) => {
              const isDisconnected = p.connected === false;
              return (
                <li key={p.clientId} className={`flex items-center gap-2 text-sm ${isDisconnected ? 'text-gray-400' : 'text-gray-700'}`}>
                  <span className={`w-2 h-2 rounded-full ${isDisconnected ? 'bg-amber-400' : p.clientId === myClientId ? 'bg-primary' : 'bg-gray-300'}`} />
                  <span className={p.clientId === myClientId && !isDisconnected ? 'font-semibold text-primary' : ''}>{p.name}</span>
                  {p.clientId === myClientId && <span className="text-xs text-gray-400">{t('quiz.you')}</span>}
                  {isDisconnected && <span className="text-xs text-amber-500">{t('quiz.disconnected')}</span>}
                </li>
              );
            })}
          </ul>
        )}
        <div className="rounded-xl bg-gray-50 border border-gray-100 p-4 flex flex-col gap-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{t('quiz.howToPlay')}</p>
          <ul className="space-y-1 text-xs text-gray-600">
            <li>▸ {t('quiz.rules.questions')}</li>
            <li>▸ {t('quiz.rules.time')}</li>
            <li>▸ {t('quiz.rules.speed')}</li>
            <li>▸ {t('quiz.rules.combo')}</li>
            <li>▸ {t('quiz.rules.reset')}</li>
            <li>▸ {t('quiz.rules.oneTry')}</li>
            <li>▸ {t('quiz.rules.winner')}</li>
          </ul>
        </div>
        <Button onClick={startGame} disabled={!isHost} variant="primary">
          {isHost ? t('quiz.startGame') : t('quiz.waitingHost')}
        </Button>
        <Button onClick={leaveRoom} variant="primary">
          {t('quiz.leaveRoom')}
        </Button>
      </div>
    </div>
  );
}

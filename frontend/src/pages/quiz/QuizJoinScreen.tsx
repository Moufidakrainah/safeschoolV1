import { useTranslation } from 'react-i18next';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';

type QuizJoinScreenProps = {
  connected: boolean;
  reconnecting: boolean;
  socketError: string;
  roomCode: string;
  setRoomCode: (code: string) => void;
  joinRoom: (code: string) => void;
};

// ── Écran d'accueil : rejoindre une salle
export default function QuizJoinScreen({
  connected,
  reconnecting,
  socketError,
  roomCode,
  setRoomCode,
  joinRoom,
}: QuizJoinScreenProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center justify-center flex-1 bg-surface py-8 px-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-[1.5rem] border border-gray-200 bg-white p-8 shadow-sm flex flex-col gap-5">
        <h1 className="text-center text-2xl font-black text-gray-900">{t('quiz.title')}</h1>
        {reconnecting && <p className="text-sm text-amber-500 text-center">{t('quiz.reconnecting')}</p>}
        {socketError && <p className="text-sm text-red-500 text-center">{socketError}</p>}
        <form
          onSubmit={(e) => { e.preventDefault(); joinRoom(roomCode); }}
          className="flex flex-col gap-3"
        >
          <div className="flex flex-col gap-1 w-full">
            <label className="text-gray-700 text-sm font-medium">{t('quiz.roomCodeLabel')}</label>
            <Input
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value)}
              placeholder={t('quiz.roomCodePlaceholder')}
              maxLength={10}
            />
          </div>
          <Button type="submit" disabled={!connected} variant="primary">
            {t('quiz.join')}
          </Button>
        </form>
        <details className="group">
          <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-600 select-none list-none flex items-center gap-1">
            <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
            {t('quiz.howToPlay')}
          </summary>
          <p className="mt-2 text-xs text-gray-500 leading-relaxed">
            {t('quiz.joinHelp')}
          </p>
        </details>
      </div>
    </div>
  );
}

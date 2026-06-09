import { useEffect, useRef } from 'react';
import { Button } from '../../components/ui/button';
import type { Player, QuestionState } from '../../hooks/useQuizSocket';

const STREAK_CAP = 5;

type QuizPlayingProps = {
  joinedRoom: string;
  reconnecting: boolean;
  questionState: QuestionState;
  timeLeftMs: number;
  players: Player[];
  myClientId: string | null;
  myStreak: number;
  submitAnswer: (index: number) => void;
};

// ── En jeu
export default function QuizPlaying({
  joinedRoom,
  reconnecting,
  questionState,
  timeLeftMs,
  players,
  myClientId,
  myStreak,
  submitAnswer,
}: QuizPlayingProps) {
  // Capture le rang de chaque joueur au début de chaque question pour que le
  // classement en direct puisse montrer comment les positions ont bougé pendant la révélation
  const prevRanksRef = useRef<Record<string, number>>({});
  const questionNumber = questionState?.questionNumber ?? null;
  useEffect(() => {
    if (questionNumber == null) return;
    const ranks: Record<string, number> = {};
    [...players]
      .sort((a, b) => b.score - a.score)
      .forEach((p, i) => { ranks[p.clientId] = i + 1; });
    prevRanksRef.current = ranks;
    // On ne recapture que quand la question change, pas à chaque mise à jour du score —
    // `players` est volontairement exclu des deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questionNumber]);

  const secondsLeft = Math.ceil(timeLeftMs / 1000);
  const isRevealing = questionState?.revealEndsAt != null;
  const timerPct = questionState?.timeLimitMs
    ? Math.min(100, (timeLeftMs / questionState.timeLimitMs) * 100)
    : 0;
  const nextMult = Math.min(myStreak + 1, STREAK_CAP);
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const lowTime = !isRevealing && timeLeftMs > 0 && secondsLeft <= 5;
  const timerColor = timerPct > 50 ? 'bg-primary' : timerPct > 25 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <div className="flex items-center justify-center flex-1 bg-surface py-8 overflow-y-auto">
      <div className="w-full max-w-lg rounded-[1.5rem] border border-gray-200 bg-white p-8 shadow-sm flex flex-col gap-5">

        {/* Ligne d'en-tête */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span>Salle : {joinedRoom}</span>
          <span>{questionState?.questionNumber ?? '–'} / {questionState?.totalQuestions ?? '–'}</span>
        </div>

        {reconnecting && (
          <p className="rounded-lg bg-amber-50 border border-amber-200 px-3 py-2 text-center text-sm text-amber-600">
            Connexion perdue — reconnexion en cours…
          </p>
        )}

        {/* Barre de minuteur + décompte */}
        {!isRevealing && (
          <div className="flex items-center gap-3">
            <div className="h-2 flex-1 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full transition-[width] duration-200 ${timerColor} ${lowTime ? 'quiz-bar-pulse' : ''}`}
                style={{ width: `${timerPct}%` }}
              />
            </div>
            <span
              key={secondsLeft}
              className={`quiz-pop w-8 text-right text-xl font-black tabular-nums ${
                lowTime ? 'text-red-500' : 'text-gray-700'
              }`}
            >
              {Math.max(0, secondsLeft)}
            </span>
          </div>
        )}

        {/* Bannière de série / multiplicateur */}
        {!isRevealing && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
            <div className="flex flex-col">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Combo</span>
              <span className="text-2xl font-black text-gray-900 tabular-nums">{myStreak}</span>
            </div>
            <div className="flex gap-0.5">
              {Array.from({ length: STREAK_CAP }).map((_, i) => (
                <span
                  key={i}
                  style={{ animationDelay: `${i * 0.1}s` }}
                  className={`text-xl transition-all ${i < myStreak ? 'opacity-100 quiz-flame' : 'opacity-20 grayscale'}`}
                >
                  🔥
                </span>
              ))}
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Multiplicateur</span>
              <span className="text-2xl font-black text-primary tabular-nums">×{nextMult}</span>
            </div>
          </div>
        )}

        {questionState ? (
          <>
            {/* Question */}
            <h2 key={questionState.questionNumber} className="quiz-rise text-lg font-bold text-gray-900 leading-snug">{questionState.question.text}</h2>

            {/* Retour sur la réponse */}
            {isRevealing && questionState.lastAnswerCorrect && questionState.basePoints != null && (
              <div className="quiz-rise rounded-xl border border-green-100 bg-green-50 px-4 py-3 flex flex-col gap-3">
                <span className="text-sm font-semibold text-green-600">Bonne réponse !</span>
                <div className="flex items-center justify-center gap-4 tabular-nums">
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-lg font-black text-gray-900">{questionState.basePoints}</span>
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">Vitesse</span>
                  </div>
                  <span className="text-lg text-gray-400">×</span>
                  <div className="flex flex-col items-center leading-tight">
                    <span className="text-lg font-black text-gray-900">{questionState.multiplier}</span>
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">Combo</span>
                  </div>
                  <span className="text-lg text-gray-400">=</span>
                  <div className="flex flex-col items-center leading-tight">
                    <span className="quiz-pop text-2xl font-black text-green-600">+{questionState.pointsEarned}</span>
                    <span className="text-[10px] uppercase tracking-wide text-gray-400">Points</span>
                  </div>
                </div>
              </div>
            )}
            {isRevealing && questionState.lastAnswerCorrect === false && (
              <div className="quiz-shake flex items-center justify-between rounded-xl border border-red-100 bg-red-50 px-4 py-3">
                <span className="text-sm font-semibold text-red-500">Mauvaise réponse</span>
                <span className="text-sm text-gray-500">Combo perdu</span>
              </div>
            )}

            {/* États d'attente */}
            {!isRevealing && questionState.hasAnswered && (
              <p className="text-sm text-gray-400">Réponse envoyée. En attente des autres joueurs…</p>
            )}
            {!isRevealing && !questionState.hasAnswered && timeLeftMs <= 0 && (
              <p className="text-sm text-gray-400">Temps écoulé. Prochaine question…</p>
            )}
            {isRevealing && questionState.selectedIndex == null && (
              <p className="text-sm text-red-500 font-semibold">Vous n'avez pas répondu.</p>
            )}
            {isRevealing && (
              <p className="text-sm text-gray-400">Prochaine question dans {secondsLeft}s</p>
            )}

            {/* Boutons de réponse */}
            <ul className="grid grid-cols-2 gap-3">
              {questionState.question.options.map((opt, i) => {
                const isCorrect = isRevealing && i === questionState.correctIndex;
                const isWrongSelected = isRevealing && i === questionState.selectedIndex && !isCorrect;
                const isNeutral = isRevealing && !isCorrect && !isWrongSelected;
                const isSelectedPreReveal = !isRevealing && questionState.selectedIndex === i;

                const variant = isCorrect ? 'success' : isWrongSelected ? 'danger' : 'primary';
                const interactive = !isRevealing && !questionState.hasAnswered && timeLeftMs > 0;
                const extraClass = [
                  'w-full min-h-[4rem] h-full flex items-center justify-center text-base',
                  interactive && 'hover:-translate-y-0.5 hover:shadow-md active:scale-95',
                  isNeutral && 'bg-gray-300 hover:bg-gray-300',
                  isSelectedPreReveal && 'bg-primary-hover hover:bg-primary-hover scale-[1.03]',
                  isCorrect && 'quiz-pop',
                  isWrongSelected && 'quiz-shake',
                ].filter(Boolean).join(' ');

                return (
                  <li key={i} className="flex">
                    <Button
                      onClick={() => submitAnswer(i)}
                      disabled={questionState.hasAnswered || timeLeftMs <= 0 || isRevealing}
                      variant={variant}
                      className={extraClass}
                      type="button"
                    >
                      <span className="whitespace-normal wrap-break-word">{opt}</span>
                    </Button>
                  </li>
                );
              })}
            </ul>

            {/* Statistiques de révélation */}
            {isRevealing && questionState.answerStatistics.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Résultats</p>
                <ul className="space-y-2">
                  {questionState.answerStatistics.map((stat) => (
                    <li key={stat.index} className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span className="whitespace-pre-wrap wrap-break-word text-gray-700">{questionState.question.options[stat.index]}</span>
                        <span className="font-semibold text-gray-900 ml-2 shrink-0">{stat.count} ({stat.percentage}%)</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${stat.percentage}%` }} />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Classement en direct pendant la révélation — avec mouvement de rang */}
            {isRevealing && sortedPlayers.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Classement en direct</p>
                <ol className="space-y-1">
                  {sortedPlayers.slice(0, 5).map((p, idx) => {
                    const rank = idx + 1;
                    const prev = prevRanksRef.current[p.clientId];
                    const delta = prev != null ? prev - rank : 0;
                    const isMe = p.clientId === myClientId;
                    return (
                      <li
                        key={p.clientId}
                        className={`flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm ${
                          isMe ? 'border border-primary bg-surface' : ''
                        }`}
                      >
                        <span className="w-5 text-right text-xs text-gray-400 shrink-0">{rank}.</span>
                        <span className="w-7 text-center text-xs font-bold shrink-0 tabular-nums">
                          {delta > 0 ? (
                            <span className="text-green-500">▲{delta}</span>
                          ) : delta < 0 ? (
                            <span className="text-red-500">▼{-delta}</span>
                          ) : (
                            <span className="text-gray-300">–</span>
                          )}
                        </span>
                        <span className={`flex-1 truncate ${isMe ? 'font-semibold text-primary' : 'text-gray-700'}`}>
                          {p.name}
                        </span>
                        <span className="font-bold text-gray-900 shrink-0 tabular-nums">{p.score} pts</span>
                      </li>
                    );
                  })}
                </ol>
              </div>
            )}
          </>
        ) : (
          <p className="text-gray-400 text-sm">En attente de la question…</p>
        )}
      </div>
    </div>
  );
}

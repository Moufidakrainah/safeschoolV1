import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import RoleHeader from '@/components/layout/Header/RoleHeader';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { useQuizSocket } from '../hooks/useQuizSocket';

const RANK_STYLES: Record<number, string> = {
  1: 'bg-amber-400 text-white',
  2: 'bg-gray-300 text-gray-700',
  3: 'bg-orange-500 text-white',
};

const STREAK_CAP = 5;

export default function Quiz() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [viewSection, setViewSection] = useState<'profile' | 'report' | 'quiz' | 'cases'>('quiz');
  const [roomCode, setRoomCode] = useState('');

  useEffect(() => {
    if (viewSection === 'quiz') return;
    const base = user?.role === 'student' ? '/student' : '/reporter';
    navigate(`${base}?section=${viewSection}`);
  }, [viewSection, navigate, user?.role]);

  const {
    connected,
    reconnecting,
    socketError,
    myClientId,
    isHost,
    joinedRoom,
    gamePhase,
    questionState,
    timeLeftMs,
    players,
    finalLeaderboard,
    myStreak,
    joinRoom,
    leaveRoom,
    startGame,
    submitAnswer,
  } = useQuizSocket(user?.firstName);

  // Snapshot each player's rank at the start of every question so the live
  // leaderboard can show how positions shifted during the reveal.
  const prevRanksRef = useRef<Record<string, number>>({});
  const questionNumber = questionState?.questionNumber ?? null;
  useEffect(() => {
    if (questionNumber == null) return;
    const ranks: Record<string, number> = {};
    [...players]
      .sort((a, b) => b.score - a.score)
      .forEach((p, i) => { ranks[p.clientId] = i + 1; });
    prevRanksRef.current = ranks;
    // Only re-snapshot when the question changes, not on every score update.
  }, [questionNumber]);

  const headerProps = {
    user,
    logoutUser,
    reporterViewSection: viewSection as 'profile' | 'report' | 'quiz',
    reporterSetViewSection: setViewSection as (s: 'profile' | 'report' | 'quiz') => void,
    studentViewSection: viewSection,
    studentSetViewSection: setViewSection,
  };

  // ── Lobby: join screen
  if (!joinedRoom) {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <RoleHeader {...headerProps} />
        <div className="flex items-center justify-center flex-1 bg-surface py-8 px-4 overflow-y-auto">
          <div className="w-full max-w-sm rounded-[1.5rem] border border-gray-200 bg-white p-8 shadow-sm flex flex-col gap-5">
            <h1 className="text-center text-2xl font-black text-gray-900">Quiz</h1>
            {reconnecting && <p className="text-sm text-amber-500 text-center">Reconnexion en cours…</p>}
            {socketError && <p className="text-sm text-red-500 text-center">{socketError}</p>}
            <form
              onSubmit={(e) => { e.preventDefault(); joinRoom(roomCode); }}
              className="flex flex-col gap-3"
            >
              <div className="flex flex-col gap-1 w-full">
                <label className="text-gray-700 text-sm font-medium">Code de salle</label>
                <Input
                  value={roomCode}
                  onChange={(e) => setRoomCode(e.target.value)}
                  placeholder="Entrez le code"
                  maxLength={10}
                />
              </div>
              <Button type="submit" disabled={!connected} variant="primary">
                Rejoindre
              </Button>
            </form>
            <details className="group">
              <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-600 select-none list-none flex items-center gap-1">
                <span className="group-open:rotate-90 transition-transform inline-block">▶</span>
                Comment jouer
              </summary>
              <p className="mt-2 text-xs text-gray-500 leading-relaxed">
                Entrez un code de salle (3 à 10 caractères). Si vous êtes le premier à rejoindre cette salle, vous devenez l'hôte et pourrez lancer la partie quand vous le souhaiter.
              </p>
            </details>
          </div>
        </div>
      </div>
    );
  }

  // ── Waiting room
  if (gamePhase === 'lobby') {
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <RoleHeader {...headerProps} />
        <div className="flex items-center justify-center flex-1 bg-surface py-8 px-4 overflow-y-auto">
          <div className="w-full max-w-sm rounded-[1.5rem] border border-gray-200 bg-white p-8 shadow-sm flex flex-col gap-5">
            <h1 className="text-center text-2xl font-black text-gray-900">Salle : {joinedRoom}</h1>
            {socketError && <p className="text-sm text-red-500 text-center">{socketError}</p>}
            {players.length > 0 && (
              <ul className="space-y-1">
                {players.map((p) => (
                  <li key={p.clientId} className="flex items-center gap-2 text-sm text-gray-700">
                    <span className={`w-2 h-2 rounded-full ${p.clientId === myClientId ? 'bg-primary' : 'bg-gray-300'}`} />
                    <span className={p.clientId === myClientId ? 'font-semibold text-primary' : ''}>{p.name}</span>
                    {p.clientId === myClientId && <span className="text-xs text-gray-400">(vous)</span>}
                  </li>
                ))}
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
      </div>
    );
  }

  // ── Game over: leaderboard
  if (gamePhase === 'over') {
    const board = finalLeaderboard ?? [];
    return (
      <div className="flex flex-col flex-1 min-h-0">
        <RoleHeader {...headerProps} />
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
      </div>
    );
  }

  // ── Playing
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
    <div className="flex flex-col flex-1 min-h-0">
      <RoleHeader {...headerProps} />
      <div className="flex items-center justify-center flex-1 bg-surface py-8 overflow-y-auto">
        <div className="w-full max-w-lg rounded-[1.5rem] border border-gray-200 bg-white p-8 shadow-sm flex flex-col gap-5">

          {/* Header row */}
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Salle : {joinedRoom}</span>
            <span>{questionState?.questionNumber ?? '–'} / {questionState?.totalQuestions ?? '–'}</span>
          </div>

          {/* Timer bar + countdown */}
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

          {/* Streak / multiplier banner */}
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

              {/* Answer feedback */}
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

              {/* Waiting states */}
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

              {/* Answer buttons */}
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
                        <span className="whitespace-normal break-words">{opt}</span>
                      </Button>
                    </li>
                  );
                })}
              </ul>

              {/* Reveal stats */}
              {isRevealing && questionState.answerStatistics.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Résultats</p>
                  <ul className="space-y-2">
                    {questionState.answerStatistics.map((stat) => (
                      <li key={stat.index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="whitespace-pre-wrap break-words text-gray-700">{questionState.question.options[stat.index]}</span>
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

              {/* Live leaderboard during reveal — with rank movement */}
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
    </div>
  );
}
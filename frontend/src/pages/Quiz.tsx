import { useState, useEffect } from 'react';
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
    joinRoom,
    leaveRoom,
    startGame,
    submitAnswer,
  } = useQuizSocket(user?.firstName);

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
                  const rankStyle = RANK_STYLES[rank] ?? 'bg-gray-100 text-gray-500';
                  return (
                    <li
                      key={player.clientId}
                      className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                        isMe ? 'border-2 border-primary bg-surface' : 'border border-gray-100 bg-gray-50'
                      }`}
                    >
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0 ${rankStyle}`}>
                        {rank}
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

          {/* Timer bar */}
          {!isRevealing && (
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-primary transition-[width] duration-200"
                style={{ width: `${timerPct}%` }}
              />
            </div>
          )}

          {questionState ? (
            <>
              {/* Question */}
              <h2 className="text-lg font-bold text-gray-900 leading-snug">{questionState.question.text}</h2>

              {/* Answer feedback */}
              {isRevealing && questionState.answerResult && (
                <p className={`text-sm font-semibold ${questionState.lastAnswerCorrect ? 'text-green-600' : 'text-red-500'}`}>
                  {questionState.answerResult}
                  {questionState.pointsEarned != null && questionState.pointsEarned > 0 && (
                    <span className="ml-1 text-gray-500 font-normal">(+{questionState.pointsEarned} pts)</span>
                  )}
                </p>
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
                  const extraClass = [
                    'w-full min-h-[4rem] h-full flex items-center justify-center',
                    isNeutral && 'bg-gray-300 hover:bg-gray-300',
                    isSelectedPreReveal && 'bg-primary-hover hover:bg-primary-hover',
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

              {/* Live scores during reveal */}
              {isRevealing && players.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Scores</p>
                  <ol className="space-y-1">
                    {[...players]
                      .sort((a, b) => b.score - a.score)
                      .slice(0, 5)
                      .map((p, idx) => (
                        <li key={p.clientId} className="flex items-center gap-2 text-sm">
                          <span className="w-5 text-gray-400 text-xs text-right shrink-0">{idx + 1}.</span>
                          <span className={`flex-1 truncate ${p.clientId === myClientId ? 'font-semibold text-primary' : 'text-gray-700'}`}>
                            {p.name}
                          </span>
                          <span className="font-bold text-gray-900 shrink-0">{p.score} pts</span>
                        </li>
                      ))}
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
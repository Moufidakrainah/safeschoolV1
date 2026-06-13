import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import RoleHeader from '@/components/layout/Header/RoleHeader';
import { useQuizSocket } from '@/hooks/useQuizSocket';
import QuizJoinScreen from './quiz/QuizJoinScreen';
import QuizLobby from './quiz/QuizLobby';
import QuizLeaderboard from './quiz/QuizLeaderboard';
import QuizPlaying from './quiz/QuizPlaying';

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
  } = useQuizSocket(user?.firstName, user?.id);

  // Le header reporter ne connaît pas la section 'cases' (réservée aux élèves) ; on la
  // ramène sur 'quiz' pour garder un type aligné sans cast. Le setter, lui, accepte un
  // sur-ensemble de valeurs, donc il est directement assignable
  const headerProps = useMemo(() => ({
    user,
    logoutUser,
    reporterViewSection: viewSection === 'cases' ? ('quiz' as const) : viewSection,
    reporterSetViewSection: setViewSection,
    studentViewSection: viewSection,
    studentSetViewSection: setViewSection,
  }), [user, logoutUser, viewSection]);

  // Sélectionne l'écran selon l'état de la salle / la phase de jeu
  function renderScreen() {
    if (!joinedRoom) {
      return (
        <QuizJoinScreen
          connected={connected}
          reconnecting={reconnecting}
          socketError={socketError}
          roomCode={roomCode}
          setRoomCode={setRoomCode}
          joinRoom={joinRoom}
        />
      );
    }

    if (gamePhase === 'lobby') {
      return (
        <QuizLobby
          joinedRoom={joinedRoom}
          socketError={socketError}
          players={players}
          myClientId={myClientId}
          isHost={isHost}
          startGame={startGame}
          leaveRoom={leaveRoom}
        />
      );
    }

    if (gamePhase === 'over') {
      return (
        <QuizLeaderboard
          joinedRoom={joinedRoom}
          finalLeaderboard={finalLeaderboard}
          myClientId={myClientId}
          leaveRoom={leaveRoom}
        />
      );
    }

    return (
      <QuizPlaying
        joinedRoom={joinedRoom}
        reconnecting={reconnecting}
        questionState={questionState}
        timeLeftMs={timeLeftMs}
        players={players}
        myClientId={myClientId}
        myStreak={myStreak}
        submitAnswer={submitAnswer}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <RoleHeader {...headerProps} />
      {renderScreen()}
    </div>
  );
}

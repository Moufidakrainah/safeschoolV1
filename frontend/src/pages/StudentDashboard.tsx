/**
 * StudentDashboard — page principale pour les utilisateurs de rôle 'student'.
 *
 * Gère uniquement la navigation entre sections et le chargement du profil.
 * Délègue le rendu à des composants spécialisés :
 *   - StudentProfile : section profil (infos perso)
 *   - StudentForm    : formulaire multi-étapes de signalement (état via useReportForm)
 *
 * La section 'quiz' est gérée par une redirection via useEffect.
 * L'état de navigation est initialisé depuis le query param ?section= (deeplinks).
 */

// React & libs
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// Contexts & hooks
import { useAuth } from '../context/AuthContext';

// API services
import { getStudentParents } from '../services/api';

// UI components
import StudentHeader from '../components/layout/StudentHeader/StudentHeader';
import StudentProfile from '../components/student/StudentProfile';
import StudentForm from '../components/student/StudentForm';

type StudentSection = 'profile' | 'report' | 'quiz';

export default function StudentDashboard() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();

  // Lecture du query param ?section= pour la prise en charge des liens directs
  const [searchParams] = useSearchParams();
  const [viewSection, setViewSection] = useState<StudentSection>(
    (searchParams.get('section') as StudentSection) ?? 'report'
  );

  // Parents — chargés une seule fois à l'arrivée sur la page
  const [parents, setParents] = useState<any[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setLoadingParents(true);
      getStudentParents(user.id)
        .then(data => setParents(data))
        .catch(() => setParents([]))
        .finally(() => setLoadingParents(false));
    }
  }, [user?.id]);

  useEffect(() => {
    if (viewSection === 'quiz') navigate('/quiz');
  }, [viewSection, navigate]);

  const headerProps = { user, logoutUser, viewSection, setViewSection };

  return (
    <>
      <StudentHeader {...headerProps} />
      {viewSection === 'profile' && (
        <StudentProfile
          user={user}
          parents={parents}
          loadingParents={loadingParents}
        />
      )}
      {viewSection === 'report' && <StudentForm user={user} />}
    </>
  );
}

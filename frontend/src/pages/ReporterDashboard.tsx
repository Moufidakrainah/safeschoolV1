/**
 * ReporterDashboard — page principale pour les utilisateurs de rôle 'teacher' ou 'staff'.
 *
 * Orchestrateur léger : gère uniquement la navigation entre sections et le chargement
 * du profil professionnel. Délègue le rendu à des composants spécialisés :
 *   - ReporterProfile : section profil (infos perso + profil pro)
 *   - ReportForm      : formulaire multi-étapes de signalement (état via useReportForm)
 *
 * La section 'quiz' est gérée par une redirection via useEffect.
 * L'état de navigation est initialisé depuis le query param ?section= (deeplinks).
 */

// React & libs
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Contexts & hooks
import { useAuth } from '../context/AuthContext';

// API services
import { getStaffProfile } from '../services/api';

// UI components
import ReporterHeader from '../components/layout/ReporterHeader/ReporterHeader';
import ReporterProfile from '../components/reporter/ReporterProfile';
import ReportForm from '../components/reporter/ReportForm';



export default function ReporterDashboard() {
  const { user, logoutUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Lecture du query param ?section= pour supporter les liens directs
  const [searchParams] = useSearchParams();
  const [viewSection, setViewSection] = useState<'profile' | 'report' | 'quiz'>(
    (searchParams.get('section') as 'profile' | 'report' | 'quiz') ?? 'report'
  );

  // Profil professionnel — chargé une seule fois à l'arrivée sur la page
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (user?.id) {
      setLoadingProfile(true);
      getStaffProfile(user.id)
        .then(data => setStaffProfile(data))
        .catch(() => setStaffProfile(null))
        .finally(() => setLoadingProfile(false));
    }
  }, [user?.id]);

  useEffect(() => {
    if (viewSection === 'quiz') navigate('/quiz');
  }, [viewSection, navigate]);

  const headerProps = { user, logoutUser, viewSection, setViewSection };

  return (
    <>
      <ReporterHeader {...headerProps} />
      {viewSection === 'profile' && (
        <ReporterProfile
          user={user}
          staffProfile={staffProfile}
          loadingProfile={loadingProfile}
        />
      )}
      {viewSection === 'report' && <ReportForm user={user} />}
    </>
  );
}
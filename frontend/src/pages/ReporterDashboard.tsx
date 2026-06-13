/**
 * ReporterDashboard — page principale pour les utilisateurs de rôle 'teacher' ou 'staff'.
 *
 * Gère uniquement la navigation entre sections et le chargement du profil.
 * Délègue le rendu à des composants spécialisés :
 *   - ReporterProfile : section profil (infos perso + profil pro)
 *   - ReporterForm    : formulaire multi-étapes de signalement (état via useReportForm)
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
import type { StaffProfile } from '../types';

// UI components
// import ReporterHeader from '../components/layout/ReporterHeader/ReporterHeader';
import ReporterProfile from '../components/reporter/ReporterProfile';
import ReporterForm from '../components/reporter/ReporterForm';
import RoleHeader from '@/components/layout/Header/RoleHeader';

export default function ReporterDashboard() {
  const { user, logoutUser } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Lecture du query param ?section= pour la prise en charge des liens directs
  const [searchParams] = useSearchParams();
  const [viewSection, setViewSection] = useState<'profile' | 'report' | 'quiz'>(
    (searchParams.get('section') as 'profile' | 'report' | 'quiz') ?? 'report'
  );

  // Profil professionnel — chargé une seule fois à l'arrivée sur la page
  const [staffProfile, setStaffProfile] = useState<StaffProfile | null>(null);
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


  return (
    <>
      {/* <ReporterHeader {...headerProps} /> */}
    <main className="flex-1 bg-gray-50 font-sans">

		<RoleHeader
			user={user}
			logoutUser={logoutUser}
			reporterViewSection={viewSection}
			reporterSetViewSection={setViewSection}
			/>
      <div className="max-w-5xl mx-auto mt-8 px-5 pb-10">

      {viewSection === 'profile' && (
        <ReporterProfile
          user={user}
          staffProfile={staffProfile}
          loadingProfile={loadingProfile}
        />
      )}
      {viewSection === 'report' && <ReporterForm user={user} />}

      </div>
    </main>
    </>
  );
}

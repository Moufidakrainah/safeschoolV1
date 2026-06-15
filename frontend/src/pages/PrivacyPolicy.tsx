import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/AuthContext';
import RoleHeader from '@/components/layout/Header/RoleHeader';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy()
{
  const { t } = useTranslation();
  const { user, logoutUser } = useAuth();
const navigate = useNavigate();

  const goToAdminSection = (section: 'reports' | 'users' | 'stats' | 'classes') => {
    navigate(`/dashboard?section=${section}`);
  };

  const goToStudentSection = (
    section: 'profile' | 'report' | 'quiz' | 'cases'
  ) => {
    navigate(`/student?section=${section}`);
  };

  const goToReporterSection = (
    section: 'profile' | 'report' | 'quiz'
  ) => {
    navigate(`/reporter?section=${section}`);
  };

  return (
    <div className="flex-1 flex flex-col bg-surface font-sans">
    {/* flex-1 flex flex-col : s'étire dans le layout App (div.flex-1.flex.flex-col) — pas de min-h-screen ici, App gère la hauteur */}
      {/* flex-1 : grandit pour pousser le Footer en bas — fonctionne car le parent est flex-col */}
	      <RoleHeader
        user={user}
        logoutUser={logoutUser}
        {...(user?.role === 'admin' && {
          adminViewSection: 'reports',
          adminSetViewSection: (section: 'reports' | 'users' | 'stats' | 'classes') =>
            goToAdminSection(section),
          adminSetSelected: () => {},
          adminFetchUsers: () => {},
        })}
        {...(user?.role === 'student' && {
          studentViewSection: 'profile',
          studentSetViewSection: (
            section: 'profile' | 'report' | 'quiz' | 'cases'
          ) => goToStudentSection(section),
          studentNotifRefreshKey: 0,
        })}
        {...((user?.role === 'teacher') && {
          reporterViewSection: 'report',
          reporterSetViewSection: (section: 'profile' | 'report' | 'quiz') =>
            goToReporterSection(section),
        })}
      />

      <main className="flex-1 max-w-3xl mx-auto w-full px-6 py-12">
       {!user && ( <Link
          to="/login"
          className="text-primary hover:underline text-sm inline-block mb-8 focus:outline-none focus:ring-2 focus:ring-primary rounded"
        >
          ← {t('footer.backToApp')}
        </Link>
		)}

        <header className="mb-10">
          <h1 className="text-3xl font-bold text-primary">{t('footer.privacy')}</h1>
          <p className="text-gray-500 mt-2 text-sm">{t('privacy.updated')}</p>
        </header>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-3">{t('privacy.s1.title')}</h2>
          <p className="text-gray-700 leading-relaxed">{t('privacy.s1.body')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-3">{t('privacy.s2.title')}</h2>
          <p className="text-gray-700 leading-relaxed mb-3">{t('privacy.s2.intro')}</p>
          <ul className="list-disc list-inside text-gray-700 space-y-1">
            {(t('privacy.s2.items', { returnObjects: true }) as string[]).map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-3">{t('privacy.s3.title')}</h2>
          <p className="text-gray-700 leading-relaxed">{t('privacy.s3.body')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-3">{t('privacy.s4.title')}</h2>
          <p className="text-gray-700 leading-relaxed">{t('privacy.s4.body')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-3">{t('privacy.s5.title')}</h2>
          <p className="text-gray-700 leading-relaxed">{t('privacy.s5.body')}</p>
        </section>

        <section className="mb-8">
          <h2 className="text-xl font-semibold text-primary mb-3">{t('privacy.s6.title')}</h2>
          <p className="text-gray-700 leading-relaxed">{t('privacy.s6.body')}</p>
        </section>

      </main>

    </div>
  );
}

import { useTranslation } from 'react-i18next';
import Header from '../Header/Header';
import type { AuthUser } from '../../../types';

type StudentSection = 'profile' | 'report' | 'quiz';

interface StudentHeaderProps {
  user: AuthUser | null;
  logoutUser: () => void;
  viewSection: StudentSection;
  setViewSection: (s: StudentSection) => void;
}

export default function StudentHeader({
  user,
  logoutUser,
  viewSection,
  setViewSection,
}: StudentHeaderProps) {
  const { t } = useTranslation();

  const navItems: { key: StudentSection; label: string }[] = [
    { key: 'profile'  as const, label: t('student.nav.profile') },
    { key: 'report',   label: t('student.nav.report') },
    { key: 'quiz',     label: t('student.nav.quiz') },
  ];

  return (
    <header>
      <Header user={user} logoutUser={logoutUser} />

      <nav
        className="bg-primary px-8 py-4 flex items-center gap-8"
        aria-label={t('student.nav.ariaLabel')}
      >
        <img src="/logos/safeschool-logo.png" alt="SafeSchool" className="h-8" />
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setViewSection(item.key)}
            aria-current={viewSection === item.key ? 'page' : undefined}
            className={`font-bold text-sm transition-opacity ${
              viewSection === item.key
                ? 'text-white underline underline-offset-4'
                : 'text-white/80 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}
import { useTranslation } from 'react-i18next';
import Header from '@/components/layout/Header/Header';
import type { AuthUser } from '@/types';

type ReporterSection = 'profile' | 'report' | 'quiz';

interface ReporterHeaderProps {
  user: AuthUser | null;
  logoutUser: () => void;
  viewSection: ReporterSection;
  setViewSection: (s: ReporterSection) => void;
}

export default function ReporterHeader({
  user,
  logoutUser,
  viewSection,
  setViewSection,
}: ReporterHeaderProps) {
  const { t } = useTranslation();

  const navItems: { key: ReporterSection; label: string }[] = [
	{ key: 'profile'  as const, label: t('reporter.nav.profile') },
    { key: 'report',   label: t('reporter.nav.report') },
    { key: 'quiz',     label: t('reporter.nav.quiz') },
  ];

  return (
    <header>
      <Header user={user} logoutUser={logoutUser} />

      <nav
        className="bg-primary px-8 py-0 flex items-center gap-8"
        aria-label={t('reporter.nav.ariaLabel')}
      >
        <img src="/logos/safeschool-logo.png" alt="SafeSchool" className="h-16" />
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
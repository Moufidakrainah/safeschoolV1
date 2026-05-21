import { useTranslation } from 'react-i18next';
import Header from '../Header/Header';
import type { AuthUser } from '../../../types';
import type { Report } from '../../../types';

interface AdminHeaderProps {
  user: AuthUser | null;
  logoutUser: () => void;
  viewSection: 'reports' | 'users' | 'stats';
  setViewSection: (s: 'reports' | 'users' | 'stats') => void;
//   setSelected: (r: Report | null) => void;
  fetchUsers: () => void;
}

export default function AdminHeader({
  user,
  logoutUser,
  viewSection,
  setViewSection,
//   setSelected,
  fetchUsers,
}: AdminHeaderProps) {
  const { t } = useTranslation();

  const navItems: { key: 'reports' | 'users' | 'stats'; label: string; onClick: () => void }[] = [
    { key: 'reports', label: t('admin.nav.reports'), onClick: () => {  setViewSection('reports'); } },
    { key: 'users',   label: t('admin.nav.users'),   onClick: () => {  setViewSection('users'); fetchUsers(); } },
    { key: 'stats',   label: t('admin.nav.stats'),   onClick: () => { setViewSection('stats'); } },
  ];

  return (
    <header>
      <Header user={user} logoutUser={logoutUser} />

      <nav
        className="bg-primary px-8 py-0 flex items-center gap-8"
        aria-label={t('admin.nav.ariaLabel')}
      >
        <img src="/logos/safeschool-logo.png" alt="SafeSchool" className="h-16"/>
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={item.onClick}
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
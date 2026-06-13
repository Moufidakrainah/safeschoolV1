import { useTranslation } from 'react-i18next';
import Header from '@/components/layout/Header/Header';
import type { AuthUser } from '@/types';

interface AdminHeaderProps {
  user: AuthUser | null;
  logoutUser: () => void;
  viewSection: 'reports' | 'users' | 'stats' | 'classes';
  setViewSection: (s: 'reports' | 'users' | 'stats' | 'classes') => void;
  setSelected: (r: Report | null) => void;
  setView: (v: 'list' | 'detail') => void;
  fetchUsers: () => void;
}

export default function AdminHeader({
  user, logoutUser, viewSection, setViewSection, setSelected, setView, fetchUsers,
}: AdminHeaderProps) {
  const { t } = useTranslation();

  const navItems: { key: 'reports' | 'users' | 'stats' | 'classes'; label: string; onClick: () => void }[] = [
    { key: 'reports', label: t('admin.nav.reports'), onClick: () => { setViewSection('reports'); setSelected(null); setView('list'); } },
    { key: 'users',   label: t('admin.nav.users'),   onClick: () => { setView('list'); setSelected(null); setViewSection('users'); fetchUsers(); } },
    { key: 'classes', label: t('admin.nav.classes'),               onClick: () => { setViewSection('classes'); setSelected(null); setView('list'); } },
    { key: 'stats',   label: t('admin.nav.stats'),   onClick: () => { setViewSection('stats'); setSelected(null); setView('list'); } },
    
  ];

  return (
    <header>
      <Header user={user} logoutUser={logoutUser} />
      <nav className="bg-primary px-8 py-0 flex items-center gap-8" aria-label={t('admin.nav.ariaLabel')}>
        <img src="/logos/safeschool-logo.png" alt="SafeSchool" className="h-16"/>
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={item.onClick}
            aria-current={viewSection === item.key ? 'page' : undefined}
            className={`font-bold text-sm transition-opacity ${
              viewSection === item.key ? 'text-white underline underline-offset-4' : 'text-white/80 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

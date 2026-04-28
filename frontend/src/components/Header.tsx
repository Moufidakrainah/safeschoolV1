import Button from './Button';

interface HeaderProps {
  user: any;
  logoutUser: () => void;
  viewSection: 'reports' | 'users' | 'stats';
  setViewSection: (v: 'reports' | 'users' | 'stats') => void;
  setSelected: (v: any) => void;
  fetchUsers: () => void;
  t: (key: string) => string;
}

export default function ReporterHeader({
  user,
  logoutUser,
  viewSection,
  setViewSection,
  setSelected,
  fetchUsers,
  t
}: HeaderProps) {

  const navItems = [
    { key: 'reports', label: t('admin.nav.reports'), onClick: () => { setSelected(null); setViewSection('reports'); } },
    { key: 'users',   label: t('admin.nav.users'),   onClick: () => { setSelected(null); setViewSection('users'); fetchUsers(); } },
    { key: 'stats',   label: t('admin.nav.stats'),   onClick: () => { setSelected(null); setViewSection('stats'); } }
  ];

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : '';

  return (
    <header>
      {/* Bandeau utilisateur */}
      <div className="px-8 py-2 bg-surface flex items-center">
        <div className="flex-1" />
        <span className="text-gray-800 font-bold text-sm" aria-live="polite">
          {t('admin.topbar.role').replace('{{role}}', roleLabel)}
          {user?.firstName ? ` — ${user.firstName} ${user.lastName?.toUpperCase() ?? ''}` : ''}
        </span>
        <div className="flex-1 flex justify-end">
          <Button variant="outline" onClick={logoutUser}>
            {t('nav.logout')}
          </Button>
        </div>
      </div>

      {/* Barre de navigation */}
      <nav className="bg-primary px-8 py-4 flex items-center gap-8" aria-label={t('admin.nav.ariaLabel')}>
        <img src="/logos/safeschool-logo.png" alt="SafeSchool" className="h-8" />
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

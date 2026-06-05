import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';
import Header from '../Header/Header';
import { getUnreadCount } from '../../../services/api';
import type { AuthUser } from '../../../types';

type StudentSection = 'profile' | 'report' | 'quiz' | 'cases';

interface StudentHeaderProps {
  user: AuthUser | null;
  logoutUser: () => void;
  viewSection: StudentSection;
  setViewSection: (s: StudentSection) => void;
  notifRefreshKey?: number;
}

export default function StudentHeader({ user, logoutUser, viewSection, setViewSection, notifRefreshKey = 0 }: StudentHeaderProps) {
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchCount = useCallback(async () => {
    try {
      const data = await getUnreadCount();
      setUnreadCount(data.count ?? 0);
    } catch { setUnreadCount(0); }
  }, []);

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  useEffect(() => {
    if (notifRefreshKey > 0) fetchCount();
  }, [notifRefreshKey, fetchCount]);

  const navItems: { key: StudentSection; label: string }[] = [
    { key: 'profile', label: t('student.nav.profile') },
    { key: 'report',  label: t('student.nav.report') },
    { key: 'cases',   label: 'Mes dossiers' },
    { key: 'quiz',    label: t('student.nav.quiz') },
  ];

  return (
    <header>
      <Header user={user} logoutUser={logoutUser} />
      <nav className="bg-primary px-8 py-0 flex items-center gap-8" aria-label={t('student.nav.ariaLabel')}>
        <img src="/logos/safeschool-logo.png" alt="SafeSchool" className="h-16" />
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setViewSection(item.key)}
            aria-current={viewSection === item.key ? 'page' : undefined}
            className={`font-bold text-sm transition-opacity flex items-center gap-1 ${
              viewSection === item.key ? 'text-white underline underline-offset-4' : 'text-white/80 hover:text-white'
            }`}
          >
            {item.label}
            {/* Badge rouge sur Mes dossiers */}
            {item.key === 'cases' && unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {unreadCount}
              </span>
            )}
          </button>
        ))}
      </nav>
    </header>
  );
}
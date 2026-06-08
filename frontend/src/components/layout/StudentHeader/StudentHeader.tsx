import { useTranslation } from 'react-i18next';
import { useEffect, useState, useCallback } from 'react';
import Header from '../Header/Header';
import { getNotifications, getUnreadCount, markNotificationRead } from '../../../services/api';
import type { AuthUser } from '../../../types';

type StudentSection = 'profile' | 'report' | 'quiz' | 'cases';

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface StudentHeaderProps {
  user: AuthUser | null;
  logoutUser: () => void;
  viewSection: StudentSection;
  setViewSection: (s: StudentSection) => void;
  notifRefreshKey?: number;
  onNotifRefresh?: () => void;
}

export default function StudentHeader({ 
	user, logoutUser, viewSection, setViewSection, notifRefreshKey = 0, onNotifRefresh }: StudentHeaderProps) {
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const fetchNotifs = useCallback(async () => {
    try {
      const [countData, notifs] = await Promise.all([getUnreadCount(), getNotifications()]);
      setUnreadCount(prev => {
        if (prev !== (countData.count ?? 0)) onNotifRefresh?.();
        return countData.count ?? 0;
      });
      setNotifications(notifs);
    } catch {
      setUnreadCount(0);
      setNotifications([]);
    }
  }, [onNotifRefresh]);

  useEffect(() => {
    fetchNotifs();
    const interval = setInterval(fetchNotifs, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifs]);

  useEffect(() => {
    if (notifRefreshKey > 0) fetchNotifs();
  }, [notifRefreshKey, fetchNotifs]);

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        await markNotificationRead(notif.id);
        setUnreadCount(prev => Math.max(0, prev - 1));
        setNotifications(prev =>
          prev.map(n => n.id === notif.id ? { ...n, isRead: true } : n)
        );
        onNotifRefresh?.();
      } catch {}
    }
  };

  const navItems: { key: StudentSection; label: string }[] = [
    { key: 'profile', label: t('student.nav.profile') },
    { key: 'report',  label: t('student.nav.report') },
    { key: 'cases',   label: 'Mes dossiers' },
    { key: 'quiz',    label: t('student.nav.quiz') },
  ];

  return (
    <header>
      <Header
        user={user}
        logoutUser={logoutUser}
        notifications={notifications}
        unreadCount={unreadCount}
        onNotifClick={handleNotifClick}
      />
      <nav className="bg-primary px-8 py-0 flex items-center gap-8" aria-label={t('student.nav.ariaLabel')}>
        <img src="/logos/safeschool-logo.png" alt="SafeSchool" className="h-16" />
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={() => setViewSection(item.key)}
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
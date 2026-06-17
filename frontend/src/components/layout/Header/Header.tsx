import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import type { AuthUser } from '@/types';

interface Notification {
  id: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface HeaderProps {
  user: AuthUser | null;
  logoutUser: () => void;
  notifications?: Notification[];
  unreadCount?: number;
  onNotifClick?: (notif: Notification) => void;
}

// Map des labels FR backend → clés badge i18n
const STATUS_FR_TO_KEY: Record<string, string> = {
  'Nouveau':           'badge.new',
  'En cours':          'badge.in_progress',
  'En attente':        'badge.pending',
  'Résolu':            'badge.resolved',
  'Faux signalement':  'badge.false_report',
  'Clôturé':           'badge.closed',
  'Rejeté':            'badge.rejected',
};

function formatNotifMessage(message: string, t: (key: string, opts?: Record<string, unknown>) => string): string {
  // ── Convocation ──
  if (message.startsWith('Convocation : ')) {
    const content = message.replace('Convocation : ', '');
    const anonymized = content.replace(/^.+? est convoqué\(e\) le /, t('student.cases.summoned'));
    return `${t('noteblock.convocation').trim()} : ${anonymized}`;
  }

  // ── Changement de statut ──
  // Format backend : "Statut de votre dossier #XXXX mis à jour : LABEL"
  const statusMatch = message.match(/^Statut de votre dossier (#\S+) mis à jour : (.+)$/);
  if (statusMatch) {
    const caseNumber = statusMatch[1];
    const statusLabelFR = statusMatch[2].trim();
    const badgeKey = STATUS_FR_TO_KEY[statusLabelFR];
    const translatedStatus = badgeKey ? t(badgeKey).trim() : statusLabelFR;
    return t('notifications.statusUpdate', { caseNumber, status: translatedStatus });
  }

  return message;
}

export default function Header({ user, logoutUser, notifications = [], unreadCount = 0, onNotifClick }: HeaderProps) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : '';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="px-8 py-2 bg-surface flex items-center">
      <div className="flex-1" />
      <span className="text-gray-800 font-bold text-sm" aria-live="polite">
        {t('admin.topbar.role', { role: roleLabel })}
        {user?.firstName ? ` — ${user.firstName} ${user.lastName?.toUpperCase() ?? ''}` : ''}
      </span>
      <div className="flex-1 flex justify-end items-center gap-3">

        {onNotifClick && (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setOpen(o => !o)}
              className="relative p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label={t('notifications.notifs')}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center leading-none">
                  {unreadCount}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 top-10 w-80 bg-white rounded-lg shadow-lg border border-gray-100 z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-semibold text-gray-800">{t('notifications.notifs')}</p>
                </div>
                {notifications.length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-6">{t('notifications.no')}</p>
                ) : (
                  <ul className="max-h-72 overflow-y-auto divide-y divide-gray-50">
                    {notifications.map(notif => (
                      <li
                        key={notif.id}
                        onClick={() => { onNotifClick(notif); setOpen(false); }}
                        className={`px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors ${!notif.isRead ? 'bg-blue-50/50' : ''}`}
                      >
                        <p className={`text-sm ${!notif.isRead ? 'font-bold text-gray-800' : 'text-gray-500'}`}>
                          {formatNotifMessage(notif.message, t)}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {new Date(notif.createdAt).toLocaleDateString('fr-FR')}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>
        )}

        <Button variant="outline" onClick={logoutUser}>
          {t('nav.logout')}
        </Button>
      </div>
    </div>
  );
}
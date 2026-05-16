import React from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '../../ui/button';
import type { AuthUser } from '../../../types';

interface HeaderProps {
  user: AuthUser | null;
  logoutUser: () => void;
}

export default function Header({ user, logoutUser }: HeaderProps) {
  const { t } = useTranslation();

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : '';

  return (
    <div className="px-8 py-2 bg-surface flex items-center">
      <div className="flex-1" />
      <span className="text-gray-800 font-bold text-sm" aria-live="polite">
        {t('admin.topbar.role', { role: roleLabel })}
        {user?.firstName ? ` — ${user.firstName} ${user.lastName?.toUpperCase() ?? ''}` : ''}
      </span>
      <div className="flex-1 flex justify-end">
        <Button variant="outline" onClick={logoutUser}>
          {t('nav.logout')}
        </Button>
      </div>
    </div>
  );
}
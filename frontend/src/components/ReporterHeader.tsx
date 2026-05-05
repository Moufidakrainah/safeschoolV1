import Button from './Button';

interface ReporterHeaderProps {
  user: any;
  logoutUser: () => void;
  onCancel?: () => void;
  showCancel?: boolean;
  t: (key: string) => string;
}

export default function ReporterHeader({ user, logoutUser, onCancel, showCancel = false, t }: ReporterHeaderProps) {
  const roleLabel = user?.role === 'teacher'
    ? t('reporter.roles.teacher')
    : t('reporter.roles.staff');

  return (
    <header className="bg-white px-8 py-4 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-1">
        <span className="font-extrabold text-xl text-primary">{t('reporter.header.brand1')}</span>
        <span className="font-extrabold text-xl text-gray-800">{t('reporter.header.brand2')}</span>
      </div>
      <div className="flex items-center gap-4">
        {!showCancel ? (
          <>
            <span className="text-xs bg-surface text-primary px-3 py-1 rounded-full font-semibold">
              {roleLabel}
            </span>
            <span className="text-sm text-gray-500">
              {user?.firstName} {user?.lastName}
            </span>
            <Button variant="outline" onClick={logoutUser}>
              {t('nav.logout')}
            </Button>
          </>
        ) : (
          <button
            onClick={onCancel}
            className="bg-transparent border-none cursor-pointer text-sm text-gray-500 hover:text-gray-800 transition-colors"
            aria-label={t('common.cancel')}
          >
            {t('common.cancel')}
          </button>
        )}
      </div>
    </header>
  );
}

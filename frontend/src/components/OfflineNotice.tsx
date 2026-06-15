/* État vide affiché à la place d'un contenu qui n'a pas pu être chargé hors ligne */
import { WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function OfflineNotice() {
  const { t } = useTranslation();

  return (
    <div
      role="status"
      className="flex flex-col items-center gap-3 rounded-sm border border-amber-200 bg-amber-50 px-6 py-10 text-center"
    >
      <WifiOff aria-hidden="true" className="h-8 w-8 text-amber-500" />
      <p className="text-sm text-amber-800">{t('offline.contentUnavailable')}</p>
    </div>
  );
}

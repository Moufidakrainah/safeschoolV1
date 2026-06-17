/* Bandeau global affiché sur toutes les pages lorsque l'utilisateur est hors ligne */
import { memo } from "react";
import { useTranslation } from "react-i18next";
import { WifiOff } from "lucide-react";
import { useOnlineStatus } from "../../../hooks/useOnlineStatus";

export const OfflineBanner = memo(function OfflineBanner() {
  const { t } = useTranslation();
  const online = useOnlineStatus();

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-0 inset-x-0 z-[1000] flex items-center justify-center gap-2 bg-amber-500 px-4 py-2 text-sm font-medium text-amber-950 shadow-md"
    >
      <WifiOff aria-hidden="true" className="h-4 w-4 shrink-0" />
      <span>{t("offline.message")}</span>
    </div>
  );
});

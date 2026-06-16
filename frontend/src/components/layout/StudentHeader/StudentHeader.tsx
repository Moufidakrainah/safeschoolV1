import { useTranslation } from "react-i18next";
import { useEffect, useState, useCallback, useRef } from "react";
import Header from "@/components/layout/Header/Header";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
} from "@/services/api";
import { useReconnectKey } from "@/hooks/useOnlineStatus";
import type { AuthUser } from "@/types";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type StudentSection = "profile" | "report" | "quiz" | "cases";

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
  user,
  logoutUser,
  viewSection,
  setViewSection,
  notifRefreshKey = 0,
  onNotifRefresh,
}: StudentHeaderProps) {
  const { t } = useTranslation();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const prevCountRef = useRef(0);

  const reconnectKey = useReconnectKey();

  const fetchNotifs = useCallback(async () => {
    // Hors ligne : on saute le rafraîchissement et on garde le dernier état connu
    if (typeof navigator !== "undefined" && !navigator.onLine) return;
    try {
      const [countData, notifs] = await Promise.all([
        getUnreadCount(),
        getNotifications(),
      ]);
      const newCount = countData.count ?? 0;

      // ── Comparer AVANT le setState pour éviter setState dans setState ──
      if (prevCountRef.current !== newCount) {
        prevCountRef.current = newCount;
        // onNotifRefresh appelé en dehors du setter
        onNotifRefresh?.();
      }

      setUnreadCount(newCount);
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

  // Rafraîchit les notifications dès le retour de la connexion
  useEffect(() => {
    if (reconnectKey > 0) fetchNotifs();
  }, [reconnectKey, fetchNotifs]);

  const handleNotifClick = async (notif: Notification) => {
    if (!notif.isRead) {
      try {
        await markNotificationRead(notif.id);
        setUnreadCount((prev) => Math.max(0, prev - 1));
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)),
        );
        onNotifRefresh?.();
      } catch {
        /* erreur réseau silencieuse volontaire */
      }
    }
  };

  const navItems: { key: StudentSection; label: string }[] = [
    { key: "profile", label: t("student.nav.profile") },
    { key: "report", label: t("student.nav.report") },
    { key: "cases", label: t("student.nav.cases") },
    { key: "quiz", label: t("student.nav.quiz") },
  ];

  function NavButtons({ isMobile }: { isMobile?: boolean }) {
    return (
      <>
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setViewSection(item.key)}
            className={
              isMobile
                ? "text-left text-lg font-semibold text-white"
                : `font-bold text-sm transition-opacity ${
                    viewSection === item.key
                      ? "text-white underline underline-offset-4"
                      : "text-white/80 hover:text-white"
                  }`
            }
          >
            {item.label}
          </button>
        ))}
      </>
    );
  }

  return (
    <header className="w-full flex flex-col">
      <Header
        user={user}
        logoutUser={logoutUser}
        notifications={notifications}
        unreadCount={unreadCount}
        onNotifClick={handleNotifClick}
      />

      {/* Mobile menu */}
      <div className="md:hidden bg-primary px-4 py-2 flex items-center justify-between">
        <img
          src="/logos/safeschool-logo.png"
          alt="SafeSchool"
          className="h-10"
        />

        <Sheet>
          <SheetTrigger>
            <Menu className="text-white h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="p-4 bg-primary text-white">
            <nav className="flex flex-col gap-4">
              <NavButtons isMobile />
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop */}
      <nav className="bg-primary px-8 py-0 hidden md:flex items-center gap-8">
        <img
          src="/logos/safeschool-logo.png"
          alt="SafeSchool"
          className="h-10 md:h-14"
        />
        <NavButtons />
      </nav>
    </header>
  );
}

import { useTranslation } from "react-i18next";
import Header from "@/components/layout/Header/Header";
import type { AuthUser } from "@/types";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface AdminHeaderProps {
  user: AuthUser | null;
  logoutUser: () => void;
  viewSection: "reports" | "users" | "stats" | "classes";
  setViewSection: (s: "reports" | "users" | "stats" | "classes") => void;
  setSelected: (r: Report | null) => void;
  setView: (v: "list" | "detail") => void;
  fetchUsers: () => void;
}

export default function AdminHeader({
  user,
  logoutUser,
  viewSection,
  setViewSection,
  setSelected,
  setView,
  fetchUsers,
}: AdminHeaderProps) {
  const { t } = useTranslation();

  const navItems: {
    key: "reports" | "users" | "stats" | "classes";
    label: string;
    onClick: () => void;
  }[] = [
    {
      key: "reports",
      label: t("admin.nav.reports"),
      onClick: () => {
        setViewSection("reports");
        setSelected(null);
        setView("list");
      },
    },
    {
      key: "users",
      label: t("admin.nav.users"),
      onClick: () => {
        setView("list");
        setSelected(null);
        setViewSection("users");
        fetchUsers();
      },
    },
    {
      key: "classes",
      label: t("admin.nav.classes"),
      onClick: () => {
        setViewSection("classes");
        setSelected(null);
        setView("list");
      },
    },
    {
      key: "stats",
      label: t("admin.nav.stats"),
      onClick: () => {
        setViewSection("stats");
        setSelected(null);
        setView("list");
      },
    },
  ];

  function NavButtons({ isMobile }: { isMobile?: boolean }) {
    return (
      <>
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => item.onClick?.()}
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
      <Header user={user} logoutUser={logoutUser} />

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

import { useTranslation } from "react-i18next";
import { useState } from "react";
import Header from "@/components/layout/Header/Header";
import type { AuthUser } from "@/types";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type AdminSection = "reports" | "users" | "stats" | "classes";
type AdminNavItem = { key: AdminSection; label: string; onClick: () => void };

interface AdminHeaderProps {
  user: AuthUser | null;
  logoutUser: () => void;
  viewSection: AdminSection;
  setViewSection: (s: AdminSection) => void;
  setSelected: (r: Report | null) => void;
  setView: (v: "list" | "detail") => void;
  fetchUsers: () => void;
  onLogoClick?: () => void;
}

function NavButtons({
  isMobile,
  navItems,
  viewSection,
  setMenuOpen,
}: {
  isMobile?: boolean;
  navItems: AdminNavItem[];
  viewSection: AdminSection;
  setMenuOpen: (open: boolean) => void;
}) {
  return (
    <>
      {navItems.map((item) => (
        <button
          key={item.key}
          onClick={() => {
            item.onClick?.();
            if (isMobile) setMenuOpen(false);
          }}
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

export default function AdminHeader({
  user,
  logoutUser,
  viewSection,
  setViewSection,
  setSelected,
  setView,
  fetchUsers,
  onLogoClick,
}: AdminHeaderProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems: AdminNavItem[] = [
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

  return (
    <header className="w-full flex flex-col">
      <Header user={user} logoutUser={logoutUser} />

      {/* Mobile menu */}
      <div className="md:hidden bg-primary px-4 py-2 flex items-center justify-between">
        <img
          src="/logos/safeschool-logo.png"
          alt="SafeSchool"
          className="h-10 cursor-pointer"
          onClick={() =>
            onLogoClick ? onLogoClick() : setViewSection("reports")
          }
        />

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetTrigger onClick={() => setMenuOpen(true)}>
            <Menu className="text-white h-6 w-6" />
          </SheetTrigger>
          <SheetContent side="left" className="p-4 bg-primary text-white">
            <nav className="flex flex-col gap-4">
              <NavButtons
                isMobile
                navItems={navItems}
                viewSection={viewSection}
                setMenuOpen={setMenuOpen}
              />
            </nav>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop */}
      <nav className="bg-primary px-8 py-0 hidden md:flex items-center gap-8">
        <img
          src="/logos/safeschool-logo.png"
          alt="SafeSchool"
          className="h-10 md:h-14 cursor-pointer"
          onClick={() =>
            onLogoClick ? onLogoClick() : setViewSection("reports")
          }
        />
        <NavButtons
          navItems={navItems}
          viewSection={viewSection}
          setMenuOpen={setMenuOpen}
        />
      </nav>
    </header>
  );
}

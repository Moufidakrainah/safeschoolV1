import { useTranslation } from "react-i18next";
import { useState } from "react";
import Header from "@/components/layout/Header/Header";
import type { AuthUser } from "@/types";
import { Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

type ReporterSection = "profile" | "report" | "quiz";

interface ReporterHeaderProps {
  user: AuthUser | null;
  logoutUser: () => void;
  viewSection: ReporterSection;
  setViewSection: (s: ReporterSection) => void;
}

function NavButtons({
  isMobile,
  navItems,
  viewSection,
  setViewSection,
  setMenuOpen,
}: {
  isMobile?: boolean;
  navItems: { key: ReporterSection; label: string }[];
  viewSection: ReporterSection;
  setViewSection: (s: ReporterSection) => void;
  setMenuOpen: (open: boolean) => void;
}) {
  return (
    <>
      {navItems.map((item) => (
        <button
          key={item.key}
          onClick={() => {
            setViewSection(item.key);
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

export default function ReporterHeader({
  user,
  logoutUser,
  viewSection,
  setViewSection,
}: ReporterHeaderProps) {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems: { key: ReporterSection; label: string }[] = [
    { key: "profile" as const, label: t("reporter.nav.profile") },
    { key: "report", label: t("reporter.nav.report") },
    { key: "quiz", label: t("reporter.nav.quiz") },
  ];

  return (
    <header className="w-full flex flex-col">
      <Header user={user} logoutUser={logoutUser} />

      {/* Mobile menu */}
      <div className="md:hidden bg-primary px-4 py-2 flex items-center justify-between">
        <img
          src="/logos/safeschool-logo.png"
          alt="SafeSchool"
          className="h-10"
		  onClick={() => setViewSection('report')}
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
                setViewSection={setViewSection}
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
          className="h-10 md:h-14"
		  onClick={() => setViewSection('report')}
        />
        <NavButtons
          navItems={navItems}
          viewSection={viewSection}
          setViewSection={setViewSection}
          setMenuOpen={setMenuOpen}
        />
      </nav>
    </header>
  );
}

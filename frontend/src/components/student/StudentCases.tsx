import { useState, useEffect } from "react";
import {
  getNotifications,
  markNotificationRead,
  getAllReports,
  getNotes,
  isOfflineError,
} from "@/services/api";
import OfflineNotice from "@/components/OfflineNotice";
import { useReconnectKey } from "@/hooks/useOnlineStatus";
import { Badge } from "@/components/ui/badge";
import { useTranslation } from "react-i18next";
import type { AuthUser, Report, Note, BadgeVariant } from "@/types";

const statusToBadgeVariant = (status: string) => {
  const map: Record<string, string> = {
    new: "new",
    in_progress: "in_progress",
    pending: "pending",
    resolved: "resolved",
    false_report: "false_report",
  };
  return map[status] ?? "new";
};

// Map type backend → clé i18n
const TYPE_MAP: Record<string, string> = {
  physique: "reporter.step2.physical",
  verbal: "reporter.step2.verbal",
  cyber: "reporter.step2.cyber",
  exclusion: "reporter.step2.exclusion",
  sexuel: "reporter.step2.sexual",
};

// Map labels FR statut backend → clés badge i18n
const STATUS_FR_TO_KEY: Record<string, string> = {
  Nouveau: "badge.new",
  "En cours": "badge.in_progress",
  "En attente": "badge.pending",
  Résolu: "badge.resolved",
  "Faux signalement": "badge.false_report",
  Clôturé: "badge.closed",
  Rejeté: "badge.rejected",
};

const MONTHS_FR: Record<string, number> = {
  janvier: 1,
  février: 2,
  mars: 3,
  avril: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  août: 8,
  septembre: 9,
  octobre: 10,
  novembre: 11,
  décembre: 12,
};

function parseConvocation(content: string) {
  const dateMatch = content.match(
    /(\d{1,2})\s+([a-záàâäéèêëíìîïóòôöúùûüç]+)\s+(\d{4})\s+à\s+(\d{1,2}):(\d{2})/,
  );
  const parts = content.split("\n\n");
  const message = parts.slice(1).join("\n\n").trim();

  if (!dateMatch) {
    return {
      isPast: true,
      displayDate: content.split("\n")[0].replace("📅", "").trim(),
      message,
    };
  }

  const [, day, monthStr, year, hours, minutes] = dateMatch;
  const monthNum = MONTHS_FR[monthStr.toLowerCase()];
  if (!monthNum) {
    return {
      isPast: true,
      displayDate: `${day} ${monthStr} ${year} à ${hours}:${minutes}`,
      message,
    };
  }

  const rdvDate = new Date(
    Number(year),
    monthNum - 1,
    Number(day),
    Number(hours),
    Number(minutes),
  );
  const isPast = rdvDate < new Date();
  const displayDate = `${String(day).padStart(2, "0")}/${String(monthNum).padStart(2, "0")}/${year} à ${hours}h${minutes}`;
  return { isPast, displayDate, message };
}

interface StudentCasesProps {
  user: AuthUser | null;
  onNotifRefresh?: () => void;
  refreshKey?: number;
}

export default function StudentCases({
  user,
  onNotifRefresh,
  refreshKey = 0,
}: StudentCasesProps) {
  const { t } = useTranslation();
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [loadFailedOffline, setLoadFailedOffline] = useState(false);
  const [reportNotes, setReportNotes] = useState<Record<string, Note[]>>({});
  const [unreadNotifs, setUnreadNotifs] = useState<
    Record<
      string,
      Note & {
        id: string;
        isRead: boolean;
        report?: { id: string };
        message?: string;
      }
    >
  >({});
  const reconnectKey = useReconnectKey();

  useEffect(() => {
    if (!user?.id) return;
    setLoadingReports(true);

    Promise.all([getAllReports(), getNotifications()])
      .then(async ([all, notifs]) => {
        const mine = all.filter((r: Report) => r.reporter === "victime");
        setMyReports(
          mine.sort(
            (a: Report, b: Report) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
          ),
        );

        const notesMap: Record<string, Note[]> = {};
        await Promise.all(
          mine.map(async (r: Report) => {
            try {
              const notes = await getNotes(r.id);
              notesMap[r.id] = notes.filter(
                (n: Note) =>
                  n.type === "convocation" || n.type === "status_change",
              );
            } catch {
              notesMap[r.id] = [];
            }
          }),
        );
        setReportNotes(notesMap);

        const unreadMap: Record<
          string,
          Note & {
            id: string;
            isRead: boolean;
            report?: { id: string };
            message?: string;
          }
        > = {};
        notifs
          .filter((n: Note & { isRead: boolean }) => !n.isRead)
          .forEach(
            (
              n: Note & {
                isRead: boolean;
                message?: string;
                report?: { id: string };
              },
            ) => {
              unreadMap[n.id] = n;
            },
          );
        setUnreadNotifs(unreadMap);
        setLoadFailedOffline(false);
      })
      .catch((err) => {
        setMyReports([]);
        setLoadFailedOffline(isOfflineError(err));
      })
      .finally(() => setLoadingReports(false));
  }, [user?.id, refreshKey, reconnectKey]);

  const findUnreadNotifForNote = (note: Note, reportId: string) => {
    return (
      Object.values(unreadNotifs).find((n) => {
        if (n.report?.id !== reportId) return false;
        const noteContent = note.content.replace("📅 ", "").trim();
        const notifMsg = (n.message ?? "").replace("Convocation : ", "").trim();
        return (
          notifMsg.includes(noteContent.split("\n\n")[0].trim()) ||
          noteContent.includes(notifMsg.split("\n\n")[0].trim())
        );
      }) ?? null
    );
  };

  const handleConvocationClick = async (
    notif: Note & { id: string; isRead: boolean },
  ) => {
    if (!notif) return;
    try {
      await markNotificationRead(notif.id);
      setUnreadNotifs((prev) => {
        const updated = { ...prev };
        delete updated[notif.id];
        return updated;
      });
      onNotifRefresh?.();
    } catch {
      /* erreur réseau silencieuse volontaire */
    }
  };

  // ── Formater le contenu d'une note status_change ──
  const formatStatusNote = (content: string): string => {
    // Format backend : "Statut mis à jour : LABEL — DATE"
    const match = content.match(/^Statut mis à jour : (.+) — (.+)$/);
    if (!match) return content;
    const [, labelFR, date] = match;
    const badgeKey = STATUS_FR_TO_KEY[labelFR.trim()];
    const translatedStatus = badgeKey ? t(badgeKey).trim() : labelFR;
    return t("student.cases.statusUpdate", { status: translatedStatus, date });
  };

  return (
    <section className="page-section">
      {loadingReports ? (
        <p className="text-center py-10 text-gray-400">
          {t("student.cases.loading")}
        </p>
      ) : loadFailedOffline ? (
        <OfflineNotice />
      ) : myReports.length === 0 ? (
        <div className="bg-surface shadow-sm rounded-sm px-6 py-10 text-center">
          <p className="text-gray-400 text-sm">{t("student.cases.noReport")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {myReports.map((report: Report) => {
            const notes = reportNotes[report.id] ?? [];

            return (
              <li key={report.id} className="bg-surface px-6 py-5 shadow-sm">
                {/* En-tête */}
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <span className="card-title">{report.caseNumber}</span>
                    <p className="card-subtitle mt-1 mb-2">
                      {t(TYPE_MAP[report.type] ?? report.type)} -{" "}
                      {t("student.cases.iAmVictim")}
                    </p>
                    <p className="card-meta">
                      {new Date(report.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Badge
                    variant={
                      statusToBadgeVariant(report.status) as BadgeVariant
                    }
                  />
                </div>

                {/* Notes */}
                {notes.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">
                    {t("student.cases.noUpdate")}
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 mt-2">
                    {notes.map((note: Note) => {
                      // ── Changement de statut ──
                      if (note.type === "status_change") {
                        return (
                          <div
                            key={note.id}
                            style={{
                              borderLeft: "3px solid var(--color-primary)",
                            }}
                            className="p-3 bg-white"
                          >
                            <p className="text-sm">
                              {formatStatusNote(note.content)}
                            </p>
                          </div>
                        );
                      }

                      // ── Convocation ──
                      const { isPast, displayDate, message } = parseConvocation(
                        note.content,
                      );
                      const unreadNotif = !isPast
                        ? findUnreadNotifForNote(note, report.id)
                        : null;
                      const isNew = !!unreadNotif;

                      return (
                        <div
                          key={note.id}
                          onClick={() =>
                            isNew && handleConvocationClick(unreadNotif)
                          }
                          style={{
                            borderLeft: "3px solid var(--color-warning)",
                          }}
                          className="p-3 bg-indigo-50"
                        >
                          {isPast ? (
                            <p className="text-gray-400 text-sm">
                              {t("student.cases.meeting")}
                              <strong>{displayDate}</strong>
                            </p>
                          ) : (
                            <div>
                              <div className="flex justify-between">
                                <span className="text-xs font-semibold">
                                  {t("noteblock.convocation")}
                                </span>
                                {isNew && (
                                  <Badge variant="new_red" className="ml-4" />
                                )}
                              </div>
                              <p className="text-sm font-semibold">
                                {t("student.cases.summoned")}
                                {displayDate}
                              </p>
                              {message && (
                                <p className="mt-1 text-xs">{message}</p>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

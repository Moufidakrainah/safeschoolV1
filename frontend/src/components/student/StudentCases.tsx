import { useState, useEffect } from "react";
import {
  getNotifications,
  markNotificationRead,
  getAllReports,
  getNotes,
} from "@/services/api";
import { Badge } from "@/components/ui/badge";
import { SEVERITY_COLORS, severityFromApiGrade } from "@/utils/severity";
import { useTranslation } from "react-i18next";
import type { AuthUser } from "@/types";

const statusToBadgeVariant = (status: string) => {
  const map: Record<string, any> = {
    new: "new",
    in_progress: "in_progress",
    pending: "pending",
    resolved: "resolved",
    false_report: "false_report",
  };
  return map[status] ?? "new";
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

function anonymizeConvocation(content: string): string {
  return content.replace(/^.+? est convoqué/, "Vous êtes convoqué");
}

function parseConvocation(content: string) {
  const dateMatch = content.match(
    /(\d{1,2})\s+([a-záàâäéèêëíìîïóòôöúùûüç]+)\s+(\d{4})\s+à\s+(\d{1,2}):(\d{2})/,
  );
  content = anonymizeConvocation(content);
  const parts = content.split("\n\n");
  const message = parts.slice(1).join("\n\n").trim();
  const recipientMatch = content.match(/^(.+?) est convoqué/);
  const recipient = recipientMatch ? recipientMatch[1].trim() : null;

  if (!dateMatch) {
    return {
      isPast: true,
      displayDate: content.split("\n")[0].trim(),
      message,
      recipient,
    };
  }

  const [, day, monthStr, year, hours, minutes] = dateMatch;
  const monthNum = MONTHS_FR[monthStr.toLowerCase()];
  if (!monthNum) {
    return {
      isPast: true,
      displayDate: `${day} ${monthStr} ${year} à ${hours}:${minutes}`,
      message,
      recipient,
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
  return { isPast, displayDate, message, recipient };
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
  const [myReports, setMyReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportNotes, setReportNotes] = useState<Record<string, any[]>>({});
  const [unreadNotifs, setUnreadNotifs] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!user?.id) return;
    setLoadingReports(true);

    Promise.all([getAllReports(), getNotifications()])
      .then(async ([all, notifs]) => {
        const mine = all.filter((r: any) => r.reporter === "victime");
        setMyReports(mine);

        const notesMap: Record<string, any[]> = {};
        await Promise.all(
          mine.map(async (r: any) => {
            try {
              const notes = await getNotes(r.id);
              notesMap[r.id] = notes.filter(
                (n: any) =>
                  n.type === "convocation" || n.type === "status_change",
              );
            } catch {
              notesMap[r.id] = [];
            }
          }),
        );
        setReportNotes(notesMap);

        const unreadMap: Record<string, any> = {};
        notifs
          .filter((n: any) => !n.isRead)
          .forEach((n: any) => {
            unreadMap[n.id] = n;
          });
        setUnreadNotifs(unreadMap);
      })
      .catch(() => setMyReports([]))
      .finally(() => setLoadingReports(false));
  }, [user?.id, refreshKey]);

  const findUnreadNotifForNote = (note: any, reportId: string): any | null => {
    return (
      Object.values(unreadNotifs).find((n: any) => {
        if (n.report?.id !== reportId) return false;
        const noteContent = note.content.trim();
        const notifMsg = n.message.replace("Convocation : ", "").trim();
        return (
          notifMsg.includes(noteContent.split("\n\n")[0].trim()) ||
          noteContent.includes(notifMsg.split("\n\n")[0].trim())
        );
      }) ?? null
    );
  };

  const handleConvocationClick = async (notif: any) => {
    if (!notif) return;
    try {
      await markNotificationRead(notif.id);
      setUnreadNotifs((prev) => {
        const updated = { ...prev };
        delete updated[notif.id];
        return updated;
      });
      onNotifRefresh?.();
    } catch {}
  };

  return (
    <section className="page-section">
      {loadingReports ? (
        <p className="text-center py-10 text-gray-400">Chargement...</p>
      ) : myReports.length === 0 ? (
        <div className="bg-surface shadow-sm px-6 py-10 text-center">
          <p className="text-gray-400 text-sm">Aucun signalement trouvé</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {myReports.map((report: any) => {
            const severity = severityFromApiGrade(report.grade);
            const notes = reportNotes[report.id] ?? [];
            const reportUnreadCount = Object.values(unreadNotifs).filter(
              (n: any) => n.report?.id === report.id,
            ).length;

            return (
              <li key={report.id} className="bg-surface px-6 py-5 shadow-sm">
                {/* En-tête du dossier */}
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <span className="card-title">{report.caseNumber}</span>
                    <p className="card-subtitle mt-2 capitalize">
                      {report.type} - Je suis victime
                    </p>
                    <p className="card-meta mt-2">
                      {new Date(report.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Badge variant={statusToBadgeVariant(report.status)} />
                </div>

                {/* Notes : status_change + convocations */}
                {notes.length === 0 ? (
                  <p className="text-xs text-primary italic">
                    Aucune mise à jour pour ce dossier.
                  </p>
                ) : (
                  <div className="flex flex-col gap-2 mt-2">
                    {notes.map((note: any) => {
                      // ── Note de changement de statut ──
                      if (note.type === "status_change") {
                        return (
                          <div
                            key={note.id}
                            style={{
                              borderLeft: "3px solid var(--color-primary)",
                            }}
                            className="p-3 bg-white"
                          >
                            <p className="text-sm text-primary">
                              {note.content}
                            </p>
                          </div>
                        );
                      }

                      // ── Convocation ──
                      const { isPast, displayDate, message, recipient } =
                        parseConvocation(note.content);
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
                          className={`p-3 bg-indigo-50`}
                        >
                          {isPast ? (
                            <p className="text-primary text-sm">
                              Un rendez-vous a eu lieu le{" "}
                              <strong>{displayDate}</strong>
                            </p>
                          ) : (
                            <div>
                              <div className="flex justify-between">
                                <span className="text-xs font-semibold text-primary">
                                  {t("noteblock.convocation")}
                                </span>
                                {isNew && (
                                  <Badge variant="new_red" className="ml-4" />
                                )}
                              </div>
                              <p className="text-sm font-semibold text-primary">
                                {recipient ? <span>{recipient}</span> : "Tu"}{" "}
                                es convoqué(e) le{" "}
                                {displayDate}
                              </p>
                              {message && (
                                <p className="text-primary mt-1 text-xs">
                                  {message}
                                </p>
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

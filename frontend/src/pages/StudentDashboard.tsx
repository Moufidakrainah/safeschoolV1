import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  getStudentParents, getNotifications, markNotificationRead,
  getAllReports, getNotes,
} from '@/services/api';
import type { Parent } from '../types';
import StudentProfile from '@/components/student/StudentProfile';
import StudentForm from '@/components/student/StudentForm';
import RoleHeader from '@/components/layout/Header/RoleHeader';
import { Badge } from '@/components/ui/badge';
import { SEVERITY_COLORS, SEVERITY_LABELS, severityFromApiGrade } from '../utils/severity';

type StudentSection = 'profile' | 'report' | 'quiz' | 'cases';

const statusToBadgeVariant = (status: string) => {
  const map: Record<string, any> = {
    new: 'new', in_progress: 'in_progress', pending: 'pending',
    resolved: 'resolved', false_report: 'false_report',
  };
  return map[status] ?? 'new';
};

// const SEVERITY_LABELS: Record<string, string> = {
//   critical: '🔴 Critique', high: '🟠 Élevé', medium: '🟡 Moyen', low: '🟢 Faible',
// };

const MONTHS_FR: Record<string, number> = {
  'janvier':1,'février':2,'mars':3,'avril':4,'mai':5,'juin':6,
  'juillet':7,'août':8,'septembre':9,'octobre':10,'novembre':11,'décembre':12,
};

function parseConvocation(content: string) {
  const dateMatch = content.match(/(\d{1,2})\s+([a-záàâäéèêëíìîïóòôöúùûüç]+)\s+(\d{4})\s+à\s+(\d{1,2}):(\d{2})/);
  const parts = content.split('\n\n');
  const message = parts.slice(1).join('\n\n').trim();
  if (!dateMatch) {
    return { isPast: true, displayDate: content.split('\n')[0].replace('📅', '').trim(), message };
  }
  const [, day, monthStr, year, hours, minutes] = dateMatch;
  const monthNum = MONTHS_FR[monthStr.toLowerCase()];
  if (!monthNum) {
    return { isPast: true, displayDate: `${day} ${monthStr} ${year} à ${hours}:${minutes}`, message };
  }
  const rdvDate = new Date(Number(year), monthNum - 1, Number(day), Number(hours), Number(minutes));
  const isPast = rdvDate < new Date();
  const displayDate = `${String(day).padStart(2,'0')}/${String(monthNum).padStart(2,'0')}/${year} à ${hours}h${minutes}`;
  return { isPast, displayDate, message };
}

export default function StudentDashboard() {
  const { t } = useTranslation();
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [viewSection, setViewSection] = useState<StudentSection>(
    (searchParams.get('section') as StudentSection) ?? 'report'
  );

  const [parents, setParents]               = useState<Parent[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [notifRefreshKey, setNotifRefreshKey] = useState(0);
  const [myReports, setMyReports]           = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [reportNotes, setReportNotes]       = useState<Record<string, any[]>>({});
  // notifications non lues : { notifId → notification }
  const [unreadNotifs, setUnreadNotifs]     = useState<Record<string, any>>({});

  useEffect(() => {
    if (user?.id) {
      setLoadingParents(true);
      getStudentParents(user.id)
        .then(data => setParents(data))
        .catch(() => setParents([]))
        .finally(() => setLoadingParents(false));
    }
  }, [user?.id]);

  useEffect(() => {
    if (viewSection === 'quiz') navigate('/quiz');
  }, [viewSection, navigate]);

  useEffect(() => {
    if (viewSection !== 'cases' || !user?.id) return;
    setLoadingReports(true);

    Promise.all([getAllReports(), getNotifications()])
      .then(async ([all, notifs]) => {
        const mine = all.filter((r: any) => r.reporter === 'victime');
        setMyReports(mine);

        const notesMap: Record<string, any[]> = {};
        await Promise.all(
          mine.map(async (r: any) => {
            try {
              const notes = await getNotes(r.id);
              notesMap[r.id] = notes.filter((n: any) => n.type === 'convocation');
            } catch {
              notesMap[r.id] = [];
            }
          })
        );
        setReportNotes(notesMap);

        // Map notifId → notif pour les non lues
        const unreadMap: Record<string, any> = {};
        notifs.filter((n: any) => !n.isRead).forEach((n: any) => {
          unreadMap[n.id] = n;
        });
        setUnreadNotifs(unreadMap);
      })
      .catch(() => setMyReports([]))
      .finally(() => setLoadingReports(false));
  }, [viewSection, user?.id]);

  // Trouver la notification non lue qui correspond à une convocation
  // On compare le contenu de la note avec le message de la notification
  const findUnreadNotifForNote = (note: any, reportId: string): any | null => {
    return Object.values(unreadNotifs).find((n: any) => {
      if (n.report?.id !== reportId) return false;
      // La notification contient le même contenu que la note (date + message)
      const noteContent = note.content.replace('📅 ', '').trim();
      const notifMsg = n.message.replace('Convocation : ', '').trim();
      return notifMsg.includes(noteContent.split('\n\n')[0].trim()) ||
             noteContent.includes(notifMsg.split('\n\n')[0].trim());
    }) ?? null;
  };

  const handleConvocationClick = async (notif: any) => {
    if (!notif) return;
    try {
      await markNotificationRead(notif.id);
      setUnreadNotifs(prev => {
        const updated = { ...prev };
        delete updated[notif.id];
        return updated;
      });
      setNotifRefreshKey(k => k + 1);
    } catch {}
  };

  const unreadCount = Object.keys(unreadNotifs).length;

  return (
    <>
      <RoleHeader
        user={user}
        logoutUser={logoutUser}
        studentViewSection={viewSection}
        studentSetViewSection={setViewSection}
        studentNotifRefreshKey={notifRefreshKey}
      />

      {viewSection === 'profile' && (
        <StudentProfile user={user} parents={parents} loadingParents={loadingParents} />
      )}

      {viewSection === 'report' && <StudentForm user={user} />}

      {viewSection === 'cases' && (
        <main className="max-w-2xl mx-auto mt-8 px-5 pb-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">📁 Mes dossiers</h2>
          <p className="text-gray-500 text-sm mb-6">Suivi de vos signalements en cours</p>

          {loadingReports ? (
            <p className="text-center py-10 text-gray-400">Chargement...</p>
          ) : myReports.length === 0 ? (
            <div className="bg-white rounded-xl px-6 py-10 text-center shadow-sm">
              <p className="text-gray-400 text-sm">Aucun signalement trouvé</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {myReports.map((report: any) => {
                const severity = severityFromApiGrade(report.grade);
                const convocations = reportNotes[report.id] ?? [];
                // Nombre de notifs non lues pour ce dossier
                const reportUnreadCount = Object.values(unreadNotifs).filter(
                  (n: any) => n.report?.id === report.id
                ).length;

                return (
                  <div
                    key={report.id}
                    className="bg-white rounded-xl px-6 py-5 shadow-sm"
                    style={{ borderLeft: `4px solid ${SEVERITY_COLORS[severity]}` }}
                  >
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-primary">{report.caseNumber}</span>
                          <span className="text-white text-xs px-3 py-0.5 rounded-full"
                            style={{ background: SEVERITY_COLORS[severity] }}>
                            {SEVERITY_LABELS[severity]}
                          </span>
                          {reportUnreadCount > 0 && (
                            <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                              {reportUnreadCount}
                            </span>
                          )}
                        </div>
                        <div className="text-sm text-gray-700 font-semibold mb-1 capitalize">
                          {report.type} — Je suis victime
                        </div>
                        <div className="text-xs text-gray-400">
                          📅 {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                        </div>
                      </div>
                      <Badge variant={statusToBadgeVariant(report.status)} />
                    </div>

                    {convocations.length === 0 ? (
                      <p className="text-xs text-gray-400 italic">Aucune convocation pour ce dossier.</p>
                    ) : (
                      <div className="flex flex-col gap-2 mt-2">
                        {convocations.map((note: any) => {
                          const { isPast, displayDate, message } = parseConvocation(note.content);
                          const unreadNotif = !isPast ? findUnreadNotifForNote(note, report.id) : null;
                          const isNew = !!unreadNotif;

                          return (
                            <div
                              key={note.id}
                              onClick={() => isNew && handleConvocationClick(unreadNotif)}
                              className={`rounded-lg px-4 py-3 text-sm transition-all ${
                                isPast ? 'bg-gray-50' :
                                isNew ? 'bg-purple-50 cursor-pointer hover:bg-purple-100' :
                                'bg-purple-50'
                              }`}
                              style={{ borderLeft: `3px solid ${isPast ? '#d1d5db' : '#7c3aed'}` }}
                            >
                              {isPast ? (
                                <p className="text-gray-400">
                                  📋 Un rendez-vous a eu lieu le <strong>{displayDate}</strong>
                                </p>
                              ) : (
                                <div>
                                  <p className={`text-purple-700 ${isNew ? 'font-bold' : 'font-semibold'}`}>
                                    📅 Vous êtes convoqué(e) le <strong>{displayDate}</strong>
                                    {isNew && (
                                      <span className="ml-2 text-xs bg-red-500 text-white px-1.5 py-0.5 rounded-full">
                                        Nouveau
                                      </span>
                                    )}
                                  </p>
                                  {message && (
                                    <p className="text-gray-600 mt-1 text-xs whitespace-pre-line">{message}</p>
                                  )}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>
      )}
    </>
  );
}
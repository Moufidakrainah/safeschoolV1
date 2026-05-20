import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getStudentParents, getNotifications, markNotificationRead } from '../services/api';
import type { Parent } from '../types';
import StudentHeader from '../components/layout/StudentHeader/StudentHeader';
import StudentProfile from '../components/student/StudentProfile';
import StudentForm from '../components/student/StudentForm';

type StudentSection = 'profile' | 'report' | 'notifications' | 'quiz';

export default function StudentDashboard() {
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [viewSection, setViewSection] = useState<StudentSection>(
    (searchParams.get('section') as StudentSection) ?? 'report'
  );

  const [parents, setParents] = useState<Parent[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [notifRefreshKey, setNotifRefreshKey] = useState(0);

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
    if (viewSection === 'notifications') {
      setLoadingNotifs(true);
      getNotifications()
        .then(data => setNotifications(data))
        .catch(() => setNotifications([]))
        .finally(() => setLoadingNotifs(false));
    }
  }, [viewSection]);

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setNotifRefreshKey(k => k + 1);
    } catch { console.error('Erreur lecture notification'); }
  };

  const handleMarkAllRead = async () => {
    try {
      const unread = notifications.filter(n => !n.isRead);
      await Promise.all(unread.map(n => markNotificationRead(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setNotifRefreshKey(k => k + 1);
    } catch { console.error('Erreur lecture notifications'); }
  };

  const headerProps = { user, logoutUser, viewSection, setViewSection, notifRefreshKey };

  return (
    <>
      <StudentHeader {...headerProps} />

      {viewSection === 'profile' && (
        <StudentProfile user={user} parents={parents} loadingParents={loadingParents} />
      )}

      {viewSection === 'report' && <StudentForm user={user} />}

      {viewSection === 'notifications' && (
        <main className="max-w-2xl mx-auto mt-8 px-5 pb-10">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">🔔 Mes notifications</h2>
            {notifications.some(n => !n.isRead) && (
              <button onClick={handleMarkAllRead} className="text-sm text-blue-500 hover:underline">
                ✓ Tout marquer comme lu
              </button>
            )}
          </div>
          {loadingNotifs ? (
            <p className="text-center text-gray-400 py-10">Chargement...</p>
          ) : notifications.length === 0 ? (
            <p className="text-center text-gray-400 py-10">Aucune notification</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {notifications.map(n => (
                <li key={n.id}
                  className={`rounded-xl p-4 shadow-sm border-l-4 ${
                    n.isRead ? 'bg-white border-gray-200' : 'bg-blue-50 border-blue-400'
                  }`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1">
                      <p className="text-sm text-gray-800 whitespace-pre-line">{n.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(n.createdAt).toLocaleDateString('fr-FR', {
                          day: '2-digit', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit'
                        })}
                      </p>
                      {n.report?.caseNumber && (
                        <p className="text-xs text-primary mt-1">Dossier {n.report.caseNumber}</p>
                      )}
                    </div>
                    {!n.isRead && (
                      <button
                        onClick={() => handleMarkRead(n.id)}
                        className="text-xs text-blue-500 hover:underline shrink-0"
                      >
                        ✓ Lu
                      </button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </main>
      )}
    </>
  );
}

import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import {
  getStudentParents,
  getNotifications,
  markNotificationRead,
} from "@/services/api";
import type { Parent } from "@/types";
import StudentProfile from "@/components/student/StudentProfile";
import StudentCases from "@/components/student/StudentCases";
import StudentForm from "@/components/student/StudentForm";
import RoleHeader from "@/components/layout/Header/RoleHeader";

type StudentSection = "profile" | "report" | "quiz" | "cases";

export default function StudentDashboard() {
  const { t } = useTranslation();
  const { user, logoutUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [viewSection, setViewSection] = useState<StudentSection>(
    (searchParams.get("section") as StudentSection) ?? "report",
  );
  const [parents, setParents] = useState<Parent[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);
  const [notifRefreshKey, setNotifRefreshKey] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState<Record<string, any>>({});

  // Chargement des parents
  useEffect(() => {
    if (user?.id) {
      setLoadingParents(true);
      getStudentParents(user.id)
        .then((data) => setParents(data))
        .catch(() => setParents([]))
        .finally(() => setLoadingParents(false));
    }
  }, [user?.id]);

  // Redirection vers le quiz
  useEffect(() => {
    if (viewSection === "quiz") navigate("/quiz");
  }, [viewSection, navigate]);

  // Chargement des notifications non lues
  useEffect(() => {
    if (!user?.id) return;
    getNotifications()
      .then((notifs) => {
        const unreadMap: Record<string, any> = {};
        notifs
          .filter((n: any) => !n.isRead)
          .forEach((n: any) => { unreadMap[n.id] = n; });
        setUnreadNotifs(unreadMap);
      })
      .catch(() => {});
  }, [user?.id, notifRefreshKey]);

  const handleConvocationClick = async (notif: any) => {
    if (!notif) return;
    try {
      await markNotificationRead(notif.id);
      setUnreadNotifs((prev) => {
        const updated = { ...prev };
        delete updated[notif.id];
        return updated;
      });
      setNotifRefreshKey((k) => k + 1);
    } catch {}
  };

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <RoleHeader
        user={user}
        logoutUser={logoutUser}
        studentViewSection={viewSection}
        studentSetViewSection={setViewSection}
        studentNotifRefreshKey={notifRefreshKey}
      />

      <div className="max-w-5xl mx-auto mt-8 px-5 pb-10">
        {viewSection === "profile" && (
          <StudentProfile
            user={user}
            parents={parents}
            loadingParents={loadingParents}
          />
        )}

        {viewSection === "report" && <StudentForm user={user} />}

        {viewSection === "cases" && <StudentCases user={user} />}
      </div>
    </main>
  );
}
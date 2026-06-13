import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getStudentParents } from "@/services/api";
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

  useEffect(() => {
    if (user?.id) {
      setLoadingParents(true);
      getStudentParents(user.id)
        .then((data) => setParents(data))
        .catch(() => setParents([]))
        .finally(() => setLoadingParents(false));
    }
  }, [user?.id]);

  useEffect(() => {
    if (viewSection === "quiz") navigate("/quiz");
  }, [viewSection, navigate]);

  const handleNotifRefresh = () => setNotifRefreshKey((k) => k + 1);

  return (
    <main className="flex-1 bg-gray-50 font-sans">
      <RoleHeader
        user={user}
        logoutUser={logoutUser}
        studentViewSection={viewSection}
        studentSetViewSection={setViewSection}
        studentNotifRefreshKey={notifRefreshKey}
        studentOnNotifRefresh={handleNotifRefresh}
      />
      <div className="max-w-5xl mx-auto mt-2 px-5 pb-0">
        {viewSection === "profile" && (
          <StudentProfile
            user={user}
            parents={parents}
            loadingParents={loadingParents}
          />
        )}
        {viewSection === "report" && <StudentForm user={user} />}
        {viewSection === "cases" && (
          <StudentCases user={user} onNotifRefresh={handleNotifRefresh} refreshKey={notifRefreshKey} />
        )}
      </div>
    </main>
  );
}
import type { AdminUser } from "@/types";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import {
  getAllReports,
  updateReport,
  getNotes,
  addNote,
  getUserById,
  searchUsers,
  resolveSuspect,
  resolveVictim,
  getStaffProfile,
  createStaffProfile,
  updateStaffProfile,
  updateUser,
  createParent,
  isOfflineError,
} from "@/services/api";
import OfflineNotice from "@/components/OfflineNotice";
import { useReconnectKey } from "@/hooks/useOnlineStatus";
import { useUsers } from "@/hooks/useUsers";
import StatsDashboard from "@/components/admin/StatsDashboard";
import { SEVERITY_COLORS, severityFromApiGrade } from "@/utils/severity";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeVariant } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import StatCard from "@/components/StatCard";
import {
  Pagination as PaginationShadcn,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

import AdminClasses from "@/components/admin/AdminClasses";
import ReportDetail from "@/components/admin/ReportDetail";
import type { Report, Note } from "@/types";
import RoleHeader from "@/components/layout/Header/RoleHeader";
import AdminUsersList from "@/components/admin/AdminUsersList";
import AdminUserProfile from "@/components/admin/AdminUserProfile";

interface SchoolClass {
  id: string;
  level: string;
  section: string;
}

const buildUserForm = (u: AdminUser) => ({
  firstName: u.firstName,
  lastName: u.lastName,
  email: u.email,
  password: "",
  role: u.role,
  classId: u.studentProfile?.schoolClass?.id || "",
  subject: u.staffProfile?.subject || "",
  classIds: u.staffProfile?.classes?.map((c: SchoolClass) => c.id) || [],
  parents: [],
  dateOfBirth: u.studentProfile?.dateOfBirth ?? "",
});

const TYPE_MAP: Record<string, string> = {
  physique: "reporter.step2.physical",
  verbal: "reporter.step2.verbal",
  cyber: "reporter.step2.cyber",
  exclusion: "reporter.step2.exclusion",
  sexuel: "reporter.step2.sexual",
};

export default function AdminDashboard() {
  const { user, logoutUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isAdmin = user?.role === "admin";

  const {
    loadingUsers,
    usersFailedOffline,
    usersPage,
    setUsersPage,
    usersTotalPages,
    usersSearch,
    setUsersSearch,
    usersSort,
    setUsersSort,
    usersRoleFilter,
    setUsersRoleFilter,
    showUserForm,
    setShowUserForm,
    avatarTimestamps,
    classes,
    selectedUser,
    setSelectedUser,
    userForm,
    setUserForm,
    errors,
    isFormValid,
    deleteTarget,
    setDeleteTarget,
    isDeleting,
    isBlocked,
    deleteError,
    filteredUsers,
    fetchUsers,
    fetchClassesList,
    handleSaveUser,
    handleDeleteUser,
    confirmDelete,
    validateAll,
    handleAvatarUpload,
    updateField,
    toggleClassId,
    navigateToUser,
    calcAge,
  } = useUsers();

  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [reportsFailedOffline, setReportsFailedOffline] = useState(false);
  const reconnectKey = useReconnectKey();
  const [selected, setSelected] = useState<Report | null>(null);
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<"list" | "detail">("list");

  const [search, setSearch] = useState("");
  const [filterGrade, setFilterGrade] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterClass, setFilterClass] = useState("all");
  const [filterStudent, setFilterStudent] = useState("all");
  const [filterSuspect, setFilterSuspect] = useState("");
  const [filterVictim, setFilterVictim] = useState("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [resetKey, setResetKey] = useState(0);

  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [convocationDate, setConvocationDate] = useState("");
  const [convocationMessage, setConvocationMessage] = useState("");
  const [checkedConvocIds, setCheckedConvocIds] = useState<string[]>([]);
  const [convocDetails, setConvocDetails] = useState<
    Record<string, { date: string; message: string }>
  >({});
  const [sendingConvoc, setSendingConvoc] = useState(false);
  const [convocSuccess, setConvocSuccess] = useState(false);

  const [viewSection, setViewSection] = useState<
    "reports" | "users" | "stats" | "classes"
  >(
    (searchParams.get("section") as
      | "reports"
      | "users"
      | "stats"
      | "classes") ?? "reports",
  );

  useEffect(() => {
    navigate(`/dashboard?section=${viewSection}`, { replace: true });
  }, [viewSection]);

  const selectedUserId = searchParams.get("userId");
  const [activeSuspect, setActiveSuspect] = useState<string | null>(null);
  const [suspectSearch, setSuspectSearch] = useState("");
  const [suspectResults, setSuspectResults] = useState<AdminUser[]>([]);
  const [resolving, setResolving] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    status: string;
    label: string;
  } | null>(null);
  const [originReportId, setOriginReportId] = useState<string | null>(null);

  const itemsPerPage = 5;

  // Rechargé au montage et à chaque retour de connexion
  useEffect(() => {
    fetchReports();
    fetchClassesList();
    if (selectedUserId) fetchUsers();
  }, [reconnectKey]);

  useEffect(() => {
    if (selectedUserId) {
      getUserById(selectedUserId)
        .then((u) => {
          if (u) {
            setSelectedUser(u);
            setUserForm(buildUserForm(u));
          }
        })
        .catch(() => {});
    }
  }, [selectedUserId]);

  useEffect(() => {
    if (viewSection === "users" && !searchParams.get("userId")) fetchUsers();
  }, [viewSection, reconnectKey]);

  const fetchReports = async () => {
    try {
      setReports(await getAllReports());
      setReportsFailedOffline(false);
    } catch (err) {
      setReportsFailedOffline(isOfflineError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setSaving(true);
    try {
      await updateReport(id, { status });
      const updated = await getAllReports();
      setReports(updated);
      setSelected(updated.find((r: Report) => r.id === id) ?? null);
      await loadNotes(id);
    } catch {
    } finally {
      setSaving(false);
    }
  };

  const handleSuspectSearch = async (query: string) => {
    setSuspectSearch(query);
    if (query.length < 2) {
      setSuspectResults([]);
      return;
    }
    try {
      const r = await searchUsers(query);
      setSuspectResults(r.filter((u: AdminUser) => u.role === "student"));
    } catch {
      setSuspectResults([]);
    }
  };

  // ✅ Après
  const handleResolveSuspect = async (
    suspectId: string,
    userId: string | null,
  ) => {
    // Bloquer si cet utilisateur est déjà associé à un autre suspect
    if (userId && selected) {
      const alreadyLinked = selected.suspects?.some(
        (s) => s.id !== suspectId && s.resolvedUser?.id === userId,
      );
      if (alreadyLinked) {
        setActiveSuspect(null);
        setSuspectSearch("");
        setSuspectResults([]);
        return;
      }
    }
    setResolving(true);
    try {
      await resolveSuspect(suspectId, userId);
      const updated = await getAllReports();
      setReports(updated);
      setSelected(
        (updated as Report[]).find((r: Report) => r.id === selected?.id) ??
          null,
      );
      setActiveSuspect(null);
      setSuspectSearch("");
      setSuspectResults([]);
    } finally {
      setResolving(false);
    }
  };

  const filtered = useMemo(() => {
    return reports
      .slice()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      .filter((r: Report) => {
        if (filterGrade !== "all" && r.grade !== filterGrade) return false;
        if (filterStatus !== "all" && r.status !== filterStatus) return false;
        if (filterClass !== "all") {
          const sc = r.student?.studentProfile?.schoolClass;
          if ((sc ? `${sc.level} ${sc.section}` : "") !== filterClass)
            return false;
        }
        if (filterStudent !== "all" && r.student?.id !== filterStudent)
          return false;
        if (filterVictim) {
          const q = filterVictim.toLowerCase();
          const match =
            (r.reporter === "victime" &&
              `${r.student?.firstName ?? ""} ${r.student?.lastName ?? ""}`
                .toLowerCase()
                .includes(q)) ||
            (r.reporter === "temoin" &&
              r.victims?.some(
                (v) =>
                  v.freeText.toLowerCase().includes(q) ||
                  (v.resolvedUser &&
                    `${v.resolvedUser.firstName} ${v.resolvedUser.lastName}`
                      .toLowerCase()
                      .includes(q)),
              ));
          if (!match) return false;
        }
        if (filterSuspect) {
          const q = filterSuspect.toLowerCase();
          if (
            !r.suspects?.some(
              (s) =>
                (s.freeText?.toLowerCase() ?? "").includes(q) ||
                `${s.resolvedUser?.firstName ?? ""} ${s.resolvedUser?.lastName ?? ""}`
                  .toLowerCase()
                  .includes(q),
            )
          )
            return false;
        }
        if (filterDateFrom && new Date(r.createdAt) < new Date(filterDateFrom))
          return false;
        if (filterDateTo) {
          const to = new Date(filterDateTo);
          to.setHours(23, 59, 59, 999);
          if (new Date(r.createdAt) > to) return false;
        }
        if (search) {
          const q = search.toLowerCase();
          const name =
            `${r.student?.firstName ?? ""} ${r.student?.lastName ?? ""}`.toLowerCase();
          if (
            !name.includes(q) &&
            !(r.type ?? "").toLowerCase().includes(q) &&
            !(r.description ?? "").toLowerCase().includes(q)
          )
            return false;
        }
        return true;
      });
  }, [
    reports,
    filterGrade,
    filterStatus,
    filterClass,
    filterStudent,
    filterVictim,
    filterSuspect,
    filterDateFrom,
    filterDateTo,
    search,
  ]);

  const totalPages = useMemo(
    () => Math.ceil(filtered.length / itemsPerPage),
    [filtered],
  );
  const paginated = useMemo(
    () =>
      filtered.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
      ),
    [filtered, currentPage],
  );

  const stats = useMemo(
    () => ({
      total: reports.length,
      critical: reports.filter(
        (r) => severityFromApiGrade(r.grade) === "critical",
      ).length,
      high: reports.filter((r) => severityFromApiGrade(r.grade) === "high")
        .length,
      medium: reports.filter((r) => severityFromApiGrade(r.grade) === "medium")
        .length,
      low: reports.filter((r) => severityFromApiGrade(r.grade) === "low")
        .length,
    }),
    [reports],
  );

  const classOptions = useMemo(
    () =>
      [
        ...new Set(
          reports
            .map((r) => {
              const sc = r.student?.studentProfile?.schoolClass;
              return sc ? `${sc.level} ${sc.section}` : null;
            })
            .filter(Boolean) as string[],
        ),
      ].sort(),
    [reports],
  );

  const handleReset = () => {
    setFilterGrade("all");
    setFilterStatus("all");
    setFilterClass("all");
    setFilterStudent("all");
    setFilterDateFrom("");
    setFilterDateTo("");
    setFilterSuspect("");
    setFilterVictim("");
    setSearch("");
    setCurrentPage(1);
    setResetKey((k) => k + 1);
  };

  const loadNotes = async (reportId: string) => {
    try {
      setNotes(await getNotes(reportId));
    } catch {}
  };
  const goTo = (report: typeof selected) => {
    setSelected(report);
    if (report) {
      loadNotes(report.id);
      setCheckedConvocIds([]);
    }
  };

  const handleAddNote = async (type = "note") => {
    if (!selected) return;
    let content = type === "convocation" ? convocationMessage : newNote;
    if (!content.trim()) return;
    if (type === "convocation" && convocationDate) {
      const f = new Date(convocationDate).toLocaleString("fr-FR", {
        dateStyle: "long",
        timeStyle: "short",
      });
      content = `${f}\n\n${content}`;
    }
    try {
      await addNote(selected.id, content, type);
      await loadNotes(selected.id);
      if (type === "convocation") {
        setConvocationMessage("");
        setConvocationDate("");
      } else setNewNote("");
    } catch {}
  };

  const renderUserForm = (isEdit = false) => (
    <div className="rounded-lg bg-[var(--color-primary-hover)] p-4 flex flex-col gap-3">
      <div>
        <Label className="text-[var(--text-light)] text-sm">
          {t("admin.users.firstName")}
        </Label>
        <Input
          value={userForm.firstName}
          onChange={(e) => updateField("firstName", e.target.value)}
          className="bg-[var(--background)] mt-1"
        />
        {errors.firstName && (
          <p className="text-[var(--text-error)] text-xs mt-1">
            {t(errors.firstName)}
          </p>
        )}
      </div>
      <div>
        <Label className="text-[var(--text-light)]">
          {t("admin.users.lastName")}
        </Label>
        <Input
          value={userForm.lastName}
          onChange={(e) => updateField("lastName", e.target.value)}
          className="bg-[var(--background)] mt-1"
        />
        {errors.lastName && (
          <p className="text-[var(--text-error)] text-xs mt-1">
            {t(errors.lastName)}
          </p>
        )}
      </div>
      <div>
        <Label className="text-[var(--text-light)]">
          {t("admin.users.email")}
        </Label>
        <Input
          value={userForm.email}
          onChange={(e) => updateField("email", e.target.value)}
          className="bg-[var(--background)] mt-1"
        />
        {errors.email && (
          <p className="text-[var(--text-error)] text-xs mt-1">
            {t(errors.email)}
          </p>
        )}
      </div>
      <div>
        <Label className="text-[var(--text-light)]">
          {t("admin.users.password")}
          {isEdit ? t("login.keepEmpty") : ""}
        </Label>
        <Input
          type="password"
          value={userForm.password}
          onChange={(e) => updateField("password", e.target.value)}
          className="bg-[var(--background)] mt-1"
          maxLength={20}
        />
        {errors.password && (
          <p className="text-[var(--text-error)] text-xs mt-1">
            {t(errors.password)}
          </p>
        )}
      </div>
      <Select
        value={userForm.role}
        onValueChange={(v) =>
          setUserForm((prev) => ({
            ...prev,
            role: v ?? prev.role,
            classId: "",
            subject: "",
            classIds: [],
          }))
        }
        disabled={isEdit}
      >
        <SelectTrigger
          className={`bg-white ${isEdit ? "opacity-60 cursor-not-allowed" : ""}`}
        >
          <span>
            {userForm.role === "" && t("admin.users.roles.choose")}
            {userForm.role === "student" && t("admin.users.roles.student")}
            {userForm.role === "teacher" && t("admin.users.roles.teacher")}
            {userForm.role === "admin" && t("admin.users.roles.admin")}
            {userForm.role === "director" && t("admin.users.roles.director")}
          </span>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="student">
            {t("admin.users.roles.student")}
          </SelectItem>
          <SelectItem value="teacher">
            {t("admin.users.roles.teacher")}
          </SelectItem>
          <SelectItem value="admin">{t("admin.users.roles.admin")}</SelectItem>
        </SelectContent>
      </Select>

      {userForm.role === "student" && (
        <>
          <div>
            <Label className="text-white text-sm">
              {t("admin.users.class")}
            </Label>
            <Select
              value={userForm.classId}
              onValueChange={(v) =>
                setUserForm((prev) => ({ ...prev, classId: v ?? prev.classId }))
              }
            >
              <SelectTrigger className="bg-white mt-1">
                <SelectValue placeholder={t("admin.users.selectClass")}>
                  {classes.find((c) => c.id === userForm.classId)
                    ? `${classes.find((c) => c.id === userForm.classId)?.level} ${classes.find((c) => c.id === userForm.classId)?.section}`
                    : t("admin.users.selectClass")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {classes.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.level} {c.section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-white text-sm">
              {t("admin.users.dateOfBirth")}
            </Label>
            <Input
              type="date"
              value={userForm.dateOfBirth}
              onChange={(e) =>
                setUserForm((prev) => ({
                  ...prev,
                  dateOfBirth: e.target.value,
                }))
              }
              className="bg-white mt-1"
              min={
                new Date(new Date().setFullYear(new Date().getFullYear() - 16))
                  .toISOString()
                  .split("T")[0]
              }
              max={
                new Date(new Date().setFullYear(new Date().getFullYear() - 9))
                  .toISOString()
                  .split("T")[0]
              }
            />
            {userForm.dateOfBirth &&
              (new Date(userForm.dateOfBirth) >
              new Date(new Date().setFullYear(new Date().getFullYear() - 9)) ? (
                <p className="text-red-300 text-xs mt-1">
                  {t("admin.users.ageMin")}
                </p>
              ) : new Date(userForm.dateOfBirth) <
                new Date(
                  new Date().setFullYear(new Date().getFullYear() - 16),
                ) ? (
                <p className="text-red-300 text-xs mt-1">
                  {t("admin.users.ageMax")}
                </p>
              ) : null)}
          </div>
        </>
      )}

      {userForm.role === "teacher" && (
        <>
          <div>
            <Label className="text-white text-sm">
              {t("admin.teacher.subjectTeached")}
            </Label>
            <Input
              value={userForm.subject}
              onChange={(e) =>
                setUserForm((prev) => ({
                  ...prev,
                  subject: e.target.value.slice(0, 50),
                }))
              }
              placeholder="ex: Mathématiques"
              className="bg-white mt-1"
              maxLength={50}
            />
            <p className="text-white/60 text-xs mt-0.5">
              {t("admin.users.charsCount", { count: userForm.subject.length })}
            </p>
            {userForm.subject.length === 50 && (
              <p className="text-red-300 text-xs mt-0.5">
                {t("admin.users.maxChars")}
              </p>
            )}
          </div>
          <div>
            <Label className="text-white text-sm mb-2 block">
              {t("admin.users.classesTeacher")}
            </Label>
            <div className="flex flex-wrap gap-2">
              {classes.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleClassId(c.id)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${userForm.classIds.includes(c.id) ? "bg-white text-primary border-white" : "bg-transparent text-white border-white/50 hover:border-white"}`}
                >
                  {c.level} {c.section}
                </button>
              ))}
              {classes.length === 0 && (
                <p className="text-white/60 text-xs">
                  {t("admin.users.noClass")}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );

  if (view === "detail" && selected) {
    return (
      <main className="flex-1 bg-gray-50 font-sans">
        <h1 className="sr-only">{t("admin.title.oneReport")}</h1>
        <RoleHeader
          user={user}
          logoutUser={logoutUser}
          adminViewSection={viewSection}
          adminSetViewSection={setViewSection}
          adminSetSelected={(r) => setSelected(r as Report | null)}
          adminFetchUsers={fetchUsers}
        />
        <ReportDetail
          selected={selected}
          filtered={filtered}
          notes={notes}
          isAdmin={isAdmin}
          _saving={saving}
          resolving={resolving}
          checkedConvocIds={checkedConvocIds}
          convocDetails={convocDetails}
          sendingConvoc={sendingConvoc}
          convocSuccess={convocSuccess}
          newNote={newNote}
          activeSuspect={activeSuspect}
          suspectSearch={suspectSearch}
          suspectResults={suspectResults}
          onBack={() => {
            setView("list");
            setSelected(null);
          }}
          onPrev={() =>
            goTo(filtered[filtered.findIndex((r) => r.id === selected.id) - 1])
          }
          onNext={() =>
            goTo(filtered[filtered.findIndex((r) => r.id === selected.id) + 1])
          }
          onUpdateStatus={(status, label) =>
            setConfirmAction({ status, label })
          }
          onAddNote={handleAddNote}
          onResolveSuspect={handleResolveSuspect}
          onResolveVictim={async (victimId, userId) => {
            if (userId && selected) {
              const alreadyLinked = selected.victims?.some(
                (v) => v.id !== victimId && v.resolvedUser?.id === userId,
              );
              if (alreadyLinked) {
                setActiveSuspect(null);
                setSuspectSearch("");
                setSuspectResults([]);
                return;
              }
            }
            await resolveVictim(victimId, userId);
            const updated = await getAllReports();
            setReports(updated);
            setSelected(
              updated.find((r: Report) => r.id === selected?.id) ?? null,
            );
            setActiveSuspect(null);
            setSuspectSearch("");
            setSuspectResults([]);
          }}
          onSetActiveSuspect={setActiveSuspect}
          onSuspectSearch={handleSuspectSearch}
          onSetNewNote={setNewNote}
          onToggleConvoc={(id) => {
            if (id === "__clear__") {
              setCheckedConvocIds([]);
              return;
            }
            setCheckedConvocIds((prev) =>
              prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
            );
          }}
          onSetConvocDetails={setConvocDetails}
          onSetSendingConvoc={setSendingConvoc}
          onSetConvocSuccess={setConvocSuccess}
          onSetSuspectSearch={setSuspectSearch}
          onSetSuspectResults={setSuspectResults}
          onAddNoteRaw={addNote}
          onSendConvocations={async () => {}}
          onLoadNotes={loadNotes}
          onNavigateToUser={async (userId) => {
            const currentReportId = selected?.id ?? "";
            setOriginReportId(currentReportId);
            setView("list");
            setSelected(null);
            setSelectedUser(null);
            const u = await getUserById(userId);
            if (u) {
              setSelectedUser(u);
              setUserForm(buildUserForm(u));
            }
            setViewSection("users");
            navigate(
              `/dashboard?section=users&userId=${userId}&from=report&reportId=${currentReportId}`,
              { replace: true },
            );
          }}
        />
        {confirmAction && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-sm">
              <p className="text-sm text-gray-700 mb-4">
                {t("admin.users.confirmStatus", { label: confirmAction.label })}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm"
                >
                  {t("common.cancel")}
                </button>
                <button
                  onClick={async () => {
                    await handleUpdateStatus(
                      selected!.id,
                      confirmAction.status,
                    );
                    setConfirmAction(null);
                  }}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 text-sm disabled:opacity-50"
                >
                  {saving ? t("common.inProgress") : t("common.confirm")}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  return (
    <div className="bg-gray-50 font-sans">
      <h1 className="sr-only">{t("admin.title.allReports")}</h1>
      <RoleHeader
        user={user}
        logoutUser={logoutUser}
        adminViewSection={viewSection}
        adminSetViewSection={setViewSection}
        adminSetSelected={(r) => setSelected(r as Report | null)}
        adminFetchUsers={fetchUsers}
      />

      <div className="max-w-5xl mx-auto mt-8 px-5 pb-10">
        {viewSection === "reports" && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
              <StatCard
                label={t("admin.stats.total")}
                value={stats.total}
                color={SEVERITY_COLORS.all}
                active={filterGrade === "all"}
                activeTextColor="var(--foreground)"
                onClick={() => {
                  setFilterGrade("all");
                  setCurrentPage(1);
                }}
              />
              <StatCard
                label={t("admin.stats.critical")}
                value={stats.critical}
                color={SEVERITY_COLORS.critical}
                active={filterGrade === "critical"}
                onClick={() => {
                  setFilterGrade("critical");
                  setCurrentPage(1);
                }}
              />
              <StatCard
                label={t("admin.stats.high")}
                value={stats.high}
                color={SEVERITY_COLORS.high}
                active={filterGrade === "high"}
                onClick={() => {
                  setFilterGrade("high");
                  setCurrentPage(1);
                }}
              />
              <StatCard
                label={t("admin.stats.medium")}
                value={stats.medium}
                color={SEVERITY_COLORS.medium}
                active={filterGrade === "medium"}
                onClick={() => {
                  setFilterGrade("medium");
                  setCurrentPage(1);
                }}
              />
              <StatCard
                label={t("admin.stats.low")}
                value={stats.low}
                color={SEVERITY_COLORS.low}
                active={filterGrade === "low"}
                onClick={() => {
                  setFilterGrade("low");
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="mb-5">
              <Input
                className="w-full md:w-auto max-w-[180px]"
                type="search"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t("admin.search.placeholder")}
              />
            </div>
            <div className="flex flex-col md:flex-row flex-wrap items-center justify-center gap-2 mb-4">
              <Select
                value={filterStatus}
                onValueChange={(v) => {
                  if (v !== null) setFilterStatus(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-auto">
                  <SelectValue>
                    {filterStatus === "all"
                      ? t("admin.filters.allStatuses")
                      : t(`badge.${filterStatus}`)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("admin.filters.allStatuses")}
                  </SelectItem>
                  <SelectItem value="new">{t("badge.new")}</SelectItem>
                  <SelectItem value="in_progress">
                    {t("badge.in_progress")}
                  </SelectItem>
                  <SelectItem value="pending">{t("badge.pending")}</SelectItem>
                  <SelectItem value="resolved">
                    {t("badge.resolved")}
                  </SelectItem>
                  <SelectItem value="false_report">
                    {t("badge.false_report")}
                  </SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filterClass}
                onValueChange={(v) => {
                  if (v !== null) setFilterClass(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-auto">
                  <SelectValue>
                    {filterClass === "all"
                      ? t("admin.filters.allClasses")
                      : filterClass}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("admin.filters.allClasses")}
                  </SelectItem>
                  {classOptions.map((cls) => (
                    <SelectItem key={cls} value={cls}>
                      {cls}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={filterStudent}
                onValueChange={(v) => {
                  if (v !== null) setFilterStudent(v);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-full md:w-auto">
                  <SelectValue>
                    {filterStudent === "all"
                      ? t("admin.filters.allReporters")
                      : (() => {
                          const s = reports.find(
                            (r) => r.student?.id === filterStudent,
                          )?.student;
                          return s
                            ? `${s.firstName} ${s.lastName}`
                            : t("admin.filters.allReporters");
                        })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    {t("admin.filters.allReporters")}
                  </SelectItem>
                  {[
                    ...new Map(
                      reports
                        .filter((r) => r.student && !r.isAnonymous)
                        .map((r) => [r.student!.id, r.student!]),
                    ).values(),
                  ].map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.firstName} {s.lastName} ({s.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="search"
                value={filterVictim}
                onChange={(e) => {
                  setFilterVictim(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t("admin.filters.victimPlaceholder")}
                className="w-full md:w-auto max-w-[180px]"
              />
              <Input
                type="search"
                value={filterSuspect}
                onChange={(e) => {
                  setFilterSuspect(e.target.value);
                  setCurrentPage(1);
                }}
                placeholder={t("admin.filters.suspectPlaceholder")}
                className="w-full md:w-auto max-w-[180px]"
              />
              <div className="w-full flex flex-col md:flex-row items-center justify-center gap-2 mt-2">
                <span className="text-gray-600 text-sm">
                  {t("admin.filters.dates")}
                </span>
                <Input
                  key={`from-${resetKey}`}
                  type="date"
                  value={filterDateFrom}
                  onChange={(e) => {
                    setFilterDateFrom(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full md:w-auto max-w-[150px]"
                />
                <span className="text-gray-400">→</span>
                <Input
                  key={`to-${resetKey}`}
                  type="date"
                  value={filterDateTo}
                  onChange={(e) => {
                    setFilterDateTo(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-full md:w-auto max-w-[150px]"
                />
              </div>
            </div>
            <div className="flex justify-center mb-4">
              <Button variant="outline" onClick={handleReset}>
                {t("admin.filters.reset")}
              </Button>
            </div>
            {loading ? (
              <p className="text-center py-16 text-gray-400">
                {t("admin.loading")}
              </p>
            ) : reportsFailedOffline && reports.length === 0 ? (
              <OfflineNotice />
            ) : filtered.length === 0 ? (
              <p className="text-center py-16 text-gray-400">
                {t("admin.noReports")}
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {paginated.map((report) => (
                  <li
                    key={report.id}
                    style={{
                      borderLeft: `5px solid ${SEVERITY_COLORS[severityFromApiGrade(report.grade)]}`,
                    }}
                    className="card-list-item px-6 py-5"
                    onClick={() => {
                      setSelected(report);
                      setView("detail");
                      loadNotes(report.id);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) =>
                      e.key === "Enter" &&
                      (setSelected(report),
                      setView("detail"),
                      loadNotes(report.id))
                    }
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="card-title">
                            {t(TYPE_MAP[report.type] ?? report.type)} -{" "}
                            {t("student.cases.iAmVictim")}
                        </span>
                        <p className="card-subtitle mt-1 mb-2">
                          {report.description.length > 120
                            ? `${report.description.substring(0, 120)}...`
                            : report.description}
                        </p>
                        <div className="flex gap-4 card-meta">
                          <span>
                            {report.isAnonymous
                              ? t("admin.detail.anonymousLabel")
                              : `${report.student?.firstName} ${report.student?.lastName}`}
                          </span>
                          <span>
                            {report.student?.studentProfile?.schoolClass
                              ? `${report.student.studentProfile.schoolClass.level} ${report.student.studentProfile.schoolClass.section}`
                              : "-"}
                          </span>
                          <span>
                            {new Date(report.createdAt).toLocaleDateString(
                              "fr-FR",
                            )}
                          </span>
                          {report.suspects?.length > 0 && (
                            <span>
                              {report.suspects.length}{" "}
                              {t("admin.detail.suspectsCount")}
                            </span>
                          )}
                          <span>{report.caseNumber}</span>
                        </div>
                      </div>
                      <Badge
                        variant={report.status as BadgeVariant}
                        className="ml-4"
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}

            {totalPages > 1 && (
              <PaginationShadcn className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      text={t("common.previous")}
                      onClick={() => {
                        if (currentPage > 1) setCurrentPage(currentPage - 1);
                      }}
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <PaginationItem key={p}>
                        <PaginationLink
                          isActive={p === currentPage}
                          onClick={() => setCurrentPage(p)}
                          className="cursor-pointer"
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}
                  <PaginationItem>
                    <PaginationNext
                      text={t("common.next")}
                      onClick={() => {
                        if (currentPage < totalPages)
                          setCurrentPage(currentPage + 1);
                      }}
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : "cursor-pointer"
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </PaginationShadcn>
            )}
          </>
        )}

        {viewSection === "users" && isAdmin && selectedUser && (
          <AdminUserProfile
            selectedUser={selectedUser}
            filteredUsers={filteredUsers}
            avatarTimestamps={avatarTimestamps}
            classes={classes}
            userForm={userForm}
            _errors={errors}
            isFormValid={!!isFormValid}
            originReportId={originReportId}
            onBack={() => {
              setSelectedUser(null);
              if (originReportId) {
                const report = reports.find((r) => r.id === originReportId);
                const goToReport = (r: Report) => {
                  setSelected(r);
                  setView("detail");
                  loadNotes(r.id);
                  setOriginReportId(null);
                };
                if (report) {
                  goToReport(report);
                } else {
                  getAllReports().then((all) => {
                    const r = all.find((r: Report) => r.id === originReportId);
                    if (r) {
                      setReports(all);
                      goToReport(r);
                    }
                  });
                }
                setViewSection("reports");
              } else {
                navigate("/dashboard?section=users", { replace: true });
              }
            }}
            onPrev={() => {
              const idx = filteredUsers.findIndex(
                (u) => u.id === selectedUser.id,
              );
              const prev = filteredUsers[idx - 1];
              if (prev) navigateToUser(prev);
            }}
            onNextUser={() => {
              const idx = filteredUsers.findIndex(
                (u) => u.id === selectedUser.id,
              );
              const next = filteredUsers[idx + 1];
              if (next) navigateToUser(next);
            }}
            onHandleAvatarUpload={handleAvatarUpload}
            onHandleDeleteUser={handleDeleteUser}
            onSaveUser={async () => {
              await updateUser(selectedUser.id, {
                firstName: userForm.firstName,
                lastName: userForm.lastName,
                email: userForm.email,
                role: userForm.role,
                ...(userForm.password && { password: userForm.password }),
                ...(userForm.role === "student" && {
                  classId: userForm.classId,
                  dateOfBirth: userForm.dateOfBirth || undefined,
                }),
              });
              if (userForm.role === "teacher") {
                try {
                  const e = await getStaffProfile(selectedUser.id);
                  await updateStaffProfile(e.id, {
                    subject: userForm.subject,
                    classIds: userForm.classIds,
                  });
                } catch {
                  await createStaffProfile({
                    userId: selectedUser.id,
                    profession: "teacher",
                    subject: userForm.subject,
                    classIds: userForm.classIds,
                  });
                }
              }
              if (userForm.role === "student" && userForm.parents.length > 0) {
                const freshU = await getUserById(selectedUser.id);
                const studentProfileId = freshU?.studentProfile?.id;
                if (studentProfileId) {
                  for (const parent of userForm.parents) {
                    if (parent.firstName && parent.lastName && parent.email) {
                      await createParent({
                        ...parent,
                        studentIds: [studentProfileId],
                      });
                    }
                  }
                }
              }
              const u = await getUserById(selectedUser.id);
              if (u) {
                setSelectedUser(null);
                setTimeout(() => {
                  setSelectedUser(u);
                  setUserForm(buildUserForm(u));
                }, 50);
              }
              await fetchUsers();
            }}
            renderUserForm={renderUserForm}
            calcAge={calcAge}
          />
        )}

        {viewSection === "users" && isAdmin && !selectedUser && (
          <AdminUsersList
            filteredUsers={filteredUsers}
            usersPage={usersPage}
            usersSearch={usersSearch}
            usersSort={usersSort}
            usersRoleFilter={usersRoleFilter}
            loadingUsers={loadingUsers}
            usersFailedOffline={usersFailedOffline}
            avatarTimestamps={avatarTimestamps}
            usersTotalPages={usersTotalPages}
            showUserForm={showUserForm}
            isFormValid={!!isFormValid}
            onSetUsersSearch={setUsersSearch}
            onSetUsersSort={setUsersSort}
            onSetUsersRoleFilter={setUsersRoleFilter}
            onSetUsersPage={setUsersPage}
            onFetchUsers={fetchUsers}
            onNavigateToUser={navigateToUser}
            onSetShowUserForm={(v) => {
              if (v)
                setUserForm({
                  firstName: "",
                  lastName: "",
                  email: "",
                  password: "",
                  role: "",
                  classId: "",
                  subject: "",
                  classIds: [],
                  parents: [],
                  dateOfBirth: "",
                });
              setShowUserForm(v);
            }}
            onSaveUser={handleSaveUser}
            onValidateAll={validateAll}
            renderUserForm={renderUserForm}
          />
        )}

        {viewSection === "stats" && <StatsDashboard reports={reports} />}

        {viewSection === "classes" && isAdmin && <AdminClasses />}

        {deleteTarget && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-sm">
              <p className="text-sm text-gray-600 mb-4">
                {deleteError
                  ? deleteError
                  : isBlocked
                    ? t("admin.users.deleteBlocked")
                    : t("admin.users.deleteConfirm")}
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setDeleteTarget(null);
                  }}
                  className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
                >
                  {isBlocked ? t("common.close") : t("common.cancel")}
                </button>
                {!isBlocked && (
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {isDeleting ? t("common.loading") : t("common.delete")}
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

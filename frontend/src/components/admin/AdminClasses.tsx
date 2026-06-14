import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { getClasses, createClass, updateClass, deleteClass, getAllUsers } from "@/services/api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Pagination as PaginationShadcn, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { API_BASE } from "@/config";

interface SchoolClass { id: string; level: string; section: string; }
interface StudentUser {
  id: string; firstName: string; lastName: string; email: string; avatar?: string;
  studentProfile?: { schoolClass?: { id: string; level: string; section: string } | null };
}

const CLASSES_PER_PAGE = 7;

export default function AdminClasses() {
  const { t } = useTranslation();

  // ── Validators — retournent des CLÉS i18n ──
  const validateLevelKey = (value: string): string => {
    if (!value.trim()) return 'classes.levelRequired';
    if (!/^[3-6]eme$/.test(value.trim())) return 'classes.levelInvalid';
    return '';
  };

  const validateSectionKey = (value: string): string => {
    if (!value.trim()) return 'classes.sectionRequired';
    if (!/^[A-Z]$/.test(value.trim().toUpperCase())) return 'classes.sectionInvalid';
    return '';
  };

  const [classes, setClasses] = useState<SchoolClass[]>([]);
  const [students, setStudents] = useState<StudentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showClassForm, setShowClassForm] = useState(false);
  const [editingClass, setEditingClass] = useState<SchoolClass | null>(null);
  const [classForm, setClassForm] = useState({ level: "", section: "" });
  const [savingClass, setSavingClass] = useState(false);
  // ── Stocke des CLÉS i18n ──
  const [levelErrorKey, setLevelErrorKey] = useState('');
  const [sectionErrorKey, setSectionErrorKey] = useState('');
  const [classPage, setClassPage] = useState(1);
  const [deleteModal, setDeleteModal] = useState<{ cls: SchoolClass; blocked: boolean; message: string } | null>(null);
  const [selectedClass, setSelectedClass] = useState<SchoolClass | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [cls, usr] = await Promise.all([getClasses(), getAllUsers(1, 100)]);
      setClasses(cls);
      const allUsers = Array.isArray(usr) ? usr : Array.isArray(usr?.data) ? usr.data : [];
      setStudents(allUsers.filter((u: StudentUser) => u.role === "student"));
    } catch { }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const studentsInClass = selectedClass
    ? students.filter(s => s.studentProfile?.schoolClass?.id === selectedClass.id)
    : [];

  const handleSaveClass = async () => {
    const lKey = validateLevelKey(classForm.level);
    const sKey = validateSectionKey(classForm.section);
    setLevelErrorKey(lKey);
    setSectionErrorKey(sKey);
    if (lKey || sKey) return;
    setSavingClass(true);
    try {
      if (editingClass) {
        await updateClass(editingClass.id, classForm.level, classForm.section);
        toast.success(t('toast.classUpdated'));
      } else {
        await createClass(classForm.level, classForm.section);
        toast.success(t('toast.classCreated'));
      }
      await fetchAll();
      setShowClassForm(false);
      setEditingClass(null);
      setClassForm({ level: "", section: "" });
    } catch (err: unknown) {
      const msg = (err as any)?.response?.data?.message ?? '';
      if (msg === 'CLASS_ALREADY_EXISTS') {
        toast.error(t('classes.alreadyExists'));
      } else {
        toast.error(t('common.error'));
      }
    } finally {
      setSavingClass(false);
    }
  };

  const handleDeleteClass = (cls: SchoolClass) => {
    const count = students.filter(s => s.studentProfile?.schoolClass?.id === cls.id).length;
    if (count > 0) {
      setDeleteModal({ cls, blocked: true, message: t('classes.deleteBlocked', { level: cls.level, section: cls.section, count }) });
    } else {
      setDeleteModal({ cls, blocked: false, message: t('classes.deleteConfirm', { level: cls.level, section: cls.section }) });
    }
  };

  const confirmDeleteClass = async () => {
    if (!deleteModal || deleteModal.blocked) return;
    try {
      await deleteClass(deleteModal.cls.id);
      if (selectedClass?.id === deleteModal.cls.id) setSelectedClass(null);
      setDeleteModal(null);
      await fetchAll();
      toast.success(t('toast.classDeleted'));
    } catch {
      toast.error(t('common.error'));
    }
  };

  const avatarUrl = (s: StudentUser) => s.avatar ? `${API_BASE}/uploads/avatars/${s.avatar}` : null;
  const initials = (s: StudentUser) => `${s.firstName?.[0] ?? ""}${s.lastName?.[0] ?? ""}`.toUpperCase();

  if (loading) return <p className="text-center py-16 text-gray-400">{t('classes.loading')}</p>;

  if (selectedClass) {
    return (
      <section className="flex flex-col gap-4">
        <div className="flex items-center gap-3 mb-2">
          <button onClick={() => setSelectedClass(null)}
            className="text-primary text-sm font-medium flex items-center gap-1 hover:underline">
            {t('classes.backToClasses')}
          </button>
        </div>
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-xl font-bold text-gray-800">{selectedClass.level} {selectedClass.section}</h2>
          <span className="text-sm text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
            {studentsInClass.length} {studentsInClass.length !== 1 ? t('classes.students') : t('classes.student')}
          </span>
        </div>
        <div className="bg-surface shadow-sm rounded-sm px-6 py-4">
          <p className="text font-semibold text-gray-700 mb-3">{t('classes.studentsEnrolled')}</p>
          {studentsInClass.length === 0 ? (
            <p className="text-sm text-gray-400 py-6 text-center">
              {t('classes.noStudentInClass')}<br />
              <span className="text-xs">{t('classes.assignStudents')}</span>
            </p>
          ) : (
            <ul className="flex flex-col divide-y divide-gray-50">
              {studentsInClass.map(s => (
                <li key={s.id} className="flex items-center gap-3 py-3">
                  {avatarUrl(s)
                    ? <img src={avatarUrl(s)!} alt={s.firstName} className="w-9 h-9 rounded-full object-cover border border-gray-200 flex-shrink-0" />
                    : <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-sm font-bold text-blue-600 flex-shrink-0">{initials(s)}</div>
                  }
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">{s.firstName} {s.lastName}</p>
                    <p className="text text-gray-400 truncate">{s.email}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="flex-shrink-0">
        <div className="flex justify-end items-center mb-4">
          <Button size="sm" onClick={() => { setShowClassForm(true); setEditingClass(null); setClassForm({ level: "", section: "" }); setLevelErrorKey(''); setSectionErrorKey(''); }}>
            {t('classes.addClass')}
          </Button>
        </div>

        {showClassForm && (
          <div className="bg-surface shadow-sm rounded-sm px-6 py-5 mb-3">
            <h3 className="font-bold mb-4">
              {editingClass ? t('classes.editClass') : t('classes.addClassTitle')}
            </h3>
            <div className="rounded-lg bg-[var(--color-primary-hover)] p-4 flex flex-col gap-3">
              <div>
                <Label className="text-white text-sm">{t('classes.level')}</Label>
                <Input
                  value={classForm.level}
                  placeholder="ex: 5eme"
                  className="bg-white mt-1"
                  maxLength={10}
                  onChange={e => {
                    setClassForm(p => ({ ...p, level: e.target.value }));
                    setLevelErrorKey(validateLevelKey(e.target.value));
                  }}
                />
                {/* t(clé) au rendu → se met à jour au changement de langue */}
                {levelErrorKey && <p className="text-red-300 text-xs mt-1">{t(levelErrorKey)}</p>}
              </div>
              <div>
                <Label className="text-white text-sm">{t('classes.section')}</Label>
                <Input
                  value={classForm.section}
                  placeholder="ex: A"
                  className="bg-white mt-1"
                  maxLength={2}
                  onChange={e => {
                    setClassForm(p => ({ ...p, section: e.target.value.toUpperCase() }));
                    setSectionErrorKey(validateSectionKey(e.target.value));
                  }}
                />
                {sectionErrorKey && <p className="text-red-300 text-xs mt-1">{t(sectionErrorKey)}</p>}
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-4">
              <Button disabled={!classForm.level.trim() || !classForm.section.trim() || savingClass} onClick={handleSaveClass}>
                {savingClass ? "..." : t('classes.save')}
              </Button>
              <Button variant="ghost" onClick={() => { setShowClassForm(false); setEditingClass(null); }}>
                {t('classes.cancel')}
              </Button>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {classes.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-6">{t('classes.noClass')}</p>
          )}
          {classes.slice((classPage - 1) * CLASSES_PER_PAGE, classPage * CLASSES_PER_PAGE).map(cls => {
            const count = students.filter(s => s.studentProfile?.schoolClass?.id === cls.id).length;
            const isSelected = selectedClass?.id === cls.id;
            return (
              <div key={cls.id} onClick={() => setSelectedClass(isSelected ? null : cls)}
                className={`${isSelected ? "bg-primary border-primary shadow-md" : "bg-white hover:shadow-sm border-gray-200"}`}>
                <div className="bg-surface shadow-sm px-6 py-4 flex justify-between items-center">
                  <div>
                    <p className="font-bold text text-gray-800">{cls.level} {cls.section}</p>
                    <p className="text-xs mt-0.5 text-gray-400">
                      {count} {count !== 1 ? t('classes.students') : t('classes.student')}
                    </p>
                  </div>
                  <div className="flex gap-2" onClick={e => e.stopPropagation()}>
                    <Button size="sm" variant="default" onClick={() => { setEditingClass(cls); setClassForm({ level: cls.level, section: cls.section }); setShowClassForm(true); setLevelErrorKey(''); setSectionErrorKey(''); }}>
                      {t('classes.edit')}
                    </Button>
                    <Button size="sm" variant="default" onClick={() => handleDeleteClass(cls)}>
                      {t('classes.delete')}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {Math.ceil(classes.length / CLASSES_PER_PAGE) > 1 && (
          <PaginationShadcn className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious onClick={() => { if (classPage > 1) setClassPage(classPage - 1); }}
                  className={classPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
              </PaginationItem>
              {Array.from({ length: Math.ceil(classes.length / CLASSES_PER_PAGE) }, (_, i) => i + 1).map(p => (
                <PaginationItem key={p}>
                  <PaginationLink isActive={p === classPage} onClick={() => setClassPage(p)} className="cursor-pointer">{p}</PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext onClick={() => { if (classPage < Math.ceil(classes.length / CLASSES_PER_PAGE)) setClassPage(classPage + 1); }}
                  className={classPage === Math.ceil(classes.length / CLASSES_PER_PAGE) ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
              </PaginationItem>
            </PaginationContent>
          </PaginationShadcn>
        )}
      </div>

      {deleteModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-sm">
            <p className="text-sm text-gray-600 mb-4">{deleteModal.message}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteModal(null)}
                className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">
                {deleteModal.blocked ? t('classes.close') : t('classes.cancel')}
              </button>
              {!deleteModal.blocked && (
                <button onClick={confirmDeleteClass}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700">
                  {t('classes.delete')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
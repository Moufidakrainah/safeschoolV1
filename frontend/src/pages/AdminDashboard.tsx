import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  getAllReports, updateReport, getNotes, addNote,
  getAllUsers, createUser, updateUser, deleteUser, checkCanDeleteUser,
  searchUsers, resolveSuspect, resolveVictim, getClasses,
} from '../services/api';
import StatsDashboard from './StatsDashboard';
import { SEVERITY_COLORS, severityFromApiGrade } from '../utils/severity';
import Button from '../components/Button';
import Badge, { type BadgeVariant } from '../components/Badge';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Select from '../components/Select';
import Input from '../components/Input';
import Pagination from '../components/Pagination';
import NoteBlock from '../components/NoteBlock';
import AdminHeader from '../components/layout/AdminHeader/AdminHeader';
import type { Report, Note, AdminUser } from '../types';

interface SchoolClass { id: string; level: string; section: string; }

export default function AdminDashboard() {
  const { user, logoutUser } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin';

  // ── État signalements
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Report | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [view, setView] = useState<'list' | 'detail'>('list');

  // ── État filtres
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStudent, setFilterStudent] = useState('all');
  const [filterSuspect, setFilterSuspect] = useState('');
  const [filterVictim, setFilterVictim] = useState('');
  const [uploadingAvatarId, setUploadingAvatarId] = useState<string | null>(null);
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [resetKey, setResetKey] = useState(0);

  // ── État notes
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [convocationDate, setConvocationDate] = useState('');
  const [convocationMessage, setConvocationMessage] = useState('');

  // ── État section
  const [viewSection, setViewSection] = useState<'reports' | 'users' | 'stats'>('reports');

  // ── État utilisateurs
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', role: 'student', classId: '',
  });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [globalDeleteError, setGlobalDeleteError] = useState('');
  const [isBlocked, setIsBlocked] = useState(false);

  // ── État classes
  const [classes, setClasses] = useState<SchoolClass[]>([]);

  // ── État résolution suspects
  const [activeSuspect, setActiveSuspect] = useState<string | null>(null);
  const [suspectSearch, setSuspectSearch] = useState('');
  const [suspectResults, setSuspectResults] = useState<any[]>([]);
  const [resolving, setResolving] = useState(false);

  const itemsPerPage = 5;

  useEffect(() => { fetchReports(); fetchClassesList(); }, []);

  const fetchClassesList = async () => {
    try { setClasses(await getClasses()); }
    catch { console.error('Erreur chargement classes'); }
  };

  const fetchReports = async () => {
    try {
      const data = await getAllReports();
      setReports(data);
    } catch {
      console.error('Erreur chargement signalements');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setSaving(true);
    try {
      await updateReport(id, { status, adminNote });
      await fetchReports();
      setAdminNote('');
      setView('list');
      setSelected(null);
    } catch {
      console.error('Erreur mise à jour statut');
    } finally {
      setSaving(false);
    }
  };

  const handleSuspectSearch = async (query: string) => {
    setSuspectSearch(query);
    if (query.length < 2) { setSuspectResults([]); return; }
    try {
      const results = await searchUsers(query);
      setSuspectResults(results.filter((u: any) => u.role === 'student'));
    } catch { setSuspectResults([]); }
  };

  const handleResolveSuspect = async (suspectId: string, userId: string | null) => {
    setResolving(true);
    try {
      await resolveSuspect(suspectId, userId);
      const updated = await getAllReports();
      setReports(updated);
      const updatedSelected = updated.find((r: any) => r.id === selected?.id);
      if (updatedSelected) setSelected(updatedSelected);
      setActiveSuspect(null);
      setSuspectSearch('');
      setSuspectResults([]);
    } finally { setResolving(false); }
  };

  const filtered = useMemo(() => {
    return reports.filter((r: Report) => {
      if (filterGrade !== 'all' && r.grade !== filterGrade) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (filterClass !== 'all') {
      const sc = r.student?.studentProfile?.schoolClass;
      const classLabel = sc ? `${sc.level} ${sc.section}` : '';
      if (classLabel !== filterClass) return false;
    }
      if (filterStudent !== 'all' && r.student?.id !== filterStudent) return false;
      if (filterVictim) {
      const q = filterVictim.toLowerCase();
      const match =
        (r.reporter === 'victime' && `${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`.toLowerCase().includes(q)) ||
        (r.reporter === 'temoin' && r.victims?.some(v =>
          v.freeText.toLowerCase().includes(q) ||
          (v.resolvedUser && `${v.resolvedUser.firstName} ${v.resolvedUser.lastName}`.toLowerCase().includes(q))
        ));
      if (!match) return false;
    }
    if (filterSuspect) {
        const q = filterSuspect.toLowerCase();
        const match = r.suspects?.some(s =>
          (s.freeText?.toLowerCase() ?? '').includes(q) ||
          (`${s.resolvedUser?.firstName ?? ''} ${s.resolvedUser?.lastName ?? ''}`).toLowerCase().includes(q)
        );
        if (!match) return false;
      }
      if (filterDateFrom && new Date(r.createdAt) < new Date(filterDateFrom)) return false;
      if (filterDateTo) {
        const to = new Date(filterDateTo);
        to.setHours(23, 59, 59, 999);
        if (new Date(r.createdAt) > to) return false;
      }
      if (search) {
        const q = search.toLowerCase();
        const name = `${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`.toLowerCase();
        if (!name.includes(q) && !(r.type ?? '').toLowerCase().includes(q) && !(r.description ?? '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [reports, filterGrade, filterStatus, filterClass, filterStudent, filterVictim, filterSuspect, filterDateFrom, filterDateTo, search]);

  const totalPages = useMemo(() => Math.ceil(filtered.length / itemsPerPage), [filtered, itemsPerPage]);
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const stats = useMemo(() => ({
    total: reports.length,
    critical:  reports.filter(r => severityFromApiGrade(r.grade) === 'critical').length,
    high:      reports.filter(r => severityFromApiGrade(r.grade) === 'high').length,
    pending:   reports.filter(r => r.status === 'pending').length,
  }), [reports]);

  const handleReset = () => {
    setFilterGrade('all'); setFilterStatus('all'); setFilterClass('all');
    setFilterStudent('all'); setFilterDateFrom(''); setFilterDateTo('');
    setFilterSuspect(''); setFilterVictim(''); setSearch(''); setCurrentPage(1);
    setResetKey(k => k + 1);
  };

  const loadNotes = async (reportId: string) => {
    try { setNotes(await getNotes(reportId)); }
    catch { console.error('Erreur chargement notes'); }
  };

  const handleAvatarUpload = async (userId: string, file: File) => {
    setUploadingAvatarId(userId);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch(`http://localhost:5000/users/${userId}/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        body: formData,
      });
      const data = await res.json();
      if (data.avatar) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, avatar: data.avatar } : u));
      }
    } catch (e) {
      console.error('Avatar upload failed', e);
    } finally {
      setUploadingAvatarId(null);
    }
  };

  const goTo = (report: typeof selected) => {
    setSelected(report);
    if (report) loadNotes(report.id);
  };

  const handleAddNote = async (type: string = 'note') => {
    if (!selected) return;
    let content = type === 'convocation' ? convocationMessage : newNote;
    if (!content.trim()) return;
    if (type === 'convocation' && convocationDate) {
      const formatted = new Date(convocationDate).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' });
      content = `📅 ${formatted}\n\n${content}`;
    }
    try {
      await addNote(selected.id, content, type);
      await loadNotes(selected.id);
      if (type === 'convocation') { setConvocationMessage(''); setConvocationDate(''); }
      else setNewNote('');
    } catch { console.error('Erreur ajout note'); }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try { setUsers(await getAllUsers()); }
    catch { console.error('Erreur chargement utilisateurs'); }
    finally { setLoadingUsers(false); }
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) await updateUser(editingUser.id, userForm);
      else await createUser(userForm);
      await fetchUsers();
      setShowUserForm(false);
      setEditingUser(null);
      setUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'student', classId: '' });
    } catch { console.error('Erreur sauvegarde utilisateur'); }
  };

  const handleDeleteUser = async (id: string) => {
    if (id === user?.id) {
      setDeleteTarget(id); setIsBlocked(true);
      setDeleteError(t('admin.users.deleteSelf')); return;
    }
    const { deletable } = await checkCanDeleteUser(id);
    setDeleteTarget(id); setIsBlocked(!deletable); setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true); setDeleteError(''); setIsBlocked(false);
    try {
      await deleteUser(deleteTarget);
      await fetchUsers();
      setDeleteTarget(null);
    } catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? "";
      if (msg === "USER_HAS_REPORTS") setIsBlocked(true);
      else setDeleteError(t('admin.users.deleteError'));
    } finally { setIsDeleting(false); }
  };

  const headerProps = { user, logoutUser, viewSection, setViewSection, setSelected, fetchUsers };

  const [errors, setErrors] = useState({ firstName: '', lastName: '', email: '', password: '' });

  const validateField = (field: string, value: string) => {
    let message = '';
    if (!value.trim() && field !== 'password') message = t('admin.users.errorRequired');
    else if (field === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = t('admin.users.errorEmailFormat');
    else if (field === 'password' && value.length > 0 && value.length < 6) message = t('admin.users.errorPasswordLength');
    setErrors(prev => ({ ...prev, [field]: message }));
  };

  const updateField = (field: string, value: string) => {
    setUserForm(prev => ({ ...prev, [field]: value }));
    validateField(field, value);
  };

  const isFormValid =
    userForm.firstName.trim() && userForm.lastName.trim() &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email) &&
    !errors.firstName && !errors.lastName && !errors.email && !errors.password;

  // ── Vue détail
  if (view === 'detail' && selected) {
    const idx = filtered.findIndex(r => r.id === selected.id);
    const severityColor = SEVERITY_COLORS[severityFromApiGrade(selected.grade)];

    return (
      <main className="min-h-screen bg-gray-50 font-sans">
        <h1 className="sr-only">{t('admin.title.oneReport')}</h1>
        <div className="flex-1 bg-gray-50 font-sans">
          <AdminHeader {...headerProps} />
          <div className="max-w-5xl mx-auto mt-8 px-5 pb-10">

            {/* Navigation */}
            <div className="flex justify-between items-center mb-6">
              <Button variant="ghost" onClick={() => goTo(filtered[idx - 1])} disabled={idx === 0} aria-label={t('admin.prev')}>
                ← {t('admin.prev')}
              </Button>
              <span className="font-bold text-primary">{t('admin.reportLabel', { number: selected.caseNumber })}</span>
              <Button variant="ghost" onClick={() => goTo(filtered[idx + 1])} disabled={idx === filtered.length - 1} aria-label={t('admin.next')}>
                {t('admin.next')} →
              </Button>
            </div>

            {/* Statut + actions */}
            <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
              <div className="flex items-center gap-3">
                <Badge variant={selected.status as BadgeVariant} />
                <Button variant="ghost" onClick={() => { setView('list'); setSelected(null); }}>← {t('common.back')}</Button>
              </div>
              {isAdmin && (
                <div className="flex gap-2 flex-wrap" role="group" aria-label={t('admin.actions.groupLabel')}>
                  {([
                    { status: 'in_progress', label: `🔄 ${t('admin.actions.inProgress')}`, variant: 'primary'  },
                          { status: 'closed',      label: `✅ ${t('admin.actions.close')}`,       variant: 'success'  },
                    { status: 'rejected',    label: `❌ ${t('admin.actions.reject')}`,      variant: 'danger'   },
                  ] as const).map(btn => (
                    <Button key={btn.status} variant={btn.variant} disabled={saving}
                      onClick={() => handleUpdateStatus(selected.id, btn.status)}>
                      {btn.label}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Infos + personnes */}
            <div className="grid grid-cols-2 gap-6 mb-6">
              <Card borderColor={severityColor}>
                <h3 className="text-primary text-sm font-bold mb-4">{t('admin.detail.info')}</h3>
                <table className="w-full text-sm border-collapse">
                  <tbody>
                    {([
                      { label: t('admin.detail.type'), value: selected.type ?? '-' },
                    { label: t('admin.detail.reporter'), value: selected.reporter ?? '-' },
                      { label: t('admin.detail.date'),       value: new Date(selected.createdAt).toLocaleDateString('fr-FR') },
                      { label: t('admin.detail.class'),      value: selected.student?.studentProfile?.schoolClass ? `${selected.student.studentProfile.schoolClass.level} ${selected.student.studentProfile.schoolClass.section}` : '-' },
                      { label: t('admin.detail.aiScore'),    value: selected.aiScore ? `${selected.aiScore}/100` : '-' },
                      { label: t('admin.detail.aiReason'),   value: selected.aiReason ?? '-' },
                      { label: t('admin.detail.anonymous'),  value: selected.isAnonymous ? t('admin.detail.yes') : t('admin.detail.no') },
                    ] as const).map(row => (
                      <tr key={row.label} className="border-b border-gray-100">
                        <td className="py-2 text-gray-400 font-semibold w-2/5">{row.label}</td>
                        <td className="py-2 text-gray-700">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Card>

              <Card>
                <h3 className="text-primary text-sm font-bold mb-4">{t('admin.detail.people')}</h3>
                <p className="text-xs text-gray-400 font-semibold mb-1">{t('admin.detail.reportedBy')}</p>
                <p className="text-sm text-gray-700 mb-4">
                  {selected.isAnonymous
                    ? t('admin.detail.anonymousLabel')
                    : `${selected.student?.firstName} ${selected.student?.lastName}`}
                  {selected.student?.avatar && (
                    <img src={`http://localhost:5000/uploads/avatars/${selected.student.avatar}`} alt="" className="w-8 h-8 rounded-full object-cover border-2 border-gray-200 inline-block ml-2 align-middle" />
                  )}
                  {selected.student?.role && (
                    <span className="text-gray-400 text-xs ml-1">({selected.student.role})</span>
                  )}
                </p>
                {selected.description?.includes('| Victime :') && (
                  <>
                    <p className="text-xs text-gray-400 font-semibold mb-1">{t('admin.detail.victim')}</p>
                    <p className="text-sm text-gray-700 mb-4">
                      {selected.description.split('| Victime :')[1]?.split('|')[0]?.trim()}
                    </p>
                  </>
                )}
                <p className="text-xs text-gray-400 font-semibold mb-2">{t('admin.detail.suspects')}</p>
                {selected.suspects?.length > 0 ? (
                  <ul className="flex flex-col gap-2">
                    {selected.suspects.map((s) => (
                      <li key={s.id} className="bg-surface rounded-lg px-3 py-2 text-sm">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-red-500 font-medium">{s.freeText}</span>
                          {isAdmin && (
                            <button
                              className="text-xs text-blue-500 hover:underline shrink-0"
                              onClick={() => {
                                setActiveSuspect(activeSuspect === s.id ? null : s.id);
                                setSuspectSearch('');
                                setSuspectResults([]);
                              }}
                            >
                              {s.resolvedUser ? '✏️ Modifier' : '🔗 Lier à un élève'}
                            </button>
                          )}
                        </div>
                        {s.resolvedUser && (
                          <div className="mt-1 flex items-center gap-2 text-xs text-green-600">
                            <span>✅ Lié à :</span>
                            <span className="font-semibold">{s.resolvedUser.firstName} {s.resolvedUser.lastName}</span>
                            {isAdmin && (
                              <button
                                className="text-red-400 hover:underline ml-1"
                                onClick={() => handleResolveSuspect(s.id, null)}
                                disabled={resolving}
                              >✕ Délier</button>
                            )}
                          </div>
                        )}
                        {isAdmin && activeSuspect === s.id && (
                          <div className="mt-2 border border-gray-200 rounded-lg p-2 bg-white">
                            <input
                              type="text"
                              value={suspectSearch}
                              onChange={e => handleSuspectSearch(e.target.value)}
                              placeholder="Rechercher un élève..."
                              className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary mb-1"
                              autoFocus
                            />
                            {suspectResults.length > 0 && (
                              <ul className="flex flex-col gap-0.5 max-h-32 overflow-y-auto">
                                {suspectResults.map((u: any) => (
                                  <li key={u.id}>
                                    <button
                                      className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded"
                                      onClick={() => handleResolveSuspect(s.id, u.id)}
                                      disabled={resolving}
                                    >
                                      {u.firstName} {u.lastName}
                                      <span className="text-gray-400 ml-1">({u.role})</span>
                                    </button>
                                  </li>
                                ))}
                              </ul>
                            )}
                            {suspectSearch.length >= 2 && suspectResults.length === 0 && (
                              <p className="text-xs text-gray-400 px-2">Aucun élève trouvé</p>
                            )}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-300">{t('admin.detail.noSuspect')}</p>
                )}

                {/* Victimes — uniquement pour les témoins */}
                {selected.victims?.length > 0 && (
                  <>
                    <p className="text-xs text-gray-400 font-semibold mb-2 mt-4">{t('admin.detail.victims')}</p>
                    {selected.victims?.length > 0 ? (
                      <ul className="flex flex-col gap-2">
                        {selected.victims.map((v) => (
                          <li key={v.id} className="bg-surface rounded-lg px-3 py-2 text-sm">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-blue-500 font-medium">{v.freeText}</span>
                              {isAdmin && (
                                <button
                                  className="text-xs text-blue-500 hover:underline shrink-0"
                                  onClick={() => {
                                    setActiveSuspect(activeSuspect === v.id ? null : v.id);
                                    setSuspectSearch('');
                                    setSuspectResults([]);
                                  }}
                                >
                                  {v.resolvedUser ? '✏️ Modifier' : '🔗 Lier à un élève'}
                                </button>
                              )}
                            </div>
                            {v.resolvedUser && (
                              <div className="mt-1 flex items-center gap-2 text-xs text-green-600">
                                <span>✅ {t('admin.detail.victimLinked')} :</span>
                                <span className="font-semibold">{v.resolvedUser.firstName} {v.resolvedUser.lastName}</span>
                              </div>
                            )}
                            {isAdmin && activeSuspect === v.id && (
                              <div className="mt-2 border border-gray-200 rounded-lg p-2 bg-white">
                                <input
                                  type="text"
                                  value={suspectSearch}
                                  onChange={e => handleSuspectSearch(e.target.value)}
                                  placeholder="Rechercher un élève..."
                                  className="w-full px-3 py-1.5 border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-primary mb-1"
                                  autoFocus
                                />
                                {suspectResults.length > 0 && (
                                  <ul className="flex flex-col gap-0.5 max-h-32 overflow-y-auto">
                                    {suspectResults.map((u: any) => (
                                      <li key={u.id}>
                                        <button
                                          className="w-full text-left px-2 py-1 text-xs hover:bg-gray-100 rounded"
                                          onClick={async () => {
                                            await resolveVictim(v.id, u.id);
                                            const updated = await getAllReports();
                                            setReports(updated);
                                            const upd = updated.find((r: any) => r.id === selected?.id);
                                            if (upd) setSelected(upd);
                                            setActiveSuspect(null);
                                            setSuspectSearch('');
                                            setSuspectResults([]);
                                          }}
                                          disabled={resolving}
                                        >
                                          {u.firstName} {u.lastName}
                                          <span className="text-gray-400 ml-1">({u.role})</span>
                                        </button>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            )}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-gray-300">{t('admin.detail.noVictim')}</p>
                    )}
                  </>
                )}
              </Card>
            </div>

            {/* Description */}
            <Card borderColor={severityColor} className="mb-6">
              <h3 className="text-primary text-sm font-bold mb-3">{selected.aiReason}</h3>
              <p className="text-sm text-gray-700 leading-7">{selected.description?.split('|')[0]?.trim()}</p>
            </Card>

            {/* Notes */}
            <Card borderColor={severityColor} className="mb-6">
              <h3 className="text-primary text-sm font-bold mb-4">📝 {t('admin.notes.title')}</h3>
              {notes.length > 0 ? (
                <div className="flex flex-col gap-3 mb-5">
                  {notes.map(note => <NoteBlock key={note.id} note={note} />)}
                </div>
              ) : (
                <p className="text-sm text-gray-400 mb-5">{t('admin.notes.empty')}</p>
              )}
              {isAdmin && (
                <>
                  <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={3}
                    placeholder={t('admin.notes.placeholder')} aria-label={t('admin.notes.placeholder')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-y mb-3 font-[inherit] box-border"
                  />
                  <Button onClick={() => handleAddNote('note')}>{t('admin.notes.save')}</Button>
                </>
              )}
            </Card>

            {/* Convocation */}
            {isAdmin && (
              <Card borderColor={severityColor}>
                <h3 className="text-gray-800 text-sm font-bold mb-4">📅 {t('admin.convocation.title')}</h3>
                <div className="mb-4">
                  <label className="block mb-1 text-xs font-semibold text-gray-500" htmlFor="convocation-date">
                    {t('admin.convocation.dateLabel')}
                  </label>
                  <input id="convocation-date" type="datetime-local" value={convocationDate}
                    onChange={e => setConvocationDate(e.target.value)}
                    className="px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-gray-700"
                  />
                </div>
                <textarea value={convocationMessage} onChange={e => setConvocationMessage(e.target.value)} rows={3}
                  placeholder={t('admin.convocation.placeholder')} aria-label={t('admin.convocation.placeholder')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-y mb-3 font-[inherit] box-border"
                />
                <Button onClick={() => handleAddNote('convocation')}>{t('admin.convocation.send')}</Button>
              </Card>
            )}

          </div>
        </div>
      </main>
    );
  }

  // ── Vue liste
  return (
    <>
      <main className="min-h-screen bg-gray-50 font-sans">
        <h1 className="sr-only">{t('admin.title.allReports')}</h1>
        <div className="flex-1 bg-white font-sans">
          <AdminHeader {...headerProps} />
          <div className="max-w-5xl mx-auto mt-8 px-5 pb-10">

            {viewSection === 'reports' && (
              <>
                <div className="grid grid-cols-4 gap-4 mb-8" role="group" aria-label={t('admin.stats.groupLabel')}>
                  <StatCard label={t('admin.stats.total')} value={stats.total} color="#1a1a2e"
                    active={filterGrade === 'all' && filterStatus === 'all'}
                    onClick={() => { setFilterGrade('all'); setFilterStatus('all'); setCurrentPage(1); }} />
                  <StatCard label={t('admin.stats.critical')} value={stats.critical} color={SEVERITY_COLORS.critical}
                    active={filterGrade === 'critique'}
                    onClick={() => { setFilterGrade('critique'); setFilterStatus('all'); setCurrentPage(1); }} />
                  <StatCard label={t('admin.stats.high')} value={stats.high} color={SEVERITY_COLORS.high}
                    active={filterGrade === 'grave'}
                    onClick={() => { setFilterGrade('grave'); setFilterStatus('all'); setCurrentPage(1); }} />
                  <StatCard label={t('admin.stats.pending')} value={stats.pending} color="#eab308"
                    active={filterStatus === 'pending'}
                    onClick={() => { setFilterStatus('pending'); setFilterGrade('all'); setCurrentPage(1); }} />

                </div>

                <div className="mb-5">
                  <input type="search" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                    placeholder={t('admin.search.placeholder')} aria-label={t('admin.search.placeholder')}
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary" />
                </div>

                <div className="flex gap-2 mb-5 flex-wrap items-center" role="group" aria-label={t('admin.filters.groupLabel')}>
                  <Select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }} aria-label={t('admin.filters.allStatuses')}>
                    <option value="all">{t('admin.filters.allStatuses')}</option>
                    <option value="pending">{t('admin.status.pending')}</option>
                    <option value="in_progress">{t('admin.status.in_progress')}</option>
                    <option value="closed">{t('admin.status.closed')}</option>
                    <option value="rejected">{t('admin.status.rejected')}</option>
                  </Select>
                  <Select value={filterClass} onChange={e => { setFilterClass(e.target.value); setCurrentPage(1); }} aria-label={t('admin.filters.allClasses')}>
                    <option value="all">{t('admin.filters.allClasses')}</option>
                    {classes.map(c => (
                      <option key={c.id} value={`${c.level} ${c.section}`}>{c.level} {c.section}</option>
                    ))}
                  </Select>
                  <Select value={filterStudent} onChange={e => { setFilterStudent(e.target.value); setCurrentPage(1); }} aria-label={t('admin.filters.allReporters')}>
                    <option value="all">{t('admin.filters.allReporters')}</option>
                    {[...new Map(reports.filter(r => r.student && !r.isAnonymous).map(r => [r.student!.id, r.student!])).values()].map(s => (
                      <option key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.role})</option>
                    ))}
                  </Select>
                  <input type="search" value={filterVictim}
                    onChange={e => { setFilterVictim(e.target.value); setCurrentPage(1); }}
                    placeholder="Nom de la victime..."
                    aria-label="Filtrer par victime"
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-white text-gray-700"
                  />
                  <input type="search" value={filterSuspect} onChange={e => { setFilterSuspect(e.target.value); setCurrentPage(1); }}
                    placeholder={t('admin.filters.suspectPlaceholder')} aria-label={t('admin.filters.suspectPlaceholder')}
                    className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-white text-gray-700" />
                  <div className="flex items-center gap-1" role="group" aria-label={t('admin.filters.dateRange')}>
                    <input key={`from-${resetKey}`} type="date" value={filterDateFrom}
                      onChange={e => { setFilterDateFrom(e.target.value); setCurrentPage(1); }}
                      aria-label={t('admin.filters.dateFrom')}
                      className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-white text-gray-700" />
                    <span aria-hidden="true" className="text-gray-400">→</span>
                    <input key={`to-${resetKey}`} type="date" value={filterDateTo}
                      onChange={e => { setFilterDateTo(e.target.value); setCurrentPage(1); }}
                      aria-label={t('admin.filters.dateTo')}
                      className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-white text-gray-700" />
                  </div>
                  <Button variant="ghost" onClick={handleReset}>{t('admin.filters.reset')}</Button>
                </div>

                {loading ? (
                  <p className="text-center py-16 text-gray-400" role="status">{t('admin.loading')}</p>
                ) : filtered.length === 0 ? (
                  <p className="text-center py-16 text-gray-400">{t('admin.noReports')}</p>
                ) : (
                  <ul className="flex flex-col gap-3" aria-label={t('admin.reportsList')}>
                    {paginated.map(report => (
                      <li key={report.id}
                        style={{ borderLeft: `5px solid ${SEVERITY_COLORS[severityFromApiGrade(report.grade)]}` }}
                        className="bg-surface px-6 py-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => { setSelected(report); setAdminNote(report.adminNote || ''); setView('detail'); loadNotes(report.id); }}
                        role="button" tabIndex={0}
                        onKeyDown={e => e.key === 'Enter' && (setSelected(report), setView('detail'), loadNotes(report.id))}
                        aria-label={`${report.type} ${report.reporter} — ${report.caseNumber}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-sm text-primary">{report.type} — {report.reporter}</span>
                              {report.gradeModified && (
                                <span className="bg-gray-100 text-gray-500 px-2 rounded-full text-xs">✏️ {t('admin.detail.gradeModified')}</span>
                              )}
                            </div>
                            <p className="text-xs text-primary mb-2">
                              {report.description.length > 120 ? `${report.description.substring(0, 120)}...` : report.description}
                            </p>
                            <div className="flex gap-4 text-xs text-primary">
                              <span>👤 {report.isAnonymous ? t('admin.detail.anonymousLabel') : `${report.student?.firstName} ${report.student?.lastName}`}</span>
                              <span>🏫 {report.student?.studentProfile?.schoolClass ? `${report.student.studentProfile.schoolClass.level} ${report.student.studentProfile.schoolClass.section}` : '-'}</span>
                              <span>📅 {new Date(report.createdAt).toLocaleDateString('fr-FR')}</span>
                              {report.suspects?.length > 0 && <span>⚠️ {report.suspects.length} {t('admin.detail.suspectsCount')}</span>}
                              <span>{report.caseNumber}</span>
                            </div>
                          </div>
                          <Badge variant={report.status as BadgeVariant} className="ml-4" />
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <Pagination currentPage={currentPage} totalPages={totalPages} totalItems={filtered.length} onPageChange={setCurrentPage} />
              </>
            )}

            {viewSection === 'users' && isAdmin && (
              <section aria-labelledby="users-title">
                <div className="flex justify-between items-center mb-5">
                  <h2 id="users-title" className="text-xl font-bold text-gray-800">👥 {t('admin.users.title')}</h2>
                  <Button onClick={() => { setShowUserForm(true); setEditingUser(null); setUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'student', classId: '' }); }}>
                    {t('admin.users.add')}
                  </Button>
                </div>

                {showUserForm && (
                  <Card className="mb-5">
                    <h3 className="text-gray-800 font-bold mb-4">
                      {editingUser ? t('admin.users.formEdit') : t('admin.users.formAdd')} {t('admin.users.formTitle')}
                    </h3>
                    <div className="rounded-lg bg-primary p-4 mb-5">
                      <Input label={t('admin.users.firstName')} value={userForm.firstName} onChange={e => updateField('firstName', e.target.value)} theme="light" />
                      <div className="min-h-5 w-full">{errors.firstName && <p className="text-red-300 text-xs">{errors.firstName}</p>}</div>
                      <Input label={t('admin.users.lastName')} value={userForm.lastName} onChange={e => updateField('lastName', e.target.value)} theme="light" />
                      <div className="min-h-5 w-full">{errors.lastName && <p className="text-red-300 text-xs">{errors.lastName}</p>}</div>
                      <Input label={t('admin.users.email')} value={userForm.email} onChange={e => updateField('email', e.target.value)} theme="light" />
                      <div className="min-h-5 w-full">{errors.email && <p className="text-red-300 text-xs">{t('admin.users.errorEmailFormat')}</p>}</div>
                      <Input label={t('admin.users.password')} type="password" value={userForm.password} onChange={e => updateField('password', e.target.value)} theme="light" />
                      <div className="min-h-5 w-full">{errors.password && <p className="text-red-300 text-xs">{t('admin.users.errorPasswordLength')}</p>}</div>
                      <div className="text-center">
                        <Select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value, classId: '' })} aria-label={t('admin.users.roles.label')}>
                          <option value="student">{t('admin.users.roles.student')}</option>
                          <option value="teacher">{t('admin.users.roles.teacher')}</option>
                          <option value="staff">{t('admin.users.roles.staff')}</option>
                          <option value="admin">{t('admin.users.roles.admin')}</option>
                          <option value="director">{t('admin.users.roles.director')}</option>
                        </Select>
                        {userForm.role === 'student' && (
                          <Select value={userForm.classId} onChange={e => setUserForm({ ...userForm, classId: e.target.value })} aria-label={t('admin.users.selectClass')}>
                            <option value="">{t('admin.users.selectClass')}</option>
                            <option value="6eme">6ème</option>
                            <option value="5eme">5ème</option>
                            <option value="4eme">4ème</option>
                            <option value="3eme">3ème</option>
                          </Select>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-3 place-content-end">
                      <Button disabled={!isFormValid} onClick={handleSaveUser}>{t('admin.users.save')}</Button>
                      <Button variant="ghost" onClick={() => { setShowUserForm(false); setEditingUser(null); }}>{t('common.cancel')}</Button>
                    </div>
                  </Card>
                )}

                {loadingUsers ? (
                  <p className="text-center py-10 text-gray-400" role="status">{t('admin.loading')}</p>
                ) : (
                  <ul className="flex flex-col gap-3">
                    {users.map(u => (
                      <li key={u.id}>
                        <Card className="flex justify-between items-center">
                          <div>
                            <div className="flex items-center gap-3">
                              {u.avatar ? (
                                <img src={`http://localhost:5000/uploads/avatars/${u.avatar}`} alt={u.firstName} className="w-9 h-9 rounded-full object-cover border-2 border-gray-200" />
                              ) : (
                                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-400">
                                  {u.firstName?.[0]}{u.lastName?.[0]}
                                </div>
                              )}
                              <span className="font-bold text-gray-800">{u.firstName} {u.lastName}</span>
                            </div>
                            <span className="ml-2 text-xs text-gray-400">{u.email}</span>
                            <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded-lg text-xs text-gray-500">{u.role}</span>
                            {u.studentProfile?.schoolClass && (
                              <span className="ml-1 bg-surface px-2 py-0.5 rounded-lg text-xs text-primary">
                                {u.studentProfile.schoolClass.level} {u.studentProfile.schoolClass.section}
                              </span>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button variant="outline" onClick={() => {
                              setEditingUser(u);
                              setUserForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', role: u.role, classId: u.studentProfile?.schoolClass?.id || '' });
                              setShowUserForm(true);
                            }}>✏️ {t('admin.users.edit')}</Button>
                            <label className={`cursor-pointer px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 transition-colors ${uploadingAvatarId === u.id ? 'opacity-50' : ''}`}>
                              {uploadingAvatarId === u.id ? '⏳' : '📷'}
                              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                                onChange={e => { const f = e.target.files?.[0]; if (f) handleAvatarUpload(u.id, f); }}
                              />
                            </label>
                            <Button variant="danger" onClick={() => handleDeleteUser(u.id)}>🗑️ {t('admin.users.delete')}</Button>
                          </div>
                        </Card>
                      </li>
                    ))}
                  </ul>
                )}

                {deleteTarget && (
                  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-sm">
                      <p className="text-sm text-gray-600 mb-4">
                        {deleteError ? deleteError : isBlocked ? t('admin.users.deleteBlocked') : t('admin.users.deleteConfirm')}
                      </p>
                      <div className="flex justify-end gap-3">
                        <button onClick={() => { setDeleteTarget(null); setIsBlocked(false); }}
                          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">
                          {isBlocked ? t('common.close') : t('common.cancel')}
                        </button>
                        {!isBlocked && (
                          <button onClick={confirmDelete} disabled={isDeleting}
                            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">
                            {isDeleting ? t('common.loading') : t('common.delete')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </section>
            )}

            {viewSection === 'stats' && <StatsDashboard reports={reports} />}

          </div>
        </div>
      </main>
    </>
  );
}

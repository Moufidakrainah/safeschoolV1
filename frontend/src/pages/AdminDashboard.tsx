import { useState, useEffect, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  getAllReports, updateReport, getNotes, addNote,
  getAllUsers, getUserById, createUser, updateUser, deleteUser, checkCanDeleteUser,
  searchUsers, resolveSuspect, resolveVictim, getClasses, getStudentParents, getStaffProfile,
  createStaffProfile, updateStaffProfile,
  createParent, updateParent, deleteParent,
} from '../services/api';
import StatsDashboard from './StatsDashboard';
import { SEVERITY_COLORS, severityFromApiGrade } from '../utils/severity';
import { Button } from '../components/ui/button';
import { Badge, type BadgeVariant } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Table, TableBody, TableCell, TableRow } from '../components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import StatCard from '../components/StatCard';
import Pagination from '../components/Pagination';
import NoteBlock from '../components/NoteBlock';
import ConvocationSelector from '../components/ConvocationSelector';
import AdminClasses from '../components/AdminClasses';
import ReportDetail from '../components/ReportDetail';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Pagination as PaginationShadcn, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import type { Report, Note, AdminUser } from '../types';
import RoleHeader from '@/components/layout/Header/RoleHeader';

interface SchoolClass { id: string; level: string; section: string; }

export default function AdminDashboard() {
  const { user, logoutUser } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin';

  const [reports, setReports]     = useState<Report[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Report | null>(null);
  const [saving, setSaving]       = useState(false);
  const [view, setView]           = useState<'list' | 'detail'>('list');

  const [search, setSearch]               = useState('');
  const [filterGrade, setFilterGrade]     = useState('all');
  const [filterStatus, setFilterStatus]   = useState('all');
  const [filterClass, setFilterClass]     = useState('all');
  const [filterStudent, setFilterStudent] = useState('all');
  const [filterSuspect, setFilterSuspect] = useState('');
  const [filterVictim, setFilterVictim]   = useState('');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo]     = useState('');
  const [currentPage, setCurrentPage]     = useState(1);
  const [resetKey, setResetKey]           = useState(0);

  const [notes, setNotes]                     = useState<Note[]>([]);
  const [newNote, setNewNote]                 = useState('');
  const [convocationDate, setConvocationDate] = useState('');
  const [convocationMessage, setConvocationMessage] = useState('');
  const [checkedConvocIds, setCheckedConvocIds] = useState<string[]>([]);
  const [convocDetails, setConvocDetails] = useState<Record<string, { date: string; message: string }>>({});
  const [sendingConvoc, setSendingConvoc] = useState(false);
  const [convocSuccess, setConvocSuccess] = useState(false);

  const [viewSection, setViewSection] = useState<'reports' | 'users' | 'stats' | 'classes'>(
    (searchParams.get('section') as 'reports' | 'users' | 'stats' | 'classes') ?? 'reports'
  );

  useEffect(() => {
    navigate(`/dashboard?section=${viewSection}`, { replace: true });
  }, [viewSection]);

  const [users, setUsers]               = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [usersPage, setUsersPage]       = useState(1);
  const [usersTotalPages, setUsersTotalPages] = useState(1);
  const [usersTotal, setUsersTotal]     = useState(0);
  const [showUserForm, setShowUserForm] = useState(false);
  const [usersSearch, setUsersSearch] = useState('');
  const [usersSort, setUsersSort] = useState<'asc' | 'desc' | 'date'>('asc');
  const [usersRoleFilter, setUsersRoleFilter] = useState<string[]>([]);
  const [editingUser, setEditingUser]   = useState<AdminUser | null>(null);

  const [userForm, setUserForm] = useState({
    firstName: '', lastName: '', email: '', password: '', role: '',
    classId: '', subject: '', classIds: [] as string[],
  });

  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [isDeleting, setIsDeleting]     = useState(false);
  const [deleteError, setDeleteError]   = useState('');
  const [isBlocked, setIsBlocked]       = useState(false);
  const [uploadingAvatarId, setUploadingAvatarId] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const selectedUserId = searchParams.get('userId');
  const [editMode, setEditMode] = useState(false);
  const [profileParents, setProfileParents] = useState<any[]>([]);
  const [profileStaff, setProfileStaff] = useState<any | null>(null);
  const [avatarTimestamps, setAvatarTimestamps] = useState<Record<string, number>>({});
  const [classes, setClasses]           = useState<SchoolClass[]>([]);
  const [activeSuspect, setActiveSuspect] = useState<string | null>(null);
  const [suspectSearch, setSuspectSearch] = useState('');
  const [suspectResults, setSuspectResults] = useState<any[]>([]);
  const [resolving, setResolving]       = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ status: string; label: string } | null>(null);
  const [originReportId, setOriginReportId] = useState<string | null>(null);
  const [errors, setErrors] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [showParentForm, setShowParentForm] = useState(false);
  const [editingParent, setEditingParent] = useState<any | null>(null);
  const [parentForm, setParentForm] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '' });

  const itemsPerPage = 5;

  useEffect(() => { fetchReports(); fetchClassesList(); if (selectedUserId) fetchUsers(); }, []);

  useEffect(() => {
    if (selectedUserId) {
      getUserById(selectedUserId).then(u => {
        if (u) {
          setSelectedUser(u);
          setUserForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', role: u.role, classId: u.studentProfile?.schoolClass?.id || '', subject: '', classIds: [] });
          if (u.role === 'student') getStudentParents(u.id).then(setProfileParents).catch(() => setProfileParents([]));
          else if (u.role === 'teacher') getStaffProfile(u.id).then(setProfileStaff).catch(() => setProfileStaff(null));
        }
      }).catch(() => {});
    }
  }, [selectedUserId]);

  useEffect(() => { if (viewSection === 'users' && !searchParams.get('userId')) fetchUsers(); }, [viewSection]);

  const fetchClassesList = async () => { try { setClasses(await getClasses()); } catch {} };

  const fetchReports = async () => {
    try { setReports(await getAllReports()); } catch {} finally { setLoading(false); }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    setSaving(true);
    try { await updateReport(id, { status }); const updated = await getAllReports(); setReports(updated); setSelected(updated.find((r: any) => r.id === id) ?? null); }
    catch {} finally { setSaving(false); }
  };

  const confirmAndUpdate = (status: string, label: string) => setConfirmAction({ status, label });

  const handleSuspectSearch = async (query: string) => {
    setSuspectSearch(query);
    if (query.length < 2) { setSuspectResults([]); return; }
    try { const r = await searchUsers(query); setSuspectResults(r.filter((u: any) => u.role === 'student')); }
    catch { setSuspectResults([]); }
  };

  const handleResolveSuspect = async (suspectId: string, userId: string | null) => {
    setResolving(true);
    try {
      await resolveSuspect(suspectId, userId);
      const updated = await getAllReports();
      setReports(updated);
      setSelected(updated.find((r: any) => r.id === selected?.id) ?? null);
      setActiveSuspect(null); setSuspectSearch(''); setSuspectResults([]);
    } finally { setResolving(false); }
  };

  const [allUsers, setAllUsers] = useState<AdminUser[]>([]);

  const fetchUsers = async (page?: number, search?: string) => {
    const p = page ?? usersPage;
    const q = search !== undefined ? search : usersSearch;
    setLoadingUsers(true);
    try {
      if (q.trim().length >= 2) {
        const results = await searchUsers(q);
        const arr = Array.isArray(results) ? results : [];
        setAllUsers(arr);
        setUsers(arr);
        setUsersTotalPages(1);
        setUsersTotal(arr.length ?? 0);
        setUsersPage(1);
      } else {
        const data = await getAllUsers(1, 1000);
        const arr = Array.isArray(data.data) ? data.data : [];
        setAllUsers(arr);
        setUsers(arr.slice((p-1)*5, p*5));
        setUsersTotalPages(Math.ceil(arr.length / 7) || 1);
        setUsersTotal(arr.length ?? 0);
      }
    } catch { setAllUsers([]); setUsers([]); }
    finally { setLoadingUsers(false); }
  };

  const handleAvatarUpload = async (userId: string, file: File) => {
    setUploadingAvatarId(userId);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const res = await fetch(`http://localhost:5000/users/${userId}/avatar`, { method: 'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }, body: formData });
      const data = await res.json();
      if (data.avatar) { setAvatarTimestamps(prev => ({ ...prev, [userId]: Date.now() })); await fetchUsers(); setSelectedUser(prev => prev && prev.id === userId ? { ...prev, avatar: data.avatar } : prev); }
    } catch {} finally { setUploadingAvatarId(null); }
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, { firstName: userForm.firstName, lastName: userForm.lastName, email: userForm.email, ...(userForm.password && { password: userForm.password }), role: userForm.role, ...(userForm.role === 'student' && { classId: userForm.classId }) });
        if (userForm.role === 'teacher') {
          try { const e = await getStaffProfile(editingUser.id); await updateStaffProfile(e.id, { subject: userForm.subject, classIds: userForm.classIds }); }
          catch { await createStaffProfile({ userId: editingUser.id, profession: 'teacher', subject: userForm.subject, classIds: userForm.classIds }); }
        }
      } else {
        const created = await createUser({ firstName: userForm.firstName, lastName: userForm.lastName, email: userForm.email, password: userForm.password, role: userForm.role, ...(userForm.role === 'student' && { classId: userForm.classId }) });
        if (userForm.role === 'teacher') await createStaffProfile({ userId: created.id, profession: 'teacher', subject: userForm.subject, classIds: userForm.classIds });
      }
      await fetchUsers();
      setShowUserForm(false); setEditingUser(null);
      setUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'student', classId: '', subject: '', classIds: [] });
    } catch {}
  };

  const handleDeleteUser = async (id: string) => {
    if (id === user?.id) { setDeleteTarget(id); setIsBlocked(true); setDeleteError(t('admin.users.deleteSelf')); return; }
    const { deletable } = await checkCanDeleteUser(id);
    setDeleteTarget(id); setIsBlocked(!deletable); setDeleteError('');
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true); setDeleteError(''); setIsBlocked(false);
    try { await deleteUser(deleteTarget); await fetchUsers(); setDeleteTarget(null); setSelectedUser(null); navigate('/dashboard?section=users', { replace: true }); }
    catch (err: any) {
      const msg = err?.response?.data?.message ?? err?.message ?? '';
      if (msg === 'USER_HAS_REPORTS') setIsBlocked(true);
      else setDeleteError(t('admin.users.deleteError'));
    } finally { setIsDeleting(false); }
  };

  const validateField = (field: string, value: string) => {
    let message = '';
    const nameRegex = /^[a-zA-ZÀ-ÿ\-]{2,20}$/;
    if (field === 'firstName' || field === 'lastName') {
      if (!value.trim()) message = t('admin.users.errorRequired');
      else if (!nameRegex.test(value)) message = t('admin.users.name');
    } else if (field === 'email') {
      if (!value.trim()) message = t('admin.users.errorRequired');
      else if (value.length > 50) message = t('admin.users.tooLong');
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) message = t('admin.users.errorEmailFormat');
    } else if (field === 'password' && value.length > 0) {
      if (value.length < 12) message = t('admin.users.atLeast');
      else if (!/[0-9]/.test(value)) message = t('admin.users.atLeastOneNumber');
      else if (!/[a-z]/.test(value)) message = t('admin.users.atLeastOneMinus');
      else if (!/[A-Z]/.test(value)) message = t('admin.users.atLeastOneMajor');
      else if (!/[^a-zA-Z0-9]/.test(value)) message = t('admin.users.atLeastOneSpecial');
      else if (userForm.firstName && value.toLowerCase().includes(userForm.firstName.toLowerCase())) message = t('admin.users.noFirstName');
      else if (userForm.lastName && value.toLowerCase().includes(userForm.lastName.toLowerCase())) message = t('admin.users.noLastName');
    }
    setErrors(prev => ({ ...prev, [field]: message }));
  };

  const updateField = (field: string, value: string) => {
    let normalized = value;
    if (field === 'firstName') {
      normalized = value.replace(/[^a-zA-ZÀ-ÿ'\-]/g, '').split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-');
    }
    if (field === 'lastName') {
      normalized = value.replace(/[^a-zA-ZÀ-ÿ'\-]/g, '').toUpperCase();
    }
    setUserForm(prev => ({ ...prev, [field]: normalized }));
    validateField(field, normalized);
  };
  const toggleClassId = (id: string) => setUserForm(prev => ({ ...prev, classIds: prev.classIds.includes(id) ? prev.classIds.filter(x => x !== id) : [...prev.classIds, id] }));
  const isFormValid = userForm.firstName.trim() && userForm.lastName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email) && !errors.firstName && !errors.lastName && !errors.email && !errors.password;


  // ── Helpers utilisateurs ─────────────────────────────────────────────────
  const formatName = (firstName: string, lastName: string) => ({
    first: (firstName || '').split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-'),
    last: (lastName || '').toUpperCase(),
  });

  const calcAge = (dateOfBirth: string) => {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age;
  };

  const filteredUsers = useMemo(() => {
    return [...allUsers]
      .filter(u => usersRoleFilter.length === 0 || usersRoleFilter.includes(u.role))
      .sort((a, b) => {
        if (usersSort === 'asc') return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
        if (usersSort === 'desc') return `${b.lastName} ${b.firstName}`.localeCompare(`${a.lastName} ${a.firstName}`);
        if (usersSort === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        return 0;
      });
  }, [users, usersRoleFilter, usersSort]);

  const navigateToUser = (u: AdminUser) => {
    setSelectedUser(u);
    setEditMode(false);
    navigate(`/dashboard?section=users&userId=${u.id}`, { replace: true });
    setUserForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', role: u.role, classId: u.studentProfile?.schoolClass?.id || '', subject: '', classIds: [] });
    setProfileParents([]); setProfileStaff(null);
    if (u.role === 'student') getStudentParents(u.id).then(setProfileParents).catch(() => setProfileParents([]));
    else if (u.role === 'teacher') getStaffProfile(u.id).then(setProfileStaff).catch(() => setProfileStaff(null));
  };

  const filtered = useMemo(() => {
    return reports.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).filter((r: Report) => {
      if (filterGrade !== 'all' && r.grade !== filterGrade) return false;
      if (filterStatus !== 'all' && r.status !== filterStatus) return false;
      if (filterClass !== 'all') { const sc = r.student?.studentProfile?.schoolClass; if ((sc ? `${sc.level} ${sc.section}` : '') !== filterClass) return false; }
      if (filterStudent !== 'all' && r.student?.id !== filterStudent) return false;
      if (filterVictim) { const q = filterVictim.toLowerCase(); const match = (r.reporter === 'victime' && `${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`.toLowerCase().includes(q)) || (r.reporter === 'temoin' && r.victims?.some(v => v.freeText.toLowerCase().includes(q) || (v.resolvedUser && `${v.resolvedUser.firstName} ${v.resolvedUser.lastName}`.toLowerCase().includes(q)))); if (!match) return false; }
      if (filterSuspect) { const q = filterSuspect.toLowerCase(); if (!r.suspects?.some(s => (s.freeText?.toLowerCase() ?? '').includes(q) || `${s.resolvedUser?.firstName ?? ''} ${s.resolvedUser?.lastName ?? ''}`.toLowerCase().includes(q))) return false; }
      if (filterDateFrom && new Date(r.createdAt) < new Date(filterDateFrom)) return false;
      if (filterDateTo) { const to = new Date(filterDateTo); to.setHours(23, 59, 59, 999); if (new Date(r.createdAt) > to) return false; }
      if (search) { const q = search.toLowerCase(); const name = `${r.student?.firstName ?? ''} ${r.student?.lastName ?? ''}`.toLowerCase(); if (!name.includes(q) && !(r.type ?? '').toLowerCase().includes(q) && !(r.description ?? '').toLowerCase().includes(q)) return false; }
      return true;
    });
  }, [reports, filterGrade, filterStatus, filterClass, filterStudent, filterVictim, filterSuspect, filterDateFrom, filterDateTo, search]);

  const totalPages = useMemo(() => Math.ceil(filtered.length / itemsPerPage), [filtered]);
  const paginated  = useMemo(() => filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage), [filtered, currentPage]);

  const stats = useMemo(() => ({
    total: reports.length,
    critical: reports.filter(r => severityFromApiGrade(r.grade) === 'critical').length,
    high:     reports.filter(r => severityFromApiGrade(r.grade) === 'high').length,
    medium:   reports.filter(r => severityFromApiGrade(r.grade) === 'medium').length,
    low:      reports.filter(r => severityFromApiGrade(r.grade) === 'low').length,
  }), [reports]);

  const classOptions = useMemo(() => [...new Set(reports.map(r => { const sc = r.student?.studentProfile?.schoolClass; return sc ? `${sc.level} ${sc.section}` : null; }).filter(Boolean) as string[])].sort(), [reports]);

  const handleReset = () => { setFilterGrade('all'); setFilterStatus('all'); setFilterClass('all'); setFilterStudent('all'); setFilterDateFrom(''); setFilterDateTo(''); setFilterSuspect(''); setFilterVictim(''); setSearch(''); setCurrentPage(1); setResetKey(k => k + 1); };

  const loadNotes = async (reportId: string) => { try { setNotes(await getNotes(reportId)); } catch {} };
  const goTo = (report: typeof selected) => { setSelected(report); if (report) { loadNotes(report.id); setCheckedConvocIds([]); } };

  const handleAddNote = async (type = 'note') => {
    if (!selected) return;
    let content = type === 'convocation' ? convocationMessage : newNote;
    if (!content.trim()) return;
    if (type === 'convocation' && convocationDate) { const f = new Date(convocationDate).toLocaleString('fr-FR', { dateStyle: 'long', timeStyle: 'short' }); content = `${f}\n\n${content}`; }
    try { await addNote(selected.id, content, type); await loadNotes(selected.id); if (type === 'convocation') { setConvocationMessage(''); setConvocationDate(''); } else setNewNote(''); } catch {}
  };

  const renderUserForm = (isEdit = false) => (
    <div className="rounded-lg bg-[var(--color-primary-hover)] p-4 flex flex-col gap-3">
      <div><Label className="text-[var(--text-light)] text-sm">{t('admin.users.firstName')}</Label>
	  <Input value={userForm.firstName} onChange={e => updateField('firstName', e.target.value)} className="bg-[var(--background)] mt-1" />{errors.firstName && 
	  <p className="text-[var(--text-error)] text-xs mt-1">{errors.firstName}</p>}</div>
      <div><Label className="text-[var(--text-light)]">{t('admin.users.lastName')}</Label>
	  <Input value={userForm.lastName} onChange={e => updateField('lastName', e.target.value)} className="bg-[var(--background)] mt-1" />{errors.lastName && 
	  <p className="text-[var(--text-error)] text-xs mt-1">{errors.lastName}</p>}</div>
      <div><Label className="text-[var(--text-light)]">{t('admin.users.email')}</Label>
	  <Input value={userForm.email} onChange={e => updateField('email', e.target.value)} className="bg-[var(--background)] mt-1" />{errors.email && 
	  <p className="text-[var(--text-error)] text-xs mt-1">{t('admin.users.errorEmailFormat')}</p>}</div>
      <div><Label className="text-[var(--text-light)]">{t('admin.users.password')}{isEdit ? t('login.keepEmpty') : ''}</Label>
	  <Input type="password" value={userForm.password} onChange={e => updateField('password', e.target.value)} className="bg-[var(--background)] mt-1" maxLength={20} />{errors.password && 
	  <p className="text-[var(--text-error)] text-xs mt-1">{errors.password}</p>}</div>



    <Select value={userForm.role} onValueChange={v => setUserForm(prev => ({ ...prev, role: v, classId: '', subject: '', classIds: [] }))}>
       	<SelectTrigger className="bg-white">
			<span>
				{userForm.role === "" && t('admin.users.roles.choose')}
				{userForm.role === "student" && t('admin.users.roles.student')}
				{userForm.role === "teacher" && t('admin.users.roles.teacher')}
				{userForm.role === "admin" && t('admin.users.roles.admin')}
				{userForm.role === "director" && t('admin.users.roles.director')}
			</span>
		</SelectTrigger>
        <SelectContent>
          <SelectItem value="student">{t('admin.users.roles.student')}</SelectItem>
          <SelectItem value="teacher">{t('admin.users.roles.teacher')}</SelectItem>
          <SelectItem value="admin">{t('admin.users.roles.admin')}</SelectItem>
        </SelectContent> 


    </Select>
      {userForm.role === 'student' && (
        <div>
          <Label className="text-white text-sm">Classe</Label>
          <Select value={userForm.classId} onValueChange={v => setUserForm(prev => ({ ...prev, classId: v }))}>
            <SelectTrigger className="bg-white mt-1"><SelectValue placeholder={t('admin.users.selectClass')}>{classes.find(c => c.id === userForm.classId) ? `${classes.find(c => c.id === userForm.classId)?.level} ${classes.find(c => c.id === userForm.classId)?.section}` : t('admin.users.selectClass')}</SelectValue></SelectTrigger>
            <SelectContent>{classes.map(c => <SelectItem key={c.id} value={c.id}>{c.level} {c.section}</SelectItem>)}</SelectContent>
          </Select>
        </div>
      )}
      {userForm.role === 'teacher' && (
        <>
          <div>
            <Label className="text-white text-sm">{t('admin.teacher.subjectTeached')}</Label>
            <Input value={userForm.subject} onChange={e => setUserForm(prev => ({ ...prev, subject: e.target.value.slice(0, 50) }))} placeholder="ex: Mathématiques" className="bg-white mt-1" maxLength={50} />
            <p className="text-white/60 text-xs mt-0.5">{userForm.subject.length}/50 caractères</p>
            {userForm.subject.length === 50 && <p className="text-red-300 text-xs mt-0.5">Maximum 50 caractères atteint</p>}
          </div>
          <div>
            <Label className="text-white text-sm mb-2 block">Classes où il intervient</Label>
            <div className="flex flex-wrap gap-2">
              {classes.map(c => (
                <button key={c.id} type="button" onClick={() => toggleClassId(c.id)} className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${userForm.classIds.includes(c.id) ? 'bg-white text-primary border-white' : 'bg-transparent text-white border-white/50 hover:border-white'}`}>{c.level} {c.section}</button>
              ))}
              {classes.length === 0 && <p className="text-white/60 text-xs">Aucune classe disponible</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );

  // ── Vue détail ────────────────────────────────────────────────────────────
  if (view === 'detail' && selected) {
    return (
      <main className="min-h-screen bg-gray-50 font-sans">
        <h1 className="sr-only">{t('admin.title.oneReport')}</h1>
        <RoleHeader user={user} logoutUser={logoutUser} adminViewSection={viewSection} adminSetViewSection={setViewSection} adminSetSelected={setSelected} adminFetchUsers={fetchUsers} />
        <ReportDetail
          selected={selected}
          filtered={filtered}
          notes={notes}
          isAdmin={isAdmin}
          saving={saving}
          resolving={resolving}
          checkedConvocIds={checkedConvocIds}
          convocDetails={convocDetails}
          sendingConvoc={sendingConvoc}
          convocSuccess={convocSuccess}
          newNote={newNote}
          activeSuspect={activeSuspect}
          suspectSearch={suspectSearch}
          suspectResults={suspectResults}
          onBack={() => { setView('list'); setSelected(null); }}
          onPrev={() => goTo(filtered[filtered.findIndex(r => r.id === selected.id) - 1])}
          onNext={() => goTo(filtered[filtered.findIndex(r => r.id === selected.id) + 1])}
          onUpdateStatus={(status, label) => setConfirmAction({ status, label })}
          onAddNote={handleAddNote}
          onResolveSuspect={handleResolveSuspect}
          onResolveVictim={async (victimId, userId) => {
            await resolveVictim(victimId, userId);
            const updated = await getAllReports();
            setReports(updated);
            setSelected(updated.find((r) => r.id === selected?.id) ?? null);
            setActiveSuspect(null); setSuspectSearch(''); setSuspectResults([]);
          }}
          onSetActiveSuspect={setActiveSuspect}
          onSuspectSearch={handleSuspectSearch}
          onSetNewNote={setNewNote}
          onToggleConvoc={id => {
            if (id === '__clear__') { setCheckedConvocIds([]); return; }
            setCheckedConvocIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
          }}
          onSetConvocDetails={setConvocDetails}
          onSetSendingConvoc={setSendingConvoc}
          onSetConvocSuccess={setConvocSuccess}
          onSetSuspectSearch={setSuspectSearch}
          onSetSuspectResults={setSuspectResults}
          onAddNoteRaw={addNote}
          onLoadNotes={loadNotes}
          onNavigateToUser={async (userId) => {
            const currentReportId = selected?.id ?? '';
            setOriginReportId(currentReportId);
            setView('list');
            setSelected(null);
            setSelectedUser(null);
            setEditMode(false);
            setProfileParents([]);
            setProfileStaff(null);
            const u = await getUserById(userId);
            if (u) {
              setSelectedUser(u);
              setUserForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', role: u.role, classId: u.studentProfile?.schoolClass?.id || '', subject: '', classIds: [] });
              if (u.role === 'student') getStudentParents(u.id).then(setProfileParents).catch(() => setProfileParents([]));
              else if (u.role === 'teacher') getStaffProfile(u.id).then(setProfileStaff).catch(() => setProfileStaff(null));
            }
            setViewSection('users');
            navigate(`/dashboard?section=users&userId=${userId}&from=report&reportId=${currentReportId}`, { replace: true });
          }}
        />
        {confirmAction && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-sm">
              <p className="text-sm text-gray-700 mb-4">Confirmer le changement de statut vers <strong>{confirmAction.label}</strong> ?</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => setConfirmAction(null)} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 text-sm">Annuler</button>
                <button onClick={async () => { await handleUpdateStatus(selected!.id, confirmAction.status); setConfirmAction(null); }} disabled={saving} className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 text-sm disabled:opacity-50">{saving ? 'En cours...' : 'Confirmer'}</button>
              </div>
            </div>
          </div>
        )}
      </main>
    );
  }

  // ── Vue liste ─────────────────────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      <h1 className="sr-only">{t('admin.title.allReports')}</h1>
      <RoleHeader user={user} logoutUser={logoutUser} adminViewSection={viewSection} adminSetViewSection={setViewSection} adminSetSelected={setSelected} adminFetchUsers={fetchUsers} />

      <div className="max-w-5xl mx-auto mt-8 px-5 pb-10">

        {/* ── Signalements ── */}
        {viewSection === 'reports' && (
          <>
            <div className="grid grid-cols-5 gap-4 mb-8">
              <StatCard label={t('admin.stats.total')}    value={stats.total}    color={SEVERITY_COLORS.all}      active={filterGrade === 'all'}      activeTextColor="var(--foreground)" onClick={() => { setFilterGrade('all'); setCurrentPage(1); }} />
              <StatCard label={t('admin.stats.critical')} value={stats.critical} color={SEVERITY_COLORS.critical} active={filterGrade === 'critical'} onClick={() => { setFilterGrade('critical'); setCurrentPage(1); }} />
              <StatCard label={t('admin.stats.high')}     value={stats.high}     color={SEVERITY_COLORS.high}     active={filterGrade === 'high'}     onClick={() => { setFilterGrade('high'); setCurrentPage(1); }} />
              <StatCard label={t('admin.stats.medium')}   value={stats.medium}   color={SEVERITY_COLORS.medium}   active={filterGrade === 'medium'}   onClick={() => { setFilterGrade('medium'); setCurrentPage(1); }} />
              <StatCard label={t('admin.stats.low')}      value={stats.low}      color={SEVERITY_COLORS.low}      active={filterGrade === 'low'}      onClick={() => { setFilterGrade('low'); setCurrentPage(1); }} />
            </div>
            <div className="mb-5"><Input type="search" value={search} onChange={e => { setSearch(e.target.value); setCurrentPage(1); }} placeholder={t('admin.search.placeholder')} /></div>
            <div className="flex flex-wrap items-center justify-center gap-2 mb-4">
              <Select value={filterStatus} onValueChange={v => { setFilterStatus(v); setCurrentPage(1); }}>
                <SelectTrigger aria-label={t('admin.filters.status')} className="w-auto">
                  <Badge variant={filterStatus as BadgeVariant} />
                </SelectTrigger>
                <SelectContent>
                  {(['all', 'new', 'in_progress', 'pending', 'resolved', 'false_report'] as (BadgeVariant | 'all')[]).map(status => (
                    <SelectItem key={status} value={status}>
                      <Badge variant={status as BadgeVariant} />
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filterClass} onValueChange={v => { setFilterClass(v); setCurrentPage(1); }}><SelectTrigger aria-label={t('admin.filters.allClasses')}><SelectValue>{filterClass === 'all' ? t('admin.filters.allClasses') : filterClass}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">{t('admin.filters.allClasses')}</SelectItem>{classOptions.map(cls => <SelectItem key={cls} value={cls}>{cls}</SelectItem>)}</SelectContent></Select>
              <Select value={filterStudent} onValueChange={v => { setFilterStudent(v); setCurrentPage(1); }}><SelectTrigger aria-label={t('admin.filters.allReporters')}><SelectValue>{filterStudent === 'all' ? t('admin.filters.allReporters') : (() => { const s = reports.find(r => r.student?.id === filterStudent)?.student; return s ? `${s.firstName} ${s.lastName}` : t('admin.filters.allReporters'); })()}</SelectValue></SelectTrigger><SelectContent><SelectItem value="all">{t('admin.filters.allReporters')}</SelectItem>{[...new Map(reports.filter(r => r.student && !r.isAnonymous).map(r => [r.student!.id, r.student!])).values()].map(s => <SelectItem key={s.id} value={s.id}>{s.firstName} {s.lastName} ({s.role})</SelectItem>)}</SelectContent></Select>
              <Input type="search" value={filterVictim} onChange={e => { setFilterVictim(e.target.value); setCurrentPage(1); }} placeholder={t('admin.filters.victimPlaceholder') || 'Nom de la victime...'} className="max-w-[180px]" />
              <Input type="search" value={filterSuspect} onChange={e => { setFilterSuspect(e.target.value); setCurrentPage(1); }} placeholder={t('admin.filters.suspectPlaceholder')} className="max-w-[180px]" />
              <div className="w-full flex items-center justify-center gap-2 mt-2">
                <span className="text-gray-600 text-sm">Dates :</span>
                <Input key={`from-${resetKey}`} type="date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setCurrentPage(1); }} className="max-w-[150px]" />
                <span className="text-gray-400">→</span>
                <Input key={`to-${resetKey}`} type="date" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setCurrentPage(1); }} className="max-w-[150px]" />
              </div>
            </div>
            <div className="flex justify-center mb-4"><Button variant="outline" onClick={handleReset}>{t('admin.filters.reset')}</Button></div>
            {loading ? <p className="text-center py-16 text-gray-400">{t('admin.loading')}</p> : filtered.length === 0 ? <p className="text-center py-16 text-gray-400">{t('admin.noReports')}</p> : (
              <ul className="flex flex-col gap-3">
                {paginated.map(report => (
                  <li key={report.id} style={{ borderLeft: `5px solid ${SEVERITY_COLORS[severityFromApiGrade(report.grade)]}` }}
                    className="bg-surface px-6 py-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => { setSelected(report); setView('detail'); loadNotes(report.id); }} role="button" tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && (setSelected(report), setView('detail'), loadNotes(report.id))}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <span className="font-bold text-sm text-primary">{report.type} — {report.reporter}</span>
                        <p className="text-xs text-gray-600 mt-1 mb-2">{report.description.length > 120 ? `${report.description.substring(0,120)}...` : report.description}</p>
                        <div className="flex gap-4 text-xs text-gray-400">
                          <span>{report.isAnonymous ? t('admin.detail.anonymousLabel') : `${report.student?.firstName} ${report.student?.lastName}`}</span>
                          <span>{report.student?.studentProfile?.schoolClass ? `${report.student.studentProfile.schoolClass.level} ${report.student.studentProfile.schoolClass.section}` : '-'}</span>
                          <span>{new Date(report.createdAt).toLocaleDateString('fr-FR')}</span>
                          {report.suspects?.length > 0 && <span>{report.suspects.length} {t('admin.detail.suspectsCount')}</span>}
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

        {/* ── Utilisateurs — Vue profil ── */}
        {viewSection === 'users' && isAdmin && selectedUser && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <Button variant="ghost" onClick={() => {
                setSelectedUser(null); setEditMode(false);
                if (originReportId) {
                  const report = reports.find(r => r.id === originReportId);
                  const goToReport = (r: any) => { setSelected(r); setView('detail'); loadNotes(r.id); setOriginReportId(null); };
                  if (report) { goToReport(report); }
                  else { getAllReports().then(all => { const r = all.find((r: any) => r.id === originReportId); if (r) { setReports(all); goToReport(r); } }); }
                  setViewSection('reports');
                } else {
                  navigate('/dashboard?section=users', { replace: true });
                }
              }}>← {originReportId ? 'Retour au signalement' : 'Retour à la liste'}</Button>
              <div className="flex gap-2">
                <Button variant="ghost"
                  disabled={filteredUsers.findIndex(u => u.id === selectedUser.id) === 0}
                  onClick={() => { const idx = filteredUsers.findIndex(u => u.id === selectedUser.id); const prev = filteredUsers[idx - 1]; if (prev) navigateToUser(prev); }}>← Précédent</Button>
                <Button variant="ghost"
                  disabled={filteredUsers.findIndex(u => u.id === selectedUser.id) === filteredUsers.length - 1}
                  onClick={() => { const idx = filteredUsers.findIndex(u => u.id === selectedUser.id); const next = filteredUsers[idx + 1]; if (next) navigateToUser(next); }}>Suivant →</Button>
              </div>
            </div>
            <Card><CardContent className="pt-6">
              <div className="flex flex-col items-center gap-3 mb-6">
                <div className="relative">
                  {selectedUser.avatar
                    ? <img src={`http://localhost:5000/uploads/avatars/${selectedUser.avatar}?t=${avatarTimestamps[selectedUser.id] ?? 0}`} alt={selectedUser.firstName} className="w-56 h-56 rounded-full object-cover border-4 border-primary shadow" />
                    : <div className="w-56 h-56 rounded-full bg-gray-200 flex items-center justify-center text-6xl font-bold text-gray-400 border-4 border-gray-200">{selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}</div>}
                </div>
                <div className="text-center">
                  {(() => { const { first, last } = formatName(selectedUser.firstName, selectedUser.lastName); return <h2 className="text-xl font-bold text-gray-800">{first} {last}</h2>; })()}
                  <span className="text-sm text-gray-700 capitalize">{selectedUser.role}</span>
                  {selectedUser.studentProfile?.schoolClass && <p className="text-sm text-primary mt-1">{selectedUser.studentProfile.schoolClass.level} {selectedUser.studentProfile.schoolClass.section}</p>}
                  <p className="text-sm text-gray-700 mt-1">{selectedUser.email}</p>
                </div>
              </div>
              {!editMode && (
                <div className="flex justify-center gap-3 mb-4">
                  <Button onClick={async () => { setEditMode(true); if (selectedUser.role === 'teacher') { try { const s = await getStaffProfile(selectedUser.id); setUserForm(prev => ({ ...prev, subject: s.subject ?? '', classIds: s.classes?.map((c: any) => c.id) ?? [] })); } catch {} } }}>{t('admin.users.edit')}</Button>
                  <label className={`cursor-pointer flex items-center gap-1 px-4 py-2 rounded-lg border text-sm font-medium hover:bg-gray-50 ${uploadingAvatarId === selectedUser.id ? 'opacity-50' : ''}`}>
                    {uploadingAvatarId === selectedUser.id ? 'Upload...' : 'Changer la photo'}
                    <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) { await handleAvatarUpload(selectedUser.id, f); } }} />
                  </label>
                  <Button variant="destructive" onClick={e => { e.stopPropagation(); handleDeleteUser(selectedUser.id); }}>{t('admin.users.delete')}</Button>
                </div>
              )}
              {!editMode && (
                <div className="mt-4">
                  <Table><TableBody>
                    {selectedUser.studentProfile?.schoolClass && <TableRow><TableCell className="font-semibold text-muted-foreground">Classe</TableCell><TableCell>{selectedUser.studentProfile.schoolClass.level} {selectedUser.studentProfile.schoolClass.section}</TableCell></TableRow>}
                    {selectedUser.studentProfile?.dateOfBirth && <TableRow><TableCell className="font-semibold text-muted-foreground">Date de naissance</TableCell><TableCell>{new Date(selectedUser.studentProfile.dateOfBirth).toLocaleDateString('fr-FR')} ({calcAge(selectedUser.studentProfile.dateOfBirth)} ans)</TableCell></TableRow>}
                    {(selectedUser.staffProfile?.profession || profileStaff?.profession) && <TableRow><TableCell className="font-semibold text-muted-foreground">Profession</TableCell><TableCell>{profileStaff?.profession ?? selectedUser.staffProfile?.profession}</TableCell></TableRow>}
                    {profileStaff?.subject && <TableRow><TableCell className="font-semibold text-muted-foreground">Matière</TableCell><TableCell>{profileStaff.subject}</TableCell></TableRow>}
                    {profileStaff?.classes?.length > 0 && <TableRow><TableCell className="font-semibold text-muted-foreground">Classes</TableCell><TableCell>{profileStaff.classes.map((c: any) => `${c.level} ${c.section}`).join(', ')}</TableCell></TableRow>}
                  </TableBody></Table>
                  <div className="mt-5">
                    <div className="flex justify-between items-center mb-2">
                      <p className="text-sm font-semibold text-muted-foreground">Responsables légaux</p>
                      {profileParents.length < 2 && !showParentForm && (
                        <Button size="sm" variant="outline" onClick={() => { setShowParentForm(true); setEditingParent(null); setParentForm({ firstName: '', lastName: '', email: '', phone: '', address: '' }); }}>+ Ajouter</Button>
                      )}
                    </div>
                    {showParentForm && (
                      <div className="bg-gray-50 rounded-lg p-3 mb-3 flex flex-col gap-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div><Label className="text-xs">Prénom</Label><Input value={parentForm.firstName} onChange={e => {
                            const val = e.target.value.replace(/[^a-zA-ZÀ-ÿ'\-]/g, '');
                            setParentForm(p => ({ ...p, firstName: val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() }));
                          }} maxLength={20} className="mt-1" /></div>
                          <div><Label className="text-xs">Nom</Label><Input value={parentForm.lastName} onChange={e => {
                            const val = e.target.value.replace(/[^a-zA-ZÀ-ÿ'\-]/g, '');
                            setParentForm(p => ({ ...p, lastName: val.toUpperCase() }));
                          }} maxLength={20} className="mt-1" /></div>
                        </div>
                        <div><Label className="text-xs">Email</Label><Input type="email" value={parentForm.email} onChange={e => setParentForm(p => ({ ...p, email: e.target.value }))} maxLength={50} className="mt-1" /></div>
                        <div><Label className="text-xs">Téléphone</Label><Input value={parentForm.phone} onChange={e => setParentForm(p => ({ ...p, phone: e.target.value.replace(/[^0-9+\s]/g, '') }))} maxLength={15} className="mt-1" /></div>
                        <div><Label className="text-xs">Adresse</Label><Input value={parentForm.address} onChange={e => setParentForm(p => ({ ...p, address: e.target.value }))} className="mt-1" /></div>
                        <div className="flex gap-2 justify-end mt-1">
                          <Button size="sm" disabled={
                            !parentForm.firstName || parentForm.firstName.length < 2 ||
                            !parentForm.lastName || parentForm.lastName.length < 2 ||
                            !parentForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentForm.email)
                          } onClick={async () => {
                            if (editingParent) {
                              await updateParent(editingParent.id, parentForm);
                            } else {
                              const studentProfileId = selectedUser?.studentProfile?.id;
                              if (studentProfileId) await createParent({ ...parentForm, studentIds: [studentProfileId] });
                            }
                            const updated = await getStudentParents(selectedUser!.id);
                            setProfileParents(updated);
                            setShowParentForm(false); setEditingParent(null);
                          }}>Enregistrer</Button>
                          <Button size="sm" variant="ghost" onClick={() => { setShowParentForm(false); setEditingParent(null); }}>Annuler</Button>
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      {profileParents.map((p: any) => {
                        const { first, last } = formatName(p.firstName, p.lastName);
                        return (
                          <div key={p.id} className="bg-gray-50 rounded-lg px-4 py-2">
                            <div className="flex justify-between items-center mb-2">
                              <p className="font-semibold text-gray-800">{first} {last}</p>
                              <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => { setEditingParent(p); setParentForm({ firstName: p.firstName, lastName: p.lastName, email: p.email, phone: p.phone ?? '', address: p.address ?? '' }); setShowParentForm(true); }}>Modifier</Button>
                                <Button size="sm" variant="destructive" onClick={async () => { await deleteParent(p.id); setProfileParents(await getStudentParents(selectedUser!.id)); }}>Supprimer</Button>
                              </div>
                            </div>
                            <table className="w-full table-fixed text-sm"><tbody>{[{ label: 'Email', value: p.email }, { label: 'Téléphone', value: p.phone ?? '—' }, { label: 'Adresse', value: p.address ?? '—' }].map(row => <tr key={row.label} className="border-b border-gray-100"><td className="py-1.5 text-gray-400 font-semibold w-2/5">{row.label}</td><td className="py-1.5 text-gray-700">{row.value}</td></tr>)}</tbody></table>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
              {editMode && (
                <>{renderUserForm(true)}<div className="flex gap-3 justify-end mt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button disabled={!isFormValid}>{t('admin.users.save')}</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Confirmer les modifications</AlertDialogTitle>
                        <AlertDialogDescription asChild>
                          <div className="text-sm text-gray-700 space-y-1 mt-2">
                            <p><strong>Prénom :</strong> {userForm.firstName}</p>
                            <p><strong>Nom :</strong> {userForm.lastName}</p>
                            <p><strong>Email :</strong> {userForm.email}</p>
                            <p><strong>Rôle :</strong> {userForm.role}</p>
                            {userForm.role === 'student' && userForm.classId && <p><strong>Classe :</strong> {classes.find(c => c.id === userForm.classId)?.level} {classes.find(c => c.id === userForm.classId)?.section}</p>}
                            {userForm.role === 'teacher' && userForm.subject && <p><strong>Matière :</strong> {userForm.subject}</p>}
                            {userForm.password && <p><strong>Mot de passe :</strong> modifié</p>}
                          </div>
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                        <AlertDialogAction onClick={async () => {
                          await updateUser(selectedUser.id, { firstName: userForm.firstName, lastName: userForm.lastName, email: userForm.email, role: userForm.role, ...(userForm.password && { password: userForm.password }), ...(userForm.role === 'student' && { classId: userForm.classId }) });
                          if (userForm.role === 'teacher') { try { const e = await getStaffProfile(selectedUser.id); await updateStaffProfile(e.id, { subject: userForm.subject, classIds: userForm.classIds }); } catch { await createStaffProfile({ userId: selectedUser.id, profession: 'teacher', subject: userForm.subject, classIds: userForm.classIds }); } }
                          await fetchUsers(); setEditMode(false);
                          const u = users.find(u => u.id === selectedUser.id);
                          if (u) setSelectedUser({ ...u, firstName: userForm.firstName, lastName: userForm.lastName, email: userForm.email, role: userForm.role });
                        }}>Confirmer</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                  <Button variant="ghost" onClick={() => setEditMode(false)}>{t('common.cancel')}</Button>
                </div></>
              )}
            </CardContent></Card>
          </section>
        )}

        {/* ── Utilisateurs — Vue liste ── */}
        {viewSection === 'users' && isAdmin && !selectedUser && (
          <section>
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-xl font-bold text-gray-800">{t("admin.users.title")}</h2>
              <div className="flex items-center gap-2">
                <select value={usersSort} onChange={e => setUsersSort(e.target.value as any)} className="text-sm border rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:border-primary">
                  <option value="asc">A → Z</option>
                  <option value="desc">Z → A</option>
                  <option value="date">Date création</option>
                </select>
                <Button onClick={() => { setShowUserForm(true); setEditingUser(null); setUserForm({ firstName: "", lastName: "", email: "", password: "", role: "", classId: "", subject: "", classIds: [] }); }}>{t("admin.users.add")}</Button>
              </div>
            </div>
            <div className="flex gap-2 mb-3">
              <Input type="search" placeholder="Rechercher par nom ou prénom..." value={usersSearch} maxLength={120}
                onChange={e => { setUsersSearch(e.target.value); setUsersPage(1); fetchUsers(1, e.target.value); }} className="flex-1" />
              <Button variant="outline" onClick={() => { setUsersSearch(''); setUsersRoleFilter([]); setUsersPage(1); fetchUsers(1, ''); }}>Réinitialiser</Button>
            </div>
            <div className="flex gap-4 mb-4 flex-wrap items-center">
              {([{ key: 'student', label: 'Élèves' }, { key: 'teacher', label: 'Profs' }, { key: 'admin', label: 'Admins' }]).map(r => (
                <label key={r.key} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                  <Checkbox checked={usersRoleFilter.includes(r.key)}
                    onCheckedChange={checked => { const newFilter = checked ? [...usersRoleFilter, r.key] : usersRoleFilter.filter(x => x !== r.key); setUsersRoleFilter(newFilter); setUsersPage(1); setTimeout(() => fetchUsers(1), 0); }} />
                  {r.label}
                </label>
              ))}
            </div>
            {showUserForm && (
              <Card className="mb-5"><CardContent className="pt-6">
                <h3 className="font-bold mb-4">{editingUser ? t('admin.users.formEdit') : t('admin.users.formAdd')} {t('admin.users.formTitle')}</h3>
                {renderUserForm(false)}
                <div className="flex gap-3 justify-end mt-4"><Button disabled={!isFormValid} onClick={handleSaveUser}>{t('admin.users.save')}</Button><Button variant="ghost" onClick={() => { setShowUserForm(false); setEditingUser(null); }}>{t('common.cancel')}</Button></div>
              </CardContent></Card>
            )}
            {loadingUsers ? (
              <p className="text-center py-10 text-gray-400">{t('admin.loading')}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {filteredUsers.slice((usersPage-1)*7, usersPage*7).map(u => {
                  const { first, last } = formatName(u.firstName, u.lastName);
                  return (
                    <li key={u.id}>
                      <div className="cursor-pointer hover:shadow-md transition-shadow bg-white shadow-sm overflow-hidden"
                        onClick={async () => {
                          const freshU = await getUserById(u.id);
                          if (freshU) {
                            navigateToUser(freshU);
                          }
                        }}>
                        <div className="flex items-stretch">
                          <div style={{ width: "96px", height: "96px", flexShrink: 0, overflow: "hidden", borderRadius: 0 }}>
                            {u.avatar
                              ? <img src={`http://localhost:5000/uploads/avatars/${u.avatar}?t=${avatarTimestamps[u.id] ?? 0}`} alt={u.firstName} style={{ width: "96px", height: "96px", objectFit: "cover", display: "block" }} />
                              : <div style={{ width: "96px", height: "96px", background: "#e5e7eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1rem", fontWeight: "bold", color: "#9ca3af" }}>{u.firstName?.[0]}{u.lastName?.[0]}</div>}
                          </div>
                          <div className="flex-1 px-4 py-3" style={{ minHeight: "80px" }}>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-gray-800">{first} {last}</span>
                              <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-500">{u.role}</span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">{u.email}</p>
                            {u.studentProfile?.schoolClass && <span className="mt-1 inline-block bg-blue-50 px-2 py-0.5 rounded text-xs text-blue-600">{u.studentProfile.schoolClass.level} {u.studentProfile.schoolClass.section}</span>}
                            {u.role === 'teacher' && (
                              <div className="mt-1 flex flex-wrap gap-1">
                                {u.staffProfile?.subject && <span className="bg-purple-50 px-2 py-0.5 rounded text-xs text-purple-600">{u.staffProfile.subject}</span>}
                                {u.staffProfile?.classes?.map((c: any) => <span key={c.id} className="bg-purple-50 px-2 py-0.5 rounded text-xs text-purple-600">{c.level} {c.section}</span>)}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {Math.ceil(filteredUsers.length / 7) > 1 && (
              <PaginationShadcn className="mt-4">
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious onClick={() => { if (usersPage > 1) { setUsersPage(p => p-1); fetchUsers(usersPage-1); } }} className={usersPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                  </PaginationItem>
                  {Array.from({ length: Math.ceil(filteredUsers.length / 7) }, (_, i) => i+1).map(p => (
                    <PaginationItem key={p}>
                      <PaginationLink isActive={p === usersPage} onClick={() => { setUsersPage(p); fetchUsers(p); }} className="cursor-pointer">{p}</PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext onClick={() => { if (usersPage < usersTotalPages) { setUsersPage(p => p+1); fetchUsers(usersPage+1); } }} className={usersPage === Math.ceil(filteredUsers.length / 7) ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                  </PaginationItem>
                </PaginationContent>
              </PaginationShadcn>
            )}
          </section>
        )}

        {/* ── Stats ── */}
        {viewSection === 'stats' && <StatsDashboard reports={reports} />}

        {/* ── Classes ── */}
        {viewSection === 'classes' && isAdmin && <AdminClasses />}


        {/* ── Modale suppression utilisateur ── */}
        {deleteTarget && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 shadow-xl w-full max-w-sm">
              <p className="text-sm text-gray-600 mb-4">{deleteError ? deleteError : isBlocked ? t('admin.users.deleteBlocked') : t('admin.users.deleteConfirm')}</p>
              <div className="flex justify-end gap-3">
                <button onClick={() => { setDeleteTarget(null); setIsBlocked(false); setDeleteError(''); }} className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300">{isBlocked ? t('common.close') : t('common.cancel')}</button>
                {!isBlocked && <button onClick={confirmDelete} disabled={isDeleting} className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50">{isDeleting ? t('common.loading') : t('common.delete')}</button>}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
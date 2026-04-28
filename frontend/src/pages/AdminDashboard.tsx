import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  getAllReports, updateReport, getNotes, addNote,
  getAllUsers, createUser, updateUser, deleteUser,
} from '../services/api';
import StatsDashboard from './StatsDashboard';
import { SEVERITY_COLORS, severityFromApiGrade } from '../utils/severity';
import Button from '../components/Button';
import Badge, { type BadgeVariant } from '../components/Badge';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Select from '../components/Select';
import Pagination from '../components/Pagination';
import NoteBlock from '../components/NoteBlock';

// ─── Header ──────────────────────────────────────────────────────────────────
// Extrait en dehors du composant principal pour éviter la recréation à chaque render.

interface HeaderProps {
  user: { role: string; firstName?: string; lastName?: string } | null;
  logoutUser: () => void;
  viewSection: string;
  setViewSection: (s: 'reports' | 'users' | 'stats') => void;
  setSelected: (r: any) => void;
  fetchUsers: () => void;
  t: (key: string) => string;
}

function Header({ user, logoutUser, viewSection, setViewSection, setSelected, fetchUsers, t }: HeaderProps) {
  const navItems: { key: 'reports' | 'users' | 'stats'; label: string; onClick: () => void }[] = [
    { key: 'reports', label: t('admin.nav.reports'), onClick: () => { setSelected(null); setViewSection('reports'); } },
    { key: 'users',   label: t('admin.nav.users'),   onClick: () => { setSelected(null); setViewSection('users'); fetchUsers(); } },
    { key: 'stats',   label: t('admin.nav.stats'),   onClick: () => { setSelected(null); setViewSection('stats'); } },
  ];

  const roleLabel = user?.role
    ? user.role.charAt(0).toUpperCase() + user.role.slice(1)
    : '';

  return (
    <header>
      {/* Bandeau utilisateur */}
      <div className="px-8 py-2 bg-surface flex items-center">
        <div className="flex-1" />
        <span className="text-gray-800 font-bold text-sm" aria-live="polite">
          {t('admin.topbar.role').replace('{{role}}', roleLabel)}
          {user?.firstName ? ` — ${user.firstName} ${user.lastName?.toUpperCase() ?? ''}` : ''}
        </span>
        <div className="flex-1 flex justify-end">
          <Button variant="outline" onClick={logoutUser}>
            {t('nav.logout')}
          </Button>
        </div>
      </div>

      {/* Barre de navigation */}
      <nav className="bg-primary px-8 py-4 flex items-center gap-8" aria-label={t('admin.nav.ariaLabel')}>
        <img src="/logos/safeschool-logo.png" alt="SafeSchool" className="h-8" />
        {navItems.map(item => (
          <button
            key={item.key}
            onClick={item.onClick}
            aria-current={viewSection === item.key ? 'page' : undefined}
            className={`font-bold text-sm transition-opacity ${
              viewSection === item.key
                ? 'text-white underline underline-offset-4'
                : 'text-white/80 hover:text-white'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
}

// ─── AdminDashboard ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { user, logoutUser } = useAuth();
  const { t } = useTranslation();
  const isAdmin = user?.role === 'admin';

  // ── État signalements
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
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
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [resetKey, setResetKey] = useState(0);

  // ── État notes
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [convocationDate, setConvocationDate] = useState('');
  const [convocationMessage, setConvocationMessage] = useState('');

  // ── État section
  const [viewSection, setViewSection] = useState<'reports' | 'users' | 'stats'>('reports');

  // ── État utilisateurs
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', role: 'student', schoolClass: '',
  });

  const itemsPerPage = 5;

  // ── Chargement initial
  useEffect(() => { fetchReports(); }, []);

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

  // ── Mise à jour statut
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

  // ── Filtrage
  const filtered = reports.filter((r: any) => {
    if (filterGrade !== 'all' && r.grade !== filterGrade) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
    if (filterClass !== 'all' && r.student?.studentProfile?.schoolClass !== filterClass) return false;
    if (filterStudent !== 'all' && r.student?.id !== filterStudent) return false;
    if (filterSuspect) {
      const q = filterSuspect.toLowerCase();
      const match = r.suspects?.some((s: any) => {
        const name = `${s.user?.firstName ?? ''} ${s.user?.lastName ?? ''}`.toLowerCase();
        return name.includes(q) || (s.freeText?.toLowerCase() ?? '').includes(q);
      });
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
      if (!name.includes(q) && !(r.title ?? '').toLowerCase().includes(q) && !(r.description ?? '').toLowerCase().includes(q))
        return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  // ── Compteurs pour les StatCards
  const stats = {
    total:     reports.length,
    critical:  reports.filter((r: any) => severityFromApiGrade(r.grade) === 'critical').length,
    high:      reports.filter((r: any) => severityFromApiGrade(r.grade) === 'high').length,
    pending:   reports.filter((r: any) => r.status === 'pending').length,
    escalated: reports.filter((r: any) => r.status === 'escalated').length,
  };

  const handleReset = () => {
    setFilterGrade('all');
    setFilterStatus('all');
    setFilterClass('all');
    setFilterStudent('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterSuspect('');
    setSearch('');
    setCurrentPage(1);
    setResetKey(k => k + 1);
  };

  // ── Notes
  const loadNotes = async (reportId: string) => {
    try {
      const data = await getNotes(reportId);
      setNotes(data);
    } catch {
      console.error('Erreur chargement notes');
    }
  };

  const handleAddNote = async (type: string = 'note') => {
    let content = type === 'convocation' ? convocationMessage : newNote;
    if (!content.trim()) return;
    // Si convocation avec date, on préfixe le message avec la date choisie
    if (type === 'convocation' && convocationDate) {
      const formatted = new Date(convocationDate).toLocaleString('fr-FR', {
        dateStyle: 'long', timeStyle: 'short',
      });
      content = `📅 ${formatted}\n\n${content}`;
    }
    try {
      await addNote(selected.id, content, type);
      await loadNotes(selected.id);
      if (type === 'convocation') { setConvocationMessage(''); setConvocationDate(''); }
      else setNewNote('');
    } catch {
      console.error('Erreur ajout note');
    }
  };

  // ── Utilisateurs
  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch {
      console.error('Erreur chargement utilisateurs');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) await updateUser(editingUser.id, userForm);
      else await createUser(userForm);
      await fetchUsers();
      setShowUserForm(false);
      setEditingUser(null);
      setUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'student', schoolClass: '' });
    } catch {
      console.error('Erreur sauvegarde utilisateur');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm(t('admin.users.deleteConfirm'))) return;
    try {
      await deleteUser(id);
      await fetchUsers();
    } catch {
      console.error('Erreur suppression utilisateur');
    }
  };

  const headerProps: HeaderProps = { user, logoutUser, viewSection, setViewSection, setSelected, fetchUsers, t };

  // ── Vue détail ──────────────────────────────────────────────────────────────
  if (view === 'detail' && selected) {
    const idx = filtered.findIndex((r: any) => r.id === selected.id);
    const severityColor = SEVERITY_COLORS[severityFromApiGrade(selected.grade)];

    return (
      <div className="flex-1 bg-gray-50 font-sans">
        <Header {...headerProps} />
        <div className="max-w-5xl mx-auto mt-8 px-5 pb-10">

          {/* Navigation précédent / suivant */}
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => setSelected(filtered[idx - 1])}
              disabled={idx === 0}
              aria-label={t('admin.prev')}
            >
              ← {t('admin.prev')}
            </Button>
            <span className="font-bold text-primary">
              {t('admin.reportLabel', { number: selected.caseNumber })}
            </span>
            <Button
              variant="ghost"
              onClick={() => setSelected(filtered[idx + 1])}
              disabled={idx === filtered.length - 1}
              aria-label={t('admin.next')}
            >
              {t('admin.next')} →
            </Button>
          </div>

          {/* Statut + boutons d'action */}
          <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
            <Badge variant={selected.status as BadgeVariant} />
            {isAdmin && (
              <div className="flex gap-2 flex-wrap" role="group" aria-label={t('admin.actions.groupLabel')}>
                {([
                  { status: 'in_progress', label: `🔄 ${t('admin.actions.inProgress')}`, variant: 'primary'  },
                  { status: 'escalated',   label: `🚨 ${t('admin.actions.escalate')}`,   variant: 'warning'  },
                  { status: 'closed',      label: `✅ ${t('admin.actions.close')}`,       variant: 'success'  },
                  { status: 'rejected',    label: `❌ ${t('admin.actions.reject')}`,      variant: 'danger'   },
                ] as const).map(btn => (
                  <Button
                    key={btn.status}
                    variant={btn.variant}
                    disabled={saving}
                    onClick={() => handleUpdateStatus(selected.id, btn.status)}
                  >
                    {btn.label}
                  </Button>
                ))}
              </div>
            )}
          </div>

          {/* Informations + personnes impliquées */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <Card borderColor={severityColor}>
              <h3 className="text-primary text-sm font-bold mb-4">{t('admin.detail.info')}</h3>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {([
                    { label: t('admin.detail.titleField'), value: selected.title },
                    { label: t('admin.detail.date'),       value: new Date(selected.createdAt).toLocaleDateString('fr-FR') },
                    { label: t('admin.detail.class'),      value: selected.student?.studentProfile?.schoolClass ?? '-' },
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
                <ul aria-label={t('admin.detail.suspects')} className="flex flex-col gap-1">
                  {selected.suspects.map((s: any, i: number) => (
                    <li key={i} className="bg-surface px-3 py-1 text-sm text-red-500">
                      {s.user ? `${s.user.firstName} ${s.user.lastName}` : s.freeText}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-300">{t('admin.detail.noSuspect')}</p>
              )}
            </Card>
          </div>

          {/* Description */}
          <Card borderColor={severityColor} className="mb-6">
            <h3 className="text-primary text-sm font-bold mb-3">{selected.aiReason}</h3>
            <p className="text-sm text-gray-700 leading-7">
              {selected.description?.split('|')[0]?.trim()}
            </p>
          </Card>

          {/* Notes administratives */}
          <Card borderColor={severityColor} className="mb-6">
            <h3 className="text-primary text-sm font-bold mb-4">📝 {t('admin.notes.title')}</h3>
            {notes.length > 0 ? (
              <div className="flex flex-col gap-3 mb-5">
                {notes.map((note: any) => <NoteBlock key={note.id} note={note} />)}
              </div>
            ) : (
              <p className="text-sm text-gray-400 mb-5">{t('admin.notes.empty')}</p>
            )}
            {isAdmin && (
              <>
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  rows={3}
                  placeholder={t('admin.notes.placeholder')}
                  aria-label={t('admin.notes.placeholder')}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none resize-y mb-3 font-[inherit] box-border"
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
                <input
                  id="convocation-date"
                  type="datetime-local"
                  value={convocationDate}
                  onChange={e => setConvocationDate(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none text-gray-700"
                />
              </div>
              <textarea
                value={convocationMessage}
                onChange={e => setConvocationMessage(e.target.value)}
                rows={3}
                placeholder={t('admin.convocation.placeholder')}
                aria-label={t('admin.convocation.placeholder')}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none resize-y mb-3 font-[inherit] box-border"
              />
              <Button onClick={() => handleAddNote('convocation')}>
                {t('admin.convocation.send')}
              </Button>
            </Card>
          )}

        </div>
      </div>
    );
  }

  // ── Vue liste ───────────────────────────────────────────────────────────────
  return (
    <div className="flex-1 bg-white font-sans">
      <Header {...headerProps} />

      <div className="max-w-5xl mx-auto mt-8 px-5 pb-10">

        {/* ── Section signalements ── */}
        {viewSection === 'reports' && (
          <>
            {/* StatCards — les 3 premières filtrent par grade, les 2 dernières par statut */}
            <div className="grid grid-cols-5 gap-4 mb-8" role="group" aria-label={t('admin.stats.groupLabel')}>
              <StatCard
                label={t('admin.stats.total')}
                value={stats.total}
                color="#1a1a2e"
                active={filterGrade === 'all' && filterStatus === 'all'}
                onClick={() => { setFilterGrade('all'); setFilterStatus('all'); setCurrentPage(1); }}
              />
              <StatCard
                label={t('admin.stats.critical')}
                value={stats.critical}
                color={SEVERITY_COLORS.critical}
                active={filterGrade === 'critique'}
                onClick={() => { setFilterGrade('critique'); setFilterStatus('all'); setCurrentPage(1); }}
              />
              <StatCard
                label={t('admin.stats.high')}
                value={stats.high}
                color={SEVERITY_COLORS.high}
                active={filterGrade === 'grave'}
                onClick={() => { setFilterGrade('grave'); setFilterStatus('all'); setCurrentPage(1); }}
              />
              <StatCard
                label={t('admin.stats.pending')}
                value={stats.pending}
                color="#eab308"
                active={filterStatus === 'pending'}
                onClick={() => { setFilterStatus('pending'); setFilterGrade('all'); setCurrentPage(1); }}
              />
              <StatCard
                label={t('admin.stats.escalated')}
                value={stats.escalated}
                color="#7c3aed"
                active={filterStatus === 'escalated'}
                onClick={() => { setFilterStatus('escalated'); setFilterGrade('all'); setCurrentPage(1); }}
              />
            </div>

            {/* Recherche */}
            <div className="mb-5">
              <input
                type="search"
                value={search}
                onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
                placeholder={t('admin.search.placeholder')}
                aria-label={t('admin.search.placeholder')}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none"
              />
            </div>

            {/* Filtres */}
            <div className="flex gap-2 mb-5 flex-wrap items-center" role="group" aria-label={t('admin.filters.groupLabel')}>
              <Select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }} aria-label={t('admin.filters.allStatuses')}>
                <option value="all">{t('admin.filters.allStatuses')}</option>
                <option value="pending">{t('admin.status.pending')}</option>
                <option value="in_progress">{t('admin.status.in_progress')}</option>
                <option value="escalated">{t('admin.status.escalated')}</option>
                <option value="closed">{t('admin.status.closed')}</option>
                <option value="rejected">{t('admin.status.rejected')}</option>
              </Select>

              <Select value={filterClass} onChange={e => { setFilterClass(e.target.value); setCurrentPage(1); }} aria-label={t('admin.filters.allClasses')}>
                <option value="all">{t('admin.filters.allClasses')}</option>
                {[...new Set(reports.map((r: any) => r.student?.studentProfile?.schoolClass).filter(Boolean))].map(cls => (
                  <option key={cls} value={cls}>{cls}</option>
                ))}
              </Select>

              <Select value={filterStudent} onChange={e => { setFilterStudent(e.target.value); setCurrentPage(1); }} aria-label={t('admin.filters.allReporters')}>
                <option value="all">{t('admin.filters.allReporters')}</option>
                {[...new Map(
                  reports
                    .filter((r: any) => r.student && !r.isAnonymous)
                    .map((r: any) => [r.student.id, r.student])
                ).values()].map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName} ({s.role})
                  </option>
                ))}
              </Select>

              <input
                type="search"
                value={filterSuspect}
                onChange={e => { setFilterSuspect(e.target.value); setCurrentPage(1); }}
                placeholder={t('admin.filters.suspectPlaceholder')}
                aria-label={t('admin.filters.suspectPlaceholder')}
                className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-700"
              />

              <div className="flex items-center gap-1" role="group" aria-label={t('admin.filters.dateRange')}>
                <input
                  key={`from-${resetKey}`}
                  type="date"
                  value={filterDateFrom}
                  onChange={e => { setFilterDateFrom(e.target.value); setCurrentPage(1); }}
                  aria-label={t('admin.filters.dateFrom')}
                  className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-700"
                />
                <span aria-hidden="true" className="text-gray-400">→</span>
                <input
                  key={`to-${resetKey}`}
                  type="date"
                  value={filterDateTo}
                  onChange={e => { setFilterDateTo(e.target.value); setCurrentPage(1); }}
                  aria-label={t('admin.filters.dateTo')}
                  className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-700"
                />
              </div>

              <Button variant="ghost" onClick={handleReset}>{t('admin.filters.reset')}</Button>
            </div>

            {/* Liste des signalements */}
            {loading ? (
              <p className="text-center py-16 text-gray-400" role="status">{t('admin.loading')}</p>
            ) : filtered.length === 0 ? (
              <p className="text-center py-16 text-gray-400">{t('admin.noReports')}</p>
            ) : (
              <ul className="flex flex-col gap-3" aria-label={t('admin.reportsList')}>
                {paginated.map(report => (
                  <li
                    key={report.id}
                    style={{ borderLeft: `5px solid ${SEVERITY_COLORS[severityFromApiGrade(report.grade)]}` }}
                    className="bg-surface px-6 py-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => {
                      setSelected(report);
                      setAdminNote(report.adminNote || '');
                      setView('detail');
                      loadNotes(report.id);
                    }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={e => e.key === 'Enter' && (setSelected(report), setView('detail'), loadNotes(report.id))}
                    aria-label={`${report.title} — ${report.caseNumber}`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-primary">{report.title}</span>
                          {report.gradeModified && (
                            <span className="bg-gray-100 text-gray-500 px-2 rounded-full text-xs">
                              ✏️ {t('admin.detail.gradeModified')}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-primary mb-2">
                          {report.description.length > 120
                            ? `${report.description.substring(0, 120)}...`
                            : report.description}
                        </p>
                        <div className="flex gap-4 text-xs text-primary">
                          <span>👤 {report.isAnonymous ? t('admin.detail.anonymousLabel') : `${report.student?.firstName} ${report.student?.lastName}`}</span>
                          <span>🏫 {report.student?.studentProfile?.schoolClass ?? '-'}</span>
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

            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filtered.length}
              onPageChange={setCurrentPage}
            />
          </>
        )}

        {/* ── Section utilisateurs ── */}
        {viewSection === 'users' && isAdmin && (
          <section aria-labelledby="users-title">
            <div className="flex justify-between items-center mb-5">
              <h2 id="users-title" className="text-xl font-bold text-gray-800">
                👥 {t('admin.users.title')}
              </h2>
              <Button onClick={() => {
                setShowUserForm(true);
                setEditingUser(null);
                setUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'student', schoolClass: '' });
              }}>
                {t('admin.users.add')}
              </Button>
            </div>

            {showUserForm && (
              <Card className="mb-5">
                <h3 className="text-gray-800 font-bold mb-4">
                  {editingUser ? t('admin.users.formEdit') : t('admin.users.formAdd')} {t('admin.users.formTitle')}
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <input
                    placeholder={t('admin.users.firstName')}
                    value={userForm.firstName}
                    onChange={e => setUserForm({ ...userForm, firstName: e.target.value })}
                    aria-label={t('admin.users.firstName')}
                    className="px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none"
                  />
                  <input
                    placeholder={t('admin.users.lastName')}
                    value={userForm.lastName}
                    onChange={e => setUserForm({ ...userForm, lastName: e.target.value })}
                    aria-label={t('admin.users.lastName')}
                    className="px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none"
                  />
                  <input
                    placeholder={t('admin.users.email')}
                    value={userForm.email}
                    onChange={e => setUserForm({ ...userForm, email: e.target.value })}
                    aria-label={t('admin.users.email')}
                    className="px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none"
                  />
                  <input
                    placeholder={t('admin.users.password')}
                    type="password"
                    value={userForm.password}
                    onChange={e => setUserForm({ ...userForm, password: e.target.value })}
                    aria-label={t('admin.users.password')}
                    className="px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none"
                  />
                  <Select value={userForm.role} onChange={e => setUserForm({ ...userForm, role: e.target.value })} aria-label={t('admin.users.roles.label')}>
                    <option value="student">{t('admin.users.roles.student')}</option>
                    <option value="teacher">{t('admin.users.roles.teacher')}</option>
                    <option value="staff">{t('admin.users.roles.staff')}</option>
                    <option value="admin">{t('admin.users.roles.admin')}</option>
                    <option value="director">{t('admin.users.roles.director')}</option>
                  </Select>
                  {userForm.role === 'student' && (
                    <Select value={userForm.schoolClass} onChange={e => setUserForm({ ...userForm, schoolClass: e.target.value })} aria-label={t('admin.users.selectClass')}>
                      <option value="">{t('admin.users.selectClass')}</option>
                      <option value="6eme">6ème</option>
                      <option value="5eme">5ème</option>
                      <option value="4eme">4ème</option>
                      <option value="3eme">3ème</option>
                    </Select>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button variant="success" onClick={handleSaveUser}>💾 {t('admin.users.save')}</Button>
                  <Button variant="ghost" onClick={() => { setShowUserForm(false); setEditingUser(null); }}>
                    {t('common.cancel')}
                  </Button>
                </div>
              </Card>
            )}

            {loadingUsers ? (
              <p className="text-center py-10 text-gray-400" role="status">{t('admin.loading')}</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {users.map((u: any) => (
                  <li key={u.id}>
                    <Card className="flex justify-between items-center">
                      <div>
                        <span className="font-bold text-gray-800">{u.firstName} {u.lastName}</span>
                        <span className="ml-2 text-xs text-gray-400">{u.email}</span>
                        <span className="ml-2 bg-gray-100 px-2 py-0.5 rounded-lg text-xs text-gray-500">{u.role}</span>
                        {u.studentProfile?.schoolClass && (
                          <span className="ml-1 bg-surface px-2 py-0.5 rounded-lg text-xs text-primary">
                            {u.studentProfile.schoolClass}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            setEditingUser(u);
                            setUserForm({
                              firstName: u.firstName, lastName: u.lastName,
                              email: u.email, password: '',
                              role: u.role, schoolClass: u.studentProfile?.schoolClass || '',
                            });
                            setShowUserForm(true);
                          }}
                          aria-label={`${t('admin.users.edit')} ${u.firstName} ${u.lastName}`}
                        >
                          ✏️ {t('admin.users.edit')}
                        </Button>
                        <Button
                          variant="danger"
                          onClick={() => handleDeleteUser(u.id)}
                          aria-label={`${t('admin.users.delete')} ${u.firstName} ${u.lastName}`}
                        >
                          🗑️ {t('admin.users.delete')}
                        </Button>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* ── Section statistiques ── */}
        {viewSection === 'stats' && (
          <StatsDashboard reports={reports} />
        )}

      </div>
    </div>
  );
}

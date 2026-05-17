import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import {
  getAllReports, updateReport, getNotes, addNote,
  getAllUsers, createUser, updateUser, deleteUser,checkCanDeleteUser
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
import { useMemo } from 'react';

// ─── AdminDashboard ───────────────────────────────────────────────────────────

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
    password: '', role: 'student', schoolClass: '',
  });

	const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
	const [isDeleting, setIsDeleting] = useState(false);



	const [deleteError, setDeleteError] = useState('');
	const [globalDeleteError, setGlobalDeleteError] = useState('');

	const [isBlocked, setIsBlocked] = useState(false);


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
const filtered = useMemo(() => {
  return reports
    .slice() // évite de modifier l’array original
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .filter((r: Report) => {
    if (filterGrade !== 'all' && r.grade !== filterGrade) return false;
    if (filterStatus !== 'all' && r.status !== filterStatus) return false;
	if (filterClass !== 'all') {
		const cls = r.student?.studentProfile?.class;
			if (!cls) return false;

		const fullClass = `${cls.level}${cls.section}`;
			if (fullClass !== filterClass) return false;
    }

    if (filterStudent !== 'all' && r.student?.id !== filterStudent) return false;

    if (filterSuspect) {
      const q = filterSuspect.toLowerCase();
      const match = r.suspects?.some(s => {
        const name = `${s.user?.firstName ?? ''} ${s.user?.lastName ?? ''}`.toLowerCase();
        return name.includes(q) || (s.freeText?.toLowerCase() ?? '').includes(q);
      });
      if (!match) return false;
    }


	if (filterVictim && filterVictim !== "all") {
		const title = r.title?.toLowerCase() ?? "";
		const q = filterVictim.toLowerCase();

		let victim: string | null = null;

		// Cas 1 : le signaleur est la victime
		if (title.includes("victime") && r.student) {
			victim = `${r.student.firstName} ${r.student.lastName}`.toLowerCase();
		}

		// Cas 2 : la victime est dans la description
		else if ((title.includes("témoin") || title.includes("temoin")) && r.description) {
			const match = r.description.match(/[Vv]ictime\s*:\s*([^|(\n]+)/);
			victim = match ? match[1].trim().toLowerCase() : null;
		}

		if (!victim || !victim.includes(q)) return false;
		}





    if (filterDateFrom && new Date(r.createdAt) < new Date(filterDateFrom)) return false;

    if (filterDateTo) {
      const to = new Date(filterDateTo);
      to.setHours(23, 59, 59, 999);
      if (new Date(r.createdAt) > to) return false;
    }

    return true;
  });
}, [
  reports,
  filterGrade,
  filterStatus,
  filterClass,
  filterStudent,
  filterSuspect,
  filterVictim, 
  filterDateFrom,
  filterDateTo,
  search
]);




const totalPages = useMemo(() => {
  return Math.ceil(filtered.length / itemsPerPage);
}, [filtered, itemsPerPage]);
const paginated = useMemo(() => {
  const start = (currentPage - 1) * itemsPerPage;
  return filtered.slice(start, start + itemsPerPage);
}, [filtered, currentPage, itemsPerPage]);

  // ── Compteurs pour les StatCards
const stats = useMemo(() => {
  return {
    total: reports.length,
    critical:  reports.filter(r => severityFromApiGrade(r.grade) === 'critical').length,
    high:      reports.filter(r => severityFromApiGrade(r.grade) === 'high').length,
    medium:   reports.filter(r => severityFromApiGrade(r.grade) === 'medium').length,
    low: 	  reports.filter(r => severityFromApiGrade(r.grade) === 'low').length,
  };
}, [reports]);

  const handleReset = () => {
    setFilterGrade('all');
    setFilterStatus('all');
    setFilterClass('all');
    setFilterStudent('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setFilterSuspect('');
    setFilterVictim('');
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

  const goTo = (report: typeof selected) => {
    setSelected(report);
    if (report) loadNotes(report.id);
  };

  const handleAddNote = async (type: string = 'note') => {
    if (!selected) return;
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
	console.log("Users after deletion:", users);
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
  // Vérifier si c'est son propre compte
  if (id === user?.id) {
    setDeleteTarget(id);
    setIsBlocked(true);
    setDeleteError(t('admin.users.deleteSelf'));
    return;
  }

  const { deletable } = await checkCanDeleteUser(id);
  setDeleteTarget(id);
  setIsBlocked(!deletable);
  setDeleteError('');
};



const confirmDelete = async () => {
  if (!deleteTarget) return;

  setIsDeleting(true);
  setDeleteError('');
  setIsBlocked(false);

  try {
    await deleteUser(deleteTarget);
    await fetchUsers();
    setDeleteTarget(null); // suppression OK → fermer la popup
  } catch (err: any) {
    console.error("Erreur suppression utilisateur:", err);

   const msg = err?.response?.data?.message ?? err?.message ?? "";
  
    // 🔥 Cas : utilisateur lié à un signalement
    if (msg === "USER_HAS_REPORTS") {
      setIsBlocked(true); // active le mode "bloqué"
      // setDeleteError(t('admin.users.deleteBlocked')); 
    } else {
      // 🔥 Autre erreur
      setDeleteError(t('admin.users.deleteError'));
    }
  } finally {
    setIsDeleting(false);
  }
};




  const headerProps = { user, logoutUser, viewSection, setViewSection, setSelected, fetchUsers };


const [errors, setErrors] = useState({
  firstName: '',
  lastName: '',
  email: '',
  password: '',
});

const validateField = (field: string, value: string) => {
  let message = '';

  if (!value.trim() && field !== 'password') {
    message = t('admin.users.errorRequired');
  } else if (field === 'email') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      message = t('admin.users.errorEmailFormat');
    }
  } else if (field === 'password')
	{
		if (value.length > 0 && value.length < 6) {
    message = t('admin.users.errorPasswordLength');
  }
}

  setErrors(prev => ({ ...prev, [field]: message }));
};


const updateField = (field: string, value: string) => {
  setUserForm(prev => ({ ...prev, [field]: value }));
  validateField(field, value);
};

const isFormValid =
  userForm.firstName.trim() &&
  userForm.lastName.trim() &&
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userForm.email) &&
  !errors.firstName &&
  !errors.lastName &&
  !errors.email &&
  !errors.password;

const classOptions = Array.from(
  new Set(
    reports
      .map(r => {
        const cls = r.student?.studentProfile?.class;
        return cls ? `${cls.level}${cls.section}` : null;
      })
      .filter(Boolean)
  )
).sort((a, b) => {
  const order = ['6eme', '5eme', '4eme', '3eme'];

  const levelA = a.slice(0, -1);
  const levelB = b.slice(0, -1);
  const sectionA = a.slice(-1);
  const sectionB = b.slice(-1);

  const diff = order.indexOf(levelA) - order.indexOf(levelB);
  if (diff !== 0) return diff;

  return sectionA.localeCompare(sectionB);
});



const handleVictimSearch = async (name: string) => {
    setFilterVictim(name);
    setCurrentPage(1);
    if (!name || name.trim().length < 2) { setVictimReports(null); return; }
    setLoadingVictim(true);
    try {
      const results = await searchReportsByVictim(name.trim());
      setVictimReports(results);
    } catch { console.error('Erreur recherche victime'); setVictimReports([]); }
    finally { setLoadingVictim(false); }
  };





  // ── Vue détail ──────────────────────────────────────────────────────────────────
  if (view === 'detail' && selected) {
    const idx = filtered.findIndex(r => r.id === selected.id);
    const severityColor = SEVERITY_COLORS[severityFromApiGrade(selected.grade)];

    return (

  <main className="min-h-screen bg-gray-50 font-sans">
    <h1 className="sr-only">{t('admin.title.oneReport')}</h1>

      <div className="flex-1 bg-gray-50 font-sans">
        <AdminHeader {...headerProps} />
        <div className="max-w-5xl mx-auto mt-8 px-5 pb-10">

          {/* Navigation précédent / suivant */}
          <div className="flex justify-between items-center mb-6">
            <Button
              variant="ghost"
              onClick={() => goTo(filtered[idx - 1])}
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
              onClick={() => goTo(filtered[idx + 1])}
              disabled={idx === filtered.length - 1}
              aria-label={t('admin.next')}
            >
              {t('admin.next')} →
            </Button>
          </div>
          <div className="text-center">




          {/* Victimes */}
            <Card borderColor={severityColor} title={t('admin.detail.victim')}>
              {selected.description?.includes('') && (
				<>
                  <p className="text-sm text-gray-700 mb-4">
                    {selected.description.split('| Victime :')[1]?.split('|')[0]?.trim()}
					
				</p>
				<p className="text-sm text-gray-700 mb-4">
								{selected.student?.studentProfile?.class.level}

							{selected.student?.studentProfile?.class.section}
                  </p>
				  </>
              )}
            </Card>






			<Card borderColor={severityColor} title={t('admin.detail.reportDetails')}>
             
            
                  {([
                    { label: t('admin.detail.reported'), value: new Date(selected.createdAt).toLocaleDateString('fr-FR',
						{
							hour:'2-digit',
							minute:'2-digit'
						})
					},
                  ] as const).map(row => (
					<p className="text-sm text-gray-700 mb-4">
                      {row.value}
					</p>
                  ))}

				  <p className="text-sm text-gray-700 leading-7">
              {/* {selected.description?.split('|')[0]?.trim()} */}
              {selected.description}
            	</p>


       
			   <table className="w-full text-sm border-collapse">




			<tr className="border-b border-gray-100">
					<td className="py-2 text-gray-400 font-semibold w-2/5">{t('admin.detail.titleField')}</td>
				<td className="py-2 text-gray-700">
			{selected.title.split(" - ")[0]}</td>

			</tr>
<tr className="border-b border-gray-100">
					<td className="py-2 text-gray-400 font-semibold w-2/5">{t('admin.detail.titleField')}</td>
				<td className="py-2 text-gray-700">
			{selected.title.split(" - ")[1]}</td>

			</tr>


			<tr className="border-b border-gray-100">
					<td className="py-2 text-gray-400 font-semibold w-2/5">{t('admin.detail.reportedBy')}</td>
				<td className="py-2 text-gray-700">
			{selected.student?.firstName} {selected.student?.lastName}</td>

			</tr>

			<tr className="border-b border-gray-100">
					<td className="py-2 text-gray-400 font-semibold w-2/5">{t('admin.detail.anonymousLabel')}</td>
				<td className="py-2 text-gray-700">
			{selected.isAnonymous ? t('admin.detail.yes') : t('admin.detail.no') }</td>

			</tr>

			

              </table>

            </Card>
       



          {/* Analyse IA */}
			<Card borderColor={severityColor} title={t('admin.detail.iaAnalysis')}>
              <table className="w-full text-sm border-collapse">
                <tbody>
                  {([
                    { label: t('admin.detail.titleField'), value: selected.title },
                    // { label: t('admin.detail.class'),      value: selected.student?.studentProfile?.schoolClass ?? '-' },
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


          {/* Signale par */}
            <Card borderColor={severityColor} title={t('admin.detail.people')}>
              <p className="text-xs text-gray-400 font-semibold mb-1">{t('admin.detail.reportedBy')}</p>
              <p className="text-sm text-gray-700 mb-4">
                {selected.isAnonymous
                  ? t('admin.detail.anonymousLabel')
                  : `${selected.student?.firstName} ${selected.student?.lastName}`}
                {selected.student?.role && (
                  <span className="text-gray-400 text-xs ml-1">({selected.student.role})</span>
                )}
              </p>

            </Card>







          {/* Suspects */}
            <Card borderColor={severityColor} title={t('admin.detail.people')}>
              <p className="text-xs text-gray-400 font-semibold mb-2">{t('admin.detail.suspects')}</p>
              {selected.suspects?.length > 0 ? (
                <ul aria-label={t('admin.detail.suspects')} className="flex flex-col gap-1">
                  {selected.suspects.map((s, i) => (
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


          {/* Notes administratives */}
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
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  rows={3}
                  placeholder={t('admin.notes.placeholder')}
                  aria-label={t('admin.notes.placeholder')}
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
                <input
                  id="convocation-date"
                  type="datetime-local"
                  value={convocationDate}
                  onChange={e => setConvocationDate(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary text-gray-700"
                />
              </div>
              <textarea
                value={convocationMessage}
                onChange={e => setConvocationMessage(e.target.value)}
                rows={3}
                placeholder={t('admin.convocation.placeholder')}
                aria-label={t('admin.convocation.placeholder')}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-y mb-3 font-[inherit] box-border"
              />
              <Button onClick={() => handleAddNote('convocation')}>
                {t('admin.convocation.send')}
              </Button>
            </Card>
          )}

        </div>
      </div>
	  </main>
    );
  }

  // ── Vue liste ───────────────────────────────────────────────────────────────
  return (
	<>
  <main className="min-h-screen bg-gray-50 font-sans">
    <h1 className="sr-only">{t('admin.title.allReports')}</h1>

    <div className="flex-1 bg-white font-sans">
      <AdminHeader {...headerProps} />

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
                active={filterGrade === 'all'}
                onClick={() => { setFilterGrade('all');  setCurrentPage(1); }}
              />
              <StatCard
                label={t('admin.stats.critical')}
                value={stats.critical}
                color={SEVERITY_COLORS.critical}
                active={filterGrade === 'critical'}
                onClick={() => { setFilterGrade('critical');  setCurrentPage(1); }}
              />
              <StatCard
                label={t('admin.stats.high')}
                value={stats.high}
                color={SEVERITY_COLORS.high}
                active={filterGrade === 'high'}
                onClick={() => { setFilterGrade('high'); setCurrentPage(1); }}
              />
              <StatCard
                label={t('admin.stats.medium')}
                value={stats.medium}
                color={SEVERITY_COLORS.medium}
                active={filterGrade === 'medium'}
                onClick={() => { setFilterGrade('medium'); setCurrentPage(1); }}
              />
              <StatCard
                label={t('admin.stats.low')}
                value={stats.low}
                color={SEVERITY_COLORS.low}
                active={filterGrade === 'low'}
                onClick={() => { setFilterGrade('low');  setCurrentPage(1); }}
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            {/* Filtres */}
            {/* <div className="flex mb-5 flex-wrap items-center gap-0" role="group" aria-label={t('admin.filters.groupLabel')}> */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-4">


		<Select

			value={filterClass}
			onChange={e => { setFilterClass(e.target.value); setCurrentPage(1); }}
			aria-label={t('admin.filters.allClasses')}
			>
			<option value="all">{t('admin.filters.allClasses')}</option>

			{classOptions.map(cls => (
				<option key={cls} value={cls}>
				{cls}
				</option>
			))}
		</Select>






		<Select

			value={filterStudent}
			onChange={e => { setFilterStudent(e.target.value); setCurrentPage(1); }}
			aria-label={t('admin.filters.allReporters')}
			>
			<option value="all">{t('admin.filters.allReporters')}</option>

			{[...new Map(
				reports
				.filter(r => r.student && !r.isAnonymous)
				.map(r => [r.student!.id, r.student!])
			).values()].map(s => {

				// 👉 C’est ICI qu’on log l’utilisateur
				console.log("USER OPTION:", s);

				return (
				<option key={s.id} value={s.id}>
					{s.firstName} {s.lastName} (
					{s.role === 'student' && s.studentProfile?.class
						? `${s.studentProfile.class.level}${s.studentProfile.class.section}`
						: s.role === 'teacher' && s.staffProfile?.subject
						? s.staffProfile.subject
						: s.role}
					)
				</option>
				);
			})}
			</Select>






              <input
                type="search"
                value={filterSuspect}
                onChange={e => { setFilterSuspect(e.target.value); setCurrentPage(1); }}
                placeholder={t('admin.filters.suspectPlaceholder')}
                aria-label={t('admin.filters.suspectPlaceholder')}
                className="px-1 py-2 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-white text-gray-700"
              />







              <input
                type="search"
                value={filterVictim}
                onChange={e => { setFilterVictim(e.target.value); setCurrentPage(1); }}
                placeholder={t('admin.filters.victimPlaceholder')}
                aria-label={t('admin.filters.victimPlaceholder')}
                className="px-1 py-2 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-white text-gray-700"
              />





			<div className="w-full text-sm flex items-center justify-center gap-2 mt-2 font-sans">
            

			<span aria-hidden="true" className="text-gray-600">Dates : </span>
                <input
                  key={`from-${resetKey}`}
                  type="date"
                  value={filterDateFrom}
                  onChange={e => { setFilterDateFrom(e.target.value); setCurrentPage(1); }}
                  aria-label={t('admin.filters.dateFrom')}
                  className="px-1 py-2 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-white text-gray-700"
                />
                <span aria-hidden="true" className="text-gray-400">→</span>
                <input
                  key={`to-${resetKey}`}
                  type="date"
                  value={filterDateTo}
                  onChange={e => { setFilterDateTo(e.target.value); setCurrentPage(1); }}
                  aria-label={t('admin.filters.dateTo')}
                  className="px-1 py-2 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-white text-gray-700"
                />
			</div>

		</div>   



		    <div className="flex justify-center space-x-8 gap-1 mb-4" role="group" aria-label={t('admin.stats.groupLabel')}>
                <Badge 
					variant={'new' as BadgeVariant}
					onClick={() => {
						setFilterStatus('new');
						setCurrentPage(1);
					}}
				/>
              <Badge
				variant='in_progress' 
                onClick={() => { 
					setFilterStatus('in_progress'); 
					setCurrentPage(1); }}
              />
              <Badge
				variant='pending' 
                onClick={() => { 
					setFilterStatus('pending'); 
					setCurrentPage(1); }}
              />
              <Badge
				variant='resolved' 
                onClick={() => { 
					setFilterStatus('resolved'); 
					setCurrentPage(1); }}
              />
              <Badge
				variant='false_report' 
                onClick={() => { 
					setFilterStatus('false_report'); 
					setCurrentPage(1); }}
              />


            </div>
		    <div className="flex justify-center mb-4" aria-label={t('admin.stats.groupLabel')}>


		<Button variant="primary" onClick={handleReset}>{t('admin.filters.reset')}</Button>
			  
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
              <div className="rounded-lg bg-primary p-4 mb-5">
    


                  <Input
                    label={t('admin.users.firstName')}
                    value={userForm.firstName}
                    onChange={e => updateField('firstName', e.target.value)}
                    theme="light"
                  />
				  <div className="min-h-5 w-full">
					{errors.firstName && (
						<p className="text-red-300 text-xs">{errors.firstName}</p>
					)}
					</div>


                  <Input
                    label={t('admin.users.lastName')}
                    value={userForm.lastName}
                    onChange={e => updateField('lastName', e.target.value)}
                    theme="light"
                  />
				  <div className="min-h-5 w-full">
				{errors.lastName && (
					<p className="text-red-300 text-xs">{errors.lastName}</p>
				)}
				</div>


                  <Input
                    label={t('admin.users.email')}
                    value={userForm.email}
                    onChange={e => updateField('email', e.target.value)}
                    theme="light"
                  />
				  <div className="min-h-5 w-full">
					{errors.email && (
						<p className="text-red-300 text-xs">{t('admin.users.errorEmailFormat')}</p>
					)}
					</div>

                  <Input
                    label={t('admin.users.password')}
                    type="password"
                    value={userForm.password}
                    onChange={e => updateField('password', e.target.value)}
                    theme="light"
                  />
					<div className="min-h-5 w-full">
					{errors.password && (
						<p className="text-red-300 text-xs">{t('admin.users.errorPasswordLength')}</p>
					)}
					</div>

				<div className="text-center">
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
                </div>
                <div className="flex gap-3 place-content-end">
				  <Button disabled={!isFormValid} onClick={handleSaveUser}>{t('admin.users.save')}</Button>

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
			{users.map(u => (
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
						firstName: u.firstName,
						lastName: u.lastName,
						email: u.email,
						password: '',
						role: u.role,
						schoolClass: u.studentProfile?.schoolClass || '',
						});
						setShowUserForm(true);
					}}
					>
					✏️ {t('admin.users.edit')}
					</Button>

					<Button
					variant="danger"
					onClick={() => handleDeleteUser(u.id)}
					>
					🗑️ {t('admin.users.delete')}
					</Button>
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
        {deleteError
          ? deleteError
          : isBlocked
            ? t('admin.users.deleteBlocked')
            : t('admin.users.deleteConfirm')}
      </p>

      <div className="flex justify-end gap-3">

        {/* Bouton Annuler / Fermer */}
        <button
          onClick={() => {
            setDeleteTarget(null);
            setIsBlocked(false);
          }}
          className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300"
        >
          {isBlocked ? t('common.close') : t('common.cancel')}
        </button>

        {/* Bouton Supprimer → seulement si NON bloqué */}
        {!isBlocked && (
          <button
            onClick={confirmDelete}
            disabled={isDeleting}
            className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
          >
            {isDeleting ? t('common.loading') : t('common.delete')}
          </button>
        )}

      </div>

    </div>
  </div>
)}





          </section>
        )}

        {/* ── Section statistiques ── */}
        {viewSection === 'stats' && (
          <StatsDashboard reports={reports} />
        )}

      </div>
    </div>
	</main>
  </>

  );
}

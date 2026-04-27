import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllReports, updateReport, getNotes, addNote, getAllUsers, createUser, updateUser, deleteUser } from '../services/api';
import StatsDashboard from './StatsDashboard';
import Button from '../components/Button';
import Badge from '../components/Badge';
import Card from '../components/Card';
import StatCard from '../components/StatCard';
import Input from '../components/Input';
import Select from '../components/Select';
import Pagination from '../components/Pagination';
import NoteBlock from '../components/NoteBlock';

const GRADE_COLORS: Record<string, string> = {
  critique: '#dc2626',
  grave:    '#f97316',
  moyen:    '#eab308',
  faible:   '#22c55e',
};

export default function AdminDashboard() {
  const { user, logoutUser } = useAuth();
  const isDirector = user?.role === 'director';
  const isAdmin = user?.role === 'admin';

  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [filterGrade, setFilterGrade] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterClass, setFilterClass] = useState('all');
  const [filterStudent, setFilterStudent] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [resetKey, setResetKey] = useState(0);
  const [filterSuspect, setFilterSuspect] = useState('');
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState('');
  const [convocationDate, setConvocationDate] = useState('');
  const [convocationMessage, setConvocationMessage] = useState('');
  const [viewSection, setViewSection] = useState<'reports' | 'users' | 'stats'>('reports');
  const [users, setUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [userForm, setUserForm] = useState({
    firstName: '', lastName: '', email: '',
    password: '', role: 'student', schoolClass: '',
  });
  const itemsPerPage = 5;

  useEffect(() => { fetchReports(); }, []);

  const fetchReports = async () => {
    try {
      const data = await getAllReports();
      setReports(data);
    } catch (err) {
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
    } catch (err) {
      console.error('Erreur mise à jour');
    } finally {
      setSaving(false);
    }
  };

	const filtered = reports.filter((r: any) => {
		if (filterGrade !== 'all' && r.grade !== filterGrade) return false;
		if (filterStatus !== 'all' && r.status !== filterStatus) return false;
		if (
			filterClass !== 'all' &&
			r.student?.studentProfile?.schoolClass !== filterClass
		)
			return false;
		if (filterStudent !== 'all' && r.student?.id !== filterStudent) return false;
		if (filterSuspect) {
			const suspectText = filterSuspect.toLowerCase();
			const hasMatch = r.suspects?.some((s: any) => {
				const userName =
					`${s.user?.firstName} ${s.user?.lastName}`.toLowerCase();
				const freeText = s.freeText?.toLowerCase() || '';
				return (
					userName.includes(suspectText) ||
					freeText.includes(suspectText)
				);
				});
			if (!hasMatch) return false;
		}
		if (filterDateFrom) {
			if (new Date(r.createdAt) < new Date(filterDateFrom)) return false;
		}
		if (filterDateTo) {
			const to = new Date(filterDateTo);
			to.setHours(23, 59, 59, 999);
			if (new Date(r.createdAt) > to) return false;
		}
		if (search) {
			const q = search.toLowerCase();
			const fullName =
			`${r.student?.firstName} ${r.student?.lastName}`.toLowerCase();
			const title = r.title?.toLowerCase() || '';
			const description = r.description?.toLowerCase() || '';
			if (
				!fullName.includes(q) &&
				!title.includes(q) &&
				!description.includes(q)
			) {
				return false;
			}
		}
		return true;
	});

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const stats = {
    total:     reports.length,
    critique:  reports.filter((r: any) => r.grade === 'critique').length,
    grave:     reports.filter((r: any) => r.grade === 'grave').length,
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

  const loadNotes = async (reportId: string) => {
    try {
      const data = await getNotes(reportId);
      setNotes(data);
    } catch (err) {
      console.error('Erreur chargement notes');
    }
  };

  const handleAddNote = async (type: string = 'note') => {
    const content = type === 'convocation' ? convocationMessage : newNote;
    if (!content.trim()) return;
    try {
      await addNote(selected.id, content, type);
      await loadNotes(selected.id);
      if (type === 'convocation') setConvocationMessage('');
      else setNewNote('');
    } catch (err) {
      console.error('Erreur ajout note');
    }
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (err) {
      console.error('Erreur chargement utilisateurs');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleSaveUser = async () => {
    try {
      if (editingUser) {
        await updateUser(editingUser.id, userForm);
      } else {
        await createUser(userForm);
      }
      await fetchUsers();
      setShowUserForm(false);
      setEditingUser(null);
      setUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'student', schoolClass: '' });
    } catch (err) {
      console.error('Erreur sauvegarde utilisateur');
    }
  };

  const handleDeleteUser = async (id: string) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    try {
      await deleteUser(id);
      await fetchUsers();
    } catch (err) {
      console.error('Erreur suppression');
    }
  };

	const Header = () => (
	<div>
		<div className="px-8 py-2 bg-[#ebfcff] flex items-center relative">
		<span className="mx-auto text-black font-bold text-sm">
			Espace {user?.role?.charAt(0).toUpperCase() + user?.role?.slice(1)} - {user?.firstName} {user?.lastName?.toUpperCase()}
		</span>
		<Button
			variant="outline"
			onClick={logoutUser}
			className="absolute right-8">
			Déconnexion
		</Button>
		</div>
		<div className="bg-[#0097b2] px-8 py-2 flex justify-between items-center">
		<div className="flex items-center gap-8">
			<span className="text-3xl">🏡</span>
			<span onClick={() => { setSelected(null); setViewSection('reports'); }}
			className="cursor-pointer text-white font-bold text-sm hover:opacity-75 transition-opacity">
			Signalements
			</span>
			<span onClick={() => { setSelected(null); setViewSection('users'); fetchUsers(); }}
			className="cursor-pointer text-white font-bold text-sm hover:opacity-75 transition-opacity">
			Utilisateurs
			</span>
			<span onClick={() => { setSelected(null); setViewSection('stats'); }}
			className="cursor-pointer text-white font-bold text-sm hover:opacity-75 transition-opacity">
			Statistiques
			</span>
			<span className="cursor-pointer text-white font-bold text-sm hover:opacity-75 transition-opacity">
			Ateliers
			</span>
			<span className="cursor-pointer text-white font-bold text-sm hover:opacity-75 transition-opacity">
			Jeux
			</span>
		</div>
		</div>
	</div>
	);	


	if (view === 'detail' && selected) return (
	<div className="min-h-screen bg-gray-50 font-[Segoe UI,sans-serif]">
		<Header />
		<div className="max-w-5xl mx-auto mt-8 px-5">

		{/* Navigation précédent/suivant */}
		<div className="flex justify-between items-center mb-6">
			<Button variant="ghost"
			onClick={() => {
				const i = filtered.findIndex((r: any) => r.id === selected.id);
				if (i > 0) setSelected(filtered[i - 1]);
			}}
			disabled={filtered.findIndex((r: any) => r.id === selected.id) === 0}>
			🠔 Précédent
			</Button>
			<span className="font-bold text-[#0097b2]">Signalement {selected.caseNumber}</span>
			<Button variant="ghost"
			onClick={() => {
				const i = filtered.findIndex((r: any) => r.id === selected.id);
				if (i < filtered.length - 1) setSelected(filtered[i + 1]);
			}}
			disabled={filtered.findIndex((r: any) => r.id === selected.id) === filtered.length - 1}>
			Suivant 🠖
			</Button>
		</div>

		{/* Statut + actions */}
		<div className="flex justify-between items-center mb-6 flex-wrap gap-3">
			<Badge variant={selected.status as any} />
			{isAdmin && (
			<div className="flex gap-2 flex-wrap">
				{[
				{ status: 'in_progress', label: '🔄 En cours',  variant: 'primary' },
				{ status: 'escalated',   label: '🚨 Escalader', variant: 'warning' },
				{ status: 'closed',      label: '✅ Clôturer',  variant: 'success' },
				{ status: 'rejected',    label: '❌ Rejeter',   variant: 'danger'  },
				].map(btn => (
				<Button key={btn.status} variant={btn.variant as any} disabled={saving}
					onClick={() => handleUpdateStatus(selected.id, btn.status)}>
					{btn.label}
				</Button>
				))}
			</div>
			)}
		</div>

		{/* Infos + personnes impliquées */}
		<div className="grid grid-cols-2 gap-6 mb-6">
			<Card borderColor={GRADE_COLORS[selected.grade]}>
			<h3 className="text-[#0097b2] text-sm font-bold mb-4">Informations du signalement</h3>
			<table className="w-full text-sm border-collapse">
				<tbody>
				{[
					{ label: 'Titre',      value: selected.title },
					{ label: 'Date',       value: new Date(selected.createdAt).toLocaleDateString('fr-FR') },
					{ label: 'Classe',     value: selected.student?.studentProfile?.schoolClass ?? '-' },
					{ label: 'Score IA',   value: selected.aiScore ? `${selected.aiScore}/100` : '-' },
					{ label: 'Analyse IA', value: selected.aiReason ?? '-' },
					{ label: 'Anonyme',    value: selected.isAnonymous ? 'Oui' : 'Non' },
				].map(row => (
					<tr key={row.label} className="border-b border-gray-100">
					<td className="py-2 text-gray-400 font-semibold w-2/5">{row.label}</td>
					<td className="py-2 text-gray-700">{row.value}</td>
					</tr>
				))}
				</tbody>
			</table>
			</Card>

			<Card>
			<h3 className="text-[#0097b2] text-sm font-bold mb-4">Personnes impliquées</h3>
			<p className="text-xs text-gray-400 font-semibold mb-1">Signalé par</p>
			<p className="text-sm text-gray-700 mb-4">
				{selected.isAnonymous ? 'Anonyme' : `${selected.student?.firstName} ${selected.student?.lastName}`}
				{selected.student?.role && <span className="text-gray-400 text-xs ml-1">({selected.student.role})</span>}
			</p>
			{selected.description?.includes('| Victime :') && (
				<>
				<p className="text-xs text-gray-400 font-semibold mb-1">Victime</p>
				<p className="text-sm text-gray-700 mb-4">
					{selected.description.split('| Victime :')[1]?.split('|')[0]?.trim()}
				</p>
				</>
			)}
			<p className="text-xs text-gray-400 font-semibold mb-2">Soupçonné(s)</p>
			{selected.suspects?.length > 0 ? (
				<div className="flex flex-col gap-1">
				{selected.suspects.map((s: any, i: number) => (
					<div key={i} className="bg-[#ebfcff] px-3 py-1 text-sm text-red-500">
					{s.user ? `${s.user.firstName} ${s.user.lastName}` : s.freeText}
					</div>
				))}
				</div>
			) : (
				<p className="text-sm text-gray-300">Aucun soupçonné indiqué</p>
			)}
			</Card>
		</div>

		{/* Description */}
		<Card borderColor={GRADE_COLORS[selected.grade]} className="mb-6">
			<h3 className="text-[#0097b2] text-sm font-bold mb-3">{selected.aiReason}</h3>
			<p className="text-sm text-gray-700 leading-7">
			{selected.description?.split('|')[0]?.trim()}
			</p>
		</Card>

		{/* Notes */}
		<Card borderColor={GRADE_COLORS[selected.grade]} className="mb-6">
			<h3 className="text-[#0097b2] text-sm font-bold mb-4">📝 Notes administratives</h3>
			{notes.length > 0 ? (
			<div className="flex flex-col gap-3 mb-5">
				{notes.map((note: any) => <NoteBlock key={note.id} note={note} />)}
			</div>
			) : (
			<p className="text-sm text-gray-300 mb-5">Aucune note pour ce dossier</p>
			)}
			{isAdmin && (
			<>
				<textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={3}
				placeholder="Ajouter une note..."
				className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none resize-y mb-3 font-[inherit] box-border" />
				<Button onClick={() => handleAddNote('note')}>Enregistrer la note</Button>
			</>
			)}
		</Card>

		{/* Convocation */}
		{isAdmin && (
			<Card borderColor={GRADE_COLORS[selected.grade]}>
			<h3 className="text-gray-800 text-sm font-bold mb-4">📅 Convoquer les personnes impliquées</h3>
			<div className="mb-4">
				<label className="block mb-1 text-xs font-semibold text-gray-500">Date et heure</label>
				<input type="datetime-local" value={convocationDate} onChange={e => setConvocationDate(e.target.value)}
				className="px-4 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none text-gray-700" />
			</div>
			<textarea value={convocationMessage} onChange={e => setConvocationMessage(e.target.value)} rows={3}
				placeholder="Message de convocation..."
				className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none resize-y mb-3 font-[inherit] box-border" />
			<Button onClick={() => handleAddNote('convocation')}>Envoyer la convocation</Button>
			</Card>
		)}

		</div>
	</div>
	);

return (
  <div className="min-h-screen bg-white font-[Segoe UI,sans-serif]">
    <Header />

    <div className="max-w-5xl mx-auto mt-8 px-5">

      {viewSection === 'reports' && (
        <>
          {/* Stats */}
          <div className="grid grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Total',      value: stats.total,     color: '#1a1a2e', filter: 'all' },
              { label: 'Critique',   value: stats.critique,  color: '#ff3131', filter: 'critique' },
              { label: 'Grave',      value: stats.grave,     color: '#ff914d', filter: 'grave' },
              { label: 'En attente', value: stats.pending,   color: '#ffde59', filter: 'pending' },
              { label: 'Escaladés',  value: stats.escalated, color: '#7c3aed', filter: 'escalated' },
            ].map(stat => (
              <StatCard
                key={stat.label}
                label={stat.label}
                value={stat.value}
                color={stat.color}
                active={filterGrade === stat.filter}
                onClick={() => { setFilterGrade(stat.filter); setCurrentPage(1); }}
              />
            ))}
          </div>

          {/* Recherche */}
          <div className="mb-5">
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher par nom, titre, description"
            />
          </div>

          {/* Filtres */}
          <div className="flex gap-2 mb-5 flex-wrap items-center">
            <Select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="in_progress">En cours</option>
              <option value="escalated">Escaladé</option>
              <option value="closed">Clôturé</option>
              <option value="rejected">Rejeté</option>
            </Select>

            <Select value={filterClass} onChange={e => { setFilterClass(e.target.value); setCurrentPage(1); }}>
              <option value="all">Toutes les classes</option>
              {[...new Set(reports.map((r: any) => r.student?.studentProfile?.schoolClass).filter(Boolean))].map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </Select>

            <Select value={filterStudent} onChange={e => { setFilterStudent(e.target.value); setCurrentPage(1); }}>
              <option value="all">Tous les signalants</option>
              {[...new Map(reports.filter((r: any) => r.student && !r.isAnonymous).map((r: any) => [r.student.id, r.student])).values()].map((student: any) => (
                <option key={student.id} value={student.id}>{student.firstName} {student.lastName} ({student.role})</option>
              ))}
            </Select>

            <input type="text" value={filterSuspect}
              onChange={e => { setFilterSuspect(e.target.value); setCurrentPage(1); }}
              placeholder="Filtrer par soupçonné..."
              className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-700" />

            <input key={`from-${resetKey}`} type="date" value={filterDateFrom}
              onChange={e => { setFilterDateFrom(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-700" />

            <span className="text-gray-400">➞</span>

            <input key={`to-${resetKey}`} type="date" value={filterDateTo}
              onChange={e => { setFilterDateTo(e.target.value); setCurrentPage(1); }}
              className="px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-700" />

            <Button variant="ghost" onClick={handleReset}>Réinitialiser</Button>
          </div>

          {/* Liste */}
          {loading ? (
            <div className="text-center py-16 text-gray-400">Chargement...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">Aucun signalement trouvé</div>
          ) : (
            <div className="flex flex-col gap-3">
              {paginated.map(report => (
                <div key={report.id}
                  style={{ borderLeft: `5px solid ${GRADE_COLORS[report.grade]}` }}
                  className="bg-[#ebfcff] px-6 py-5 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => { setSelected(report); setAdminNote(report.adminNote || ''); setView('detail'); loadNotes(report.id); }}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-sm text-[#006678]">{report.title}</span>
                        {report.gradeModified && (
                          <span className="bg-gray-100 text-gray-500 px-2 py-0 rounded-full text-xs">✏️ Grade modifié</span>
                        )}
                      </div>
                      <div className="text-xs text-[#006678] mb-2">
                        {report.description.length > 120 ? report.description.substring(0, 120) + '...' : report.description}
                      </div>
                      <div className="flex gap-4 text-xs text-[#006678]">
                        <span>👤 {report.isAnonymous ? 'Anonyme' : `${report.student?.firstName} ${report.student?.lastName}`}</span>
                        <span>🏫 {report.student?.studentProfile?.schoolClass ?? '-'}</span>
                        <span>📅 {new Date(report.createdAt).toLocaleDateString('fr-FR')}</span>
                        {report.suspects?.length > 0 && <span>⚠️ {report.suspects.length} coupable(s)</span>}
                        <span>{report.caseNumber}</span>
                      </div>
                    </div>
                    <Badge variant={report.status as any} className="ml-4" />
                  </div>
                </div>
              ))}
            </div>
          )}

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filtered.length}
            onPageChange={setCurrentPage}
          />
        </>
      )}

      {/* Utilisateurs */}
      {viewSection === 'users' && isAdmin && (
        <div>
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-xl font-bold text-gray-800">👥 Gestion des utilisateurs</h2>
            <Button onClick={() => { setShowUserForm(true); setEditingUser(null); setUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'student', schoolClass: '' }); }}>
              + Ajouter un utilisateur
            </Button>
          </div>

          {showUserForm && (
            <Card className="mb-5">
              <h3 className="text-gray-800 font-bold mb-4">{editingUser ? 'Modifier' : 'Ajouter'} un utilisateur</h3>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <Input placeholder="Prénom" value={userForm.firstName} onChange={e => setUserForm({...userForm, firstName: e.target.value})} />
                <Input placeholder="Nom" value={userForm.lastName} onChange={e => setUserForm({...userForm, lastName: e.target.value})} />
                <Input placeholder="Email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} />
                <Input placeholder="Mot de passe" type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} />
                <Select value={userForm.role} onChange={e => setUserForm({...userForm, role: e.target.value})}>
                  <option value="student">Élève</option>
                  <option value="teacher">Professeur</option>
                  <option value="staff">Personnel</option>
                  <option value="admin">Admin</option>
                  <option value="director">Directeur</option>
                </Select>
                {userForm.role === 'student' && (
                  <Select value={userForm.schoolClass} onChange={e => setUserForm({...userForm, schoolClass: e.target.value})}>
                    <option value="">Sélectionner une classe</option>
                    <option value="6eme">6ème</option>
                    <option value="5eme">5ème</option>
                    <option value="4eme">4ème</option>
                    <option value="3eme">3ème</option>
                  </Select>
                )}
              </div>
              <div className="flex gap-3">
                <Button variant="success" onClick={handleSaveUser}>💾 Enregistrer</Button>
                <Button variant="ghost" onClick={() => { setShowUserForm(false); setEditingUser(null); }}>Annuler</Button>
              </div>
            </Card>
          )}

          {loadingUsers ? (
            <div className="text-center py-10 text-gray-400">Chargement...</div>
          ) : (
            <div className="flex flex-col gap-3">
              {users.map((u: any) => (
                <Card key={u.id} className="flex justify-between items-center">
                  <div>
                    <span className="font-bold text-gray-800">{u.firstName} {u.lastName}</span>
                    <span className="ml-2 text-xs text-gray-400">{u.email}</span>
                    <span className="ml-2 bg-gray-100 px-2 py-0 rounded-lg text-xs text-gray-500">{u.role}</span>
                    {u.studentProfile?.schoolClass && (
                      <span className="ml-1 bg-[#ebfcff] px-2 py-0 rounded-lg text-xs text-[#0097b2]">{u.studentProfile.schoolClass}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => { setEditingUser(u); setUserForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', role: u.role, schoolClass: u.studentProfile?.schoolClass || '' }); setShowUserForm(true); }}>
                      ✏️ Modifier
                    </Button>
                    <Button variant="danger" onClick={() => handleDeleteUser(u.id)}>
                      🗑️ Supprimer
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      {viewSection === 'stats' && (
        <StatsDashboard reports={reports} />
      )}

    </div>
  </div>
);

}
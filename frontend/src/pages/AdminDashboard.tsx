import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllReports, updateReport, getNotes, addNote } from '../services/api';

const GRADE_COLORS: Record<string, string> = {
  critique: '#dc2626',
  grave:    '#f97316',
  moyen:    '#eab308',
  faible:   '#22c55e',
};

const GRADE_LABELS: Record<string, string> = {
  critique: '🔴 Critique',
  grave:    '🟠 Grave',
  moyen:    '🟡 Moyen',
  faible:   '🟢 Faible',
};

const STATUS_LABELS: Record<string, string> = {
  pending:     '⏳ En attente',
  in_progress: '🔄 En cours',
  escalated:   '🚨 Escaladé',
  closed:      '✅ Clôturé',
  rejected:    '❌ Rejeté',
};

export default function AdminDashboard() {
  const { user, logoutUser } = useAuth();
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

  const filtered = reports
    .filter((r: any) => filterGrade === 'all' || r.grade === filterGrade)
    .filter((r: any) => filterStatus === 'all' || r.status === filterStatus)
    .filter((r: any) => filterClass === 'all' || r.student?.studentProfile?.schoolClass === filterClass)
    .filter((r: any) => filterStudent === 'all' || r.student?.id === filterStudent)
    .filter((r: any) => {
      if (!filterSuspect) return true;
      const suspectText = filterSuspect.toLowerCase();
      return r.suspects?.some((s: any) => {
        const userName = `${s.user?.firstName} ${s.user?.lastName}`.toLowerCase();
        const freeText = s.freeText?.toLowerCase() || '';
        return userName.includes(suspectText) || freeText.includes(suspectText);
      });
    })
    .filter((r: any) => {
      if (!filterDateFrom) return true;
      return new Date(r.createdAt) >= new Date(filterDateFrom);
    })
    .filter((r: any) => {
      if (!filterDateTo) return true;
      return new Date(r.createdAt) <= new Date(filterDateTo + 'T23:59:59');
    })
    .filter((r: any) => {
      if (!search) return true;
      const fullName = `${r.student?.firstName} ${r.student?.lastName}`.toLowerCase();
      const title = r.title.toLowerCase();
      return fullName.includes(search.toLowerCase()) || title.includes(search.toLowerCase());
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

  // ── HEADER commun ────────────────────────────────────────
  const Header = () => (
    <div style={{ background: 'linear-gradient(135deg, #1a1a2e, #0f3460)', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '24px' }}>🛡️</span>
        <span style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>SafeSchool</span>
        <span style={{ background: 'rgba(255,255,255,0.15)', color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>
          {user?.role === 'director' ? 'Directeur' : 'Admin'}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <span style={{ color: '#aaa', fontSize: '14px' }}>{user?.firstName} {user?.lastName}</span>
        <button onClick={logoutUser} style={{ padding: '8px 16px', background: 'transparent', color: 'white', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
          Déconnexion
        </button>
      </div>
    </div>
  );

  // ── PAGE DÉTAIL ──────────────────────────────────────────
  if (view === 'detail' && selected) return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: 'Segoe UI, sans-serif' }}>
      <Header />

      <div style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 20px' }}>

        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px', fontSize: '14px' }}>
          <button onClick={() => { setView('list'); setSelected(null); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#0f3460', fontWeight: 600, padding: 0 }}>
            ← Mes dossiers
          </button>
          <span style={{ color: '#aaa' }}>/</span>
          <span style={{ color: '#666' }}>
            {selected.caseNumber} — {selected.isAnonymous ? 'Anonyme' : `${selected.student?.firstName} ${selected.student?.lastName}`}
          </span>
        </div>

        {/* Titre + grade + statut + boutons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h1 style={{ margin: 0, fontSize: '22px', color: '#1a1a2e' }}>{selected.caseNumber}</h1>
            <span style={{ background: GRADE_COLORS[selected.grade], color: 'white', padding: '4px 14px', borderRadius: '12px', fontSize: '13px', fontWeight: 600 }}>
              {GRADE_LABELS[selected.grade]}
            </span>
            <span style={{ background: '#f3f4f6', color: '#555', padding: '4px 12px', borderRadius: '12px', fontSize: '12px' }}>
              {STATUS_LABELS[selected.status]}
            </span>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
            {[
              { status: 'in_progress', label: '🔄 En cours',  bg: '#0f3460' },
              { status: 'escalated',   label: '🚨 Escalader', bg: '#7c3aed' },
              { status: 'closed',      label: '✅ Clôturer',  bg: '#22c55e' },
              { status: 'rejected',    label: '❌ Rejeter',   bg: '#dc2626' },
            ].map(btn => (
              <button key={btn.status} onClick={() => handleUpdateStatus(selected.id, btn.status)} disabled={saving}
                style={{ padding: '10px 16px', borderRadius: '8px', fontSize: '13px', border: 'none', cursor: saving ? 'not-allowed' : 'pointer', background: btn.bg, color: 'white', fontWeight: 600 }}>
                {btn.label}
              </button>
            ))}
          </div>
        </div>

        {/* 2 colonnes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>

          {/* Informations */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px' }}>Informations du signalement</h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
              <tbody>
                {[
                  { label: 'Titre',      value: selected.title },
                  { label: 'Date',       value: new Date(selected.createdAt).toLocaleDateString('fr-FR') },
                  { label: 'Classe',     value: selected.student?.studentProfile?.schoolClass ?? '-' },
                  { label: 'Score IA',   value: selected.aiScore ? `${selected.aiScore}/100` : '-' },
                  { label: 'Analyse IA', value: selected.aiReason ?? '-' },
                  { label: 'Anonyme',    value: selected.isAnonymous ? 'Oui' : 'Non' },
                ].map(row => (
                  <tr key={row.label} style={{ borderBottom: '1px solid #f0f0f0' }}>
                    <td style={{ padding: '8px 0', color: '#888', fontWeight: 600, width: '40%' }}>{row.label}</td>
                    <td style={{ padding: '8px 0', color: '#333' }}>{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Personnes impliquées */}
          <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <h3 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px' }}>Personnes impliquées</h3>

            <p style={{ fontSize: '12px', color: '#888', fontWeight: 600, margin: '0 0 4px' }}>Signalé par</p>
            <p style={{ fontSize: '14px', color: '#333', margin: '0 0 16px' }}>
              {selected.isAnonymous ? 'Anonyme' : `${selected.student?.firstName} ${selected.student?.lastName}`}
              {selected.student?.role && (
                <span style={{ color: '#888', fontSize: '12px', marginLeft: '6px' }}>({selected.student.role})</span>
              )}
            </p>

            {selected.description?.includes('| Victime :') && (
              <>
                <p style={{ fontSize: '12px', color: '#888', fontWeight: 600, margin: '0 0 4px' }}>Victime</p>
                <p style={{ fontSize: '14px', color: '#333', margin: '0 0 16px' }}>
                  {selected.description.split('| Victime :')[1]?.split('|')[0]?.trim()}
                </p>
              </>
            )}

            <p style={{ fontSize: '12px', color: '#888', fontWeight: 600, margin: '0 0 8px' }}>Soupçonné(s)</p>
            {selected.suspects && selected.suspects.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                {selected.suspects.map((s: any, i: number) => (
                  <div key={i} style={{ background: '#fff4f4', padding: '6px 12px', borderRadius: '8px', fontSize: '14px', color: '#dc2626' }}>
                    {s.user ? `${s.user.firstName} ${s.user.lastName}` : s.freeText}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ fontSize: '14px', color: '#aaa', margin: 0 }}>Aucun soupçonné indiqué</p>
            )}
          </div>

        </div>

        {/* Description */}
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
          <h3 style={{ margin: '0 0 12px', color: '#1a1a2e', fontSize: '15px' }}>Description des faits</h3>
          <p style={{ fontSize: '14px', color: '#333', lineHeight: '1.7', margin: 0 }}>
            {selected.description?.split('|')[0]?.trim()}
          </p>
        </div>

        {/* Note administrative */}
        {/* Notes */}
<div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', marginBottom: '24px' }}>
  <h3 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px' }}>📝 Notes administratives</h3>

  {/* Liste des notes existantes */}
  {notes.length > 0 ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
      {notes.map((note: any) => (
        <div key={note.id} style={{
          background: note.type === 'convocation' ? '#f0f4ff' : '#f9f9f9',
          borderRadius: '8px', padding: '12px 16px',
          borderLeft: `3px solid ${note.type === 'convocation' ? '#7c3aed' : '#0f3460'}`,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
            <span style={{ fontSize: '12px', fontWeight: 600, color: note.type === 'convocation' ? '#7c3aed' : '#0f3460' }}>
              {note.type === 'convocation' ? '📅 Convocation' : '📝 Note'}
            </span>
            <span style={{ fontSize: '12px', color: '#888' }}>
              {new Date(note.createdAt).toLocaleDateString('fr-FR')} à {new Date(note.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              {note.author && ` — ${note.author.firstName} ${note.author.lastName}`}
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: '#333' }}>{note.content}</p>
        </div>
      ))}
    </div>
  ) : (
    <p style={{ color: '#aaa', fontSize: '14px', marginBottom: '20px' }}>Aucune note pour ce dossier</p>
  )}

  {/* Ajouter une note */}
  <textarea value={newNote} onChange={e => setNewNote(e.target.value)} rows={3}
    placeholder="Ajouter une note..."
    style={{ width: '100%', padding: '12px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', marginBottom: '10px' }} />
  <button onClick={() => handleAddNote('note')}
    style={{ padding: '10px 20px', background: '#0f3460', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
    💾 Enregistrer la note
  </button>
</div>

    {/* Convocation */}
    <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
      <h3 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px' }}>📅 Convoquer les personnes impliquées</h3>
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', marginBottom: '6px', fontSize: '13px', fontWeight: 600, color: '#555' }}>Date et heure de la convocation</label>
        <input type="datetime-local" value={convocationDate} onChange={e => setConvocationDate(e.target.value)}
          style={{ padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '13px', outline: 'none', color: '#333' }} />
      </div>
      <textarea value={convocationMessage} onChange={e => setConvocationMessage(e.target.value)} rows={3}
        placeholder={`Vous êtes convoqué(e) le ${convocationDate ? new Date(convocationDate).toLocaleDateString('fr-FR') : '...'} concernant un dossier de harcèlement. Merci de vous présenter...`}
        style={{ width: '100%', padding: '12px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical', marginBottom: '10px' }} />
      <button onClick={() => handleAddNote('convocation')}
        style={{ padding: '10px 20px', background: '#7c3aed', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
        📨 Envoyer la convocation
      </button>
    </div>

      </div>
    </div>
  );

  // ── PAGE LISTE ───────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: 'Segoe UI, sans-serif' }}>
      <Header />

      <div style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 20px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total',      value: stats.total,     color: '#1a1a2e' },
            { label: 'Critique',   value: stats.critique,  color: '#dc2626' },
            { label: 'Grave',      value: stats.grave,     color: '#f97316' },
            { label: 'En attente', value: stats.pending,   color: '#eab308' },
            { label: 'Escaladés',  value: stats.escalated, color: '#7c3aed' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderTop: `3px solid ${stat.color}` }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Barre de recherche */}
        <div style={{ marginBottom: '20px' }}>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher par nom, titre..."
            style={{ width: '100%', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
            onFocus={e => e.target.style.borderColor = '#0f3460'}
            onBlur={e => e.target.style.borderColor = '#e0e0e0'} />
        </div>

        {/* Filtres avancés */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '13px', outline: 'none', cursor: 'pointer', background: 'white', color: '#333' }}>
            <option value="all">Tous les statuts</option>
            <option value="pending">⏳ En attente</option>
            <option value="in_progress">🔄 En cours</option>
            <option value="escalated">🚨 Escaladé</option>
            <option value="closed">✅ Clôturé</option>
            <option value="rejected">❌ Rejeté</option>
          </select>

          <select value={filterGrade} onChange={e => { setFilterGrade(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '13px', outline: 'none', cursor: 'pointer', background: 'white', color: '#333' }}>
            <option value="all">Tous les grades</option>
            <option value="critique">🔴 Critique</option>
            <option value="grave">🟠 Grave</option>
            <option value="moyen">🟡 Moyen</option>
            <option value="faible">🟢 Faible</option>
          </select>

          <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '13px', outline: 'none', cursor: 'pointer', background: 'white', color: '#333' }}>
            <option value="all">Toutes les classes</option>
            {[...new Set(reports.map((r: any) => r.student?.studentProfile?.schoolClass).filter(Boolean))].map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>

          <select value={filterStudent} onChange={e => { setFilterStudent(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '13px', outline: 'none', cursor: 'pointer', background: 'white', color: '#333' }}>
            <option value="all">Tous les signalants</option>
            {[...new Map(reports.filter((r: any) => r.student && !r.isAnonymous).map((r: any) => [r.student.id, r.student])).values()].map((student: any) => (
              <option key={student.id} value={student.id}>{student.firstName} {student.lastName} ({student.role})</option>
            ))}
          </select>

          <input type="text" value={filterSuspect} onChange={e => { setFilterSuspect(e.target.value); setCurrentPage(1); }} placeholder="Filtrer par soupçonné..."
            style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '13px', outline: 'none', background: 'white', color: '#333' }} />

          <input key={`from-${resetKey}`} type="date" value={filterDateFrom} onChange={e => { setFilterDateFrom(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '13px', outline: 'none', background: 'white', color: '#333' }} />
          <span style={{ color: '#666' }}>→</span>
          <input key={`to-${resetKey}`} type="date" value={filterDateTo} onChange={e => { setFilterDateTo(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '13px', outline: 'none', background: 'white', color: '#333' }} />

          <button onClick={handleReset} style={{ padding: '10px 16px', background: '#f3f4f6', border: 'none', borderRadius: '8px', fontSize: '13px', cursor: 'pointer', color: '#666' }}>
            Réinitialiser
          </button>
        </div>

        {/* Liste signalements */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>Chargement...</div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>Aucun signalement trouvé</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {paginated.map(report => (
              <div key={report.id}
                style={{ background: 'white', borderRadius: '12px', padding: '20px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)', borderLeft: `4px solid ${GRADE_COLORS[report.grade]}`, cursor: 'pointer' }}
                onClick={() => { setSelected(report); setAdminNote(report.adminNote || ''); setView('detail'); loadNotes(report.id);}}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: '#1a1a2e' }}>{report.title}</span>
                      <span style={{ background: GRADE_COLORS[report.grade], color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>
                        {GRADE_LABELS[report.grade]}
                      </span>
                      {report.gradeModified && (
                        <span style={{ background: '#f3f4f6', color: '#666', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>✏️ Grade modifié</span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                      {report.description.length > 120 ? report.description.substring(0, 120) + '...' : report.description}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#999' }}>
                      <span>👤 {report.isAnonymous ? 'Anonyme' : `${report.student?.firstName} ${report.student?.lastName}`}</span>
                      <span>📅 {new Date(report.createdAt).toLocaleDateString('fr-FR')}</span>
                      <span>🏫 {report.student?.studentProfile?.schoolClass ?? '-'}</span>
                      {report.suspects?.length > 0 && <span>⚠️ {report.suspects.length} soupçonné(s)</span>}
                    </div>
                  </div>
                  <span style={{ background: '#f3f4f6', color: '#555', padding: '4px 12px', borderRadius: '12px', fontSize: '12px', whiteSpace: 'nowrap', marginLeft: '16px' }}>
                    {STATUS_LABELS[report.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '20px', fontSize: '13px', color: '#666' }}>
            <span>{filtered.length} résultats · Page {currentPage} sur {totalPages}</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ddd', background: 'white', cursor: currentPage === 1 ? 'not-allowed' : 'pointer', color: currentPage === 1 ? '#ccc' : '#333' }}>«</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)}
                  style={{ padding: '6px 12px', borderRadius: '6px', border: currentPage === page ? 'none' : '1px solid #ddd', background: currentPage === page ? '#0f3460' : 'white', color: currentPage === page ? 'white' : '#333', cursor: 'pointer', fontWeight: currentPage === page ? 600 : 400 }}>
                  {page}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ddd', background: 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#ccc' : '#333' }}>»</button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
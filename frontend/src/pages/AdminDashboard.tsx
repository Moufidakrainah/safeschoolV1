import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllReports, updateReport } from '../services/api';

const GRADE_COLORS: Record<string, string> = {
  critical: '#dc2626',
  urgent:   '#f97316',
  serious:  '#eab308',
  watch:    '#22c55e',
};

const GRADE_LABELS: Record<string, string> = {
  critical: '🔴 Critical',
  urgent:   '🟠 Urgent',
  serious:  '🟡 Serious',
  watch:    '🟢 Watch',
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
  const itemsPerPage = 5;

  useEffect(() => {
    fetchReports();
  }, []);

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
      setSelected(null);
      setAdminNote('');
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
    critical:  reports.filter((r: any) => r.grade === 'critical').length,
    urgent:    reports.filter((r: any) => r.grade === 'urgent').length,
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

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: 'Segoe UI, sans-serif' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #1a1a2e, #0f3460)',
        padding: '16px 32px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '24px' }}>🛡️</span>
          <span style={{ color: 'white', fontWeight: 700, fontSize: '18px' }}>SafeSchool</span>
          <span style={{
            background: 'rgba(255,255,255,0.15)', color: 'white',
            padding: '2px 10px', borderRadius: '12px', fontSize: '12px',
          }}>
            {user?.role === 'director' ? 'Directeur' : 'Admin'}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ color: '#aaa', fontSize: '14px' }}>
            {user?.firstName} {user?.lastName}
          </span>
          <button onClick={logoutUser} style={{
            padding: '8px 16px', background: 'transparent',
            color: 'white', border: '1px solid rgba(255,255,255,0.3)',
            borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
          }}>
            Déconnexion
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '32px auto', padding: '0 20px' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total',      value: stats.total,     color: '#1a1a2e' },
            { label: 'Critical',   value: stats.critical,  color: '#dc2626' },
            { label: 'Urgent',     value: stats.urgent,    color: '#f97316' },
            { label: 'En attente', value: stats.pending,   color: '#eab308' },
            { label: 'Escaladés',  value: stats.escalated, color: '#7c3aed' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: 'white', borderRadius: '12px',
              padding: '20px', textAlign: 'center',
              boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              borderTop: `3px solid ${stat.color}`,
            }}>
              <div style={{ fontSize: '28px', fontWeight: 700, color: stat.color }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '13px', color: '#666', marginTop: '4px' }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>

        {/* Barre de recherche */}
        <div style={{ marginBottom: '20px' }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher par nom, titre..."
            style={{
              width: '100%', padding: '12px 16px',
              border: '2px solid #e0e0e0', borderRadius: '8px',
              fontSize: '14px', outline: 'none', boxSizing: 'border-box',
            }}
            onFocus={e => e.target.style.borderColor = '#0f3460'}
            onBlur={e => e.target.style.borderColor = '#e0e0e0'}
          />
        </div>

        {/* Filtres avancés */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>

          <select value={filterStatus} onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '13px', outline: 'none', cursor: 'pointer', background: 'white' }}>
            <option value="all">Tous les statuts</option>
            <option value="pending">⏳ En attente</option>
            <option value="in_progress">🔄 En cours</option>
            <option value="escalated">🚨 Escaladé</option>
            <option value="closed">✅ Clôturé</option>
            <option value="rejected">❌ Rejeté</option>
          </select>

          <select value={filterGrade} onChange={e => { setFilterGrade(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '13px', outline: 'none', cursor: 'pointer', background: 'white' }}>
            <option value="all">Tous les grades</option>
            <option value="critical">🔴 Critical</option>
            <option value="urgent">🟠 Urgent</option>
            <option value="serious">🟡 Serious</option>
            <option value="watch">🟢 Watch</option>
          </select>

          <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '13px', outline: 'none', cursor: 'pointer', background: 'white' }}>
            <option value="all">Toutes les classes</option>
            {[...new Set(reports.map((r: any) => r.student?.studentProfile?.schoolClass).filter(Boolean))].map(cls => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>

          <select value={filterStudent} onChange={e => { setFilterStudent(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '13px', outline: 'none', cursor: 'pointer', background: 'white' }}>
            <option value="all">Tous les signalants</option>
            {[...new Map(reports
              .filter((r: any) => r.student && !r.isAnonymous)
              .map((r: any) => [r.student.id, r.student])
            ).values()].map((student: any) => (
              <option key={student.id} value={student.id}>
                {student.firstName} {student.lastName} ({student.role})
              </option>
            ))}
          </select>

          <input
            type="text"
            value={filterSuspect}
            onChange={e => { setFilterSuspect(e.target.value); setCurrentPage(1); }}
            placeholder="Filtrer par soupçonné..."
            style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '13px', outline: 'none', background: 'white' }}
          />

          <input
            key={`from-${resetKey}`}
            type="date"
            value={filterDateFrom}
            onChange={e => { setFilterDateFrom(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '13px', outline: 'none', background: 'white' }}
          />
          <span style={{ color: '#666' }}>→</span>
          <input
            key={`to-${resetKey}`}
            type="date"
            value={filterDateTo}
            onChange={e => { setFilterDateTo(e.target.value); setCurrentPage(1); }}
            style={{ padding: '10px 14px', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '13px', outline: 'none', background: 'white' }}
          />

          <button onClick={handleReset} style={{
            padding: '10px 16px', background: '#f3f4f6',
            border: 'none', borderRadius: '8px',
            fontSize: '13px', cursor: 'pointer', color: '#666',
          }}>
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
              <div key={report.id} style={{
                background: 'white', borderRadius: '12px',
                padding: '20px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
                borderLeft: `4px solid ${GRADE_COLORS[report.grade]}`,
                cursor: 'pointer',
              }}
                onClick={() => { setSelected(report); setAdminNote(report.adminNote || ''); }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '15px', color: '#1a1a2e' }}>{report.title}</span>
                      <span style={{ background: GRADE_COLORS[report.grade], color: 'white', padding: '2px 10px', borderRadius: '12px', fontSize: '12px' }}>
                        {GRADE_LABELS[report.grade]}
                      </span>
                      {report.gradeModified && (
                        <span style={{ background: '#f3f4f6', color: '#666', padding: '2px 8px', borderRadius: '12px', fontSize: '11px' }}>
                          ✏️ Grade modifié
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                      {report.description.length > 120 ? report.description.substring(0, 120) + '...' : report.description}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#999' }}>
                      <span>👤 {report.isAnonymous ? 'Anonyme' : `${report.student?.firstName} ${report.student?.lastName}`}</span>
                      <span>📅 {new Date(report.createdAt).toLocaleDateString('fr-FR')}</span>
                      <span>🏫 {report.student?.studentProfile?.schoolClass ?? '-'}</span>
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
                <button key={page} onClick={() => setCurrentPage(page)} style={{
                  padding: '6px 12px', borderRadius: '6px',
                  border: currentPage === page ? 'none' : '1px solid #ddd',
                  background: currentPage === page ? '#0f3460' : 'white',
                  color: currentPage === page ? 'white' : '#333',
                  cursor: 'pointer', fontWeight: currentPage === page ? 600 : 400,
                }}>{page}</button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}
                style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #ddd', background: 'white', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', color: currentPage === totalPages ? '#ccc' : '#333' }}>»</button>
            </div>
          </div>
        )}

      </div>

      {/* Modal détail */}
      {selected && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '20px' }}
          onClick={() => setSelected(null)}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '32px', maxWidth: '600px', width: '100%', maxHeight: '80vh', overflowY: 'auto' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#1a1a2e', fontSize: '18px' }}>{selected.title}</h2>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666' }}>✕</button>
            </div>
            <div style={{ marginBottom: '16px' }}>
              <span style={{ background: GRADE_COLORS[selected.grade], color: 'white', padding: '4px 14px', borderRadius: '12px', fontSize: '13px' }}>
                {GRADE_LABELS[selected.grade]}
              </span>
            </div>
            <p style={{ color: '#333', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>{selected.description}</p>
            <div style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
              <p>👤 {selected.isAnonymous ? 'Anonyme' : `${selected.student?.firstName} ${selected.student?.lastName}`}</p>
              <p>📅 {new Date(selected.createdAt).toLocaleDateString('fr-FR')}</p>
              <p>🏫 {selected.student?.studentProfile?.schoolClass ?? '-'}</p>
              <p>📌 Statut : {STATUS_LABELS[selected.status]}</p>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>Note administrative</label>
              <textarea value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={3} placeholder="Ajouter une note..."
                style={{ width: '100%', padding: '10px 14px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }} />
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {['in_progress', 'escalated', 'closed', 'rejected'].map(status => (
                <button key={status} onClick={() => handleUpdateStatus(selected.id, status)} disabled={saving}
                  style={{
                    padding: '10px 16px', borderRadius: '8px', fontSize: '13px', border: 'none',
                    cursor: saving ? 'not-allowed' : 'pointer',
                    background: status === 'escalated' ? '#7c3aed' : status === 'closed' ? '#22c55e' : status === 'rejected' ? '#dc2626' : '#0f3460',
                    color: 'white', fontWeight: 600,
                  }}>
                  {STATUS_LABELS[status]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
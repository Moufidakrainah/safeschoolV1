
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
  const [filter, setFilter] = useState('all');
  const [adminNote, setAdminNote] = useState('');
  const [saving, setSaving] = useState(false);

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

  const filtered = filter === 'all'
    ? reports
    : reports.filter(r => r.grade === filter || r.status === filter);

  const stats = {
    total:     reports.length,
    critical:  reports.filter(r => r.grade === 'critical').length,
    urgent:    reports.filter(r => r.grade === 'urgent').length,
    pending:   reports.filter(r => r.status === 'pending').length,
    escalated: reports.filter(r => r.status === 'escalated').length,
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

        {/* Filtres */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {[
            { key: 'all',       label: 'Tous' },
            { key: 'critical',  label: '🔴 Critical' },
            { key: 'urgent',    label: '🟠 Urgent' },
            { key: 'serious',   label: '🟡 Serious' },
            { key: 'watch',     label: '🟢 Watch' },
            { key: 'pending',   label: '⏳ En attente' },
            { key: 'escalated', label: '🚨 Escaladés' },
          ].map(f => (
            <button key={f.key} onClick={() => setFilter(f.key)} style={{
              padding: '8px 16px', borderRadius: '20px', fontSize: '13px',
              border: filter === f.key ? 'none' : '1px solid #ddd',
              background: filter === f.key ? '#0f3460' : 'white',
              color: filter === f.key ? 'white' : '#333',
              cursor: 'pointer', fontWeight: filter === f.key ? 600 : 400,
            }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Liste signalements */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
            Chargement...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#666' }}>
            Aucun signalement trouvé
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {filtered.map(report => (
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
                      <span style={{ fontWeight: 700, fontSize: '15px', color: '#1a1a2e' }}>
                        {report.title}
                      </span>
                      <span style={{
                        background: GRADE_COLORS[report.grade],
                        color: 'white', padding: '2px 10px',
                        borderRadius: '12px', fontSize: '12px',
                      }}>
                        {GRADE_LABELS[report.grade]}
                      </span>
                      {report.gradeModified && (
                        <span style={{
                          background: '#f3f4f6', color: '#666',
                          padding: '2px 8px', borderRadius: '12px', fontSize: '11px',
                        }}>
                          ✏️ Grade modifié
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: '13px', color: '#666', marginBottom: '8px' }}>
                      {report.description.length > 120
                        ? report.description.substring(0, 120) + '...'
                        : report.description}
                    </div>
                    <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#999' }}>
                      <span>
                        👤 {report.isAnonymous ? 'Anonyme' : `${report.student?.firstName} ${report.student?.lastName}`}
                      </span>
                      <span>📅 {new Date(report.createdAt).toLocaleDateString('fr-FR')}</span>
                    </div>
                  </div>
                  <span style={{
                    background: '#f3f4f6', color: '#555',
                    padding: '4px 12px', borderRadius: '12px', fontSize: '12px',
                    whiteSpace: 'nowrap', marginLeft: '16px',
                  }}>
                    {STATUS_LABELS[report.status]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal détail */}
      {selected && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '20px',
        }}
          onClick={() => setSelected(null)}
        >
          <div style={{
            background: 'white', borderRadius: '16px',
            padding: '32px', maxWidth: '600px', width: '100%',
            maxHeight: '80vh', overflowY: 'auto',
          }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, color: '#1a1a2e', fontSize: '18px' }}>{selected.title}</h2>
              <button onClick={() => setSelected(null)} style={{
                background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#666',
              }}>✕</button>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <span style={{
                background: GRADE_COLORS[selected.grade],
                color: 'white', padding: '4px 14px',
                borderRadius: '12px', fontSize: '13px',
              }}>
                {GRADE_LABELS[selected.grade]}
              </span>
            </div>

            <p style={{ color: '#333', fontSize: '14px', lineHeight: '1.6', marginBottom: '16px' }}>
              {selected.description}
            </p>

            <div style={{ fontSize: '13px', color: '#666', marginBottom: '20px' }}>
              <p>👤 {selected.isAnonymous ? 'Anonyme' : `${selected.student?.firstName} ${selected.student?.lastName}`}</p>
              <p>📅 {new Date(selected.createdAt).toLocaleDateString('fr-FR')}</p>
              <p>📌 Statut : {STATUS_LABELS[selected.status]}</p>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px' }}>
                Note administrative
              </label>
              <textarea
                value={adminNote}
                onChange={e => setAdminNote(e.target.value)}
                rows={3}
                placeholder="Ajouter une note..."
                style={{
                  width: '100%', padding: '10px 14px',
                  border: '2px solid #e0e0e0', borderRadius: '8px',
                  fontSize: '14px', boxSizing: 'border-box',
                  fontFamily: 'inherit', resize: 'vertical',
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {['in_progress', 'escalated', 'closed', 'rejected'].map(status => (
                <button key={status} onClick={() => handleUpdateStatus(selected.id, status)}
                  disabled={saving}
                  style={{
                    padding: '10px 16px', borderRadius: '8px', fontSize: '13px',
                    border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                    background: status === 'escalated' ? '#7c3aed'
                      : status === 'closed' ? '#22c55e'
                      : status === 'rejected' ? '#dc2626' : '#0f3460',
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
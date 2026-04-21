import { useState, useEffect } from 'react';
import { getReports, updateReport, escalateReport } from '../services/api';
import { useAuth } from '../context/AuthContext';

type Grade = 'critical' | 'urgent' | 'serious' | 'watch';
type Status = 'pending' | 'in_progress' | 'escalated' | 'closed' | 'rejected';

interface Report {
  id: number;
  title: string;
  description: string;
  grade: Grade;
  status: Status;
  isAnonymous: boolean;
  adminNote: string | null;
  createdAt: string;
  student: { firstName: string; lastName: string; email: string } | null;
}

const GRADE_COLORS: Record<Grade, string> = {
  critical: '#dc2626',
  urgent:   '#f97316',
  serious:  '#eab308',
  watch:    '#22c55e',
};

const GRADE_LABELS: Record<Grade, string> = {
  critical: '🔴 Critique',
  urgent:   '🟠 Urgent',
  serious:  '🟡 Sérieux',
  watch:    '🟢 À surveiller',
};

const STATUS_LABELS: Record<Status, string> = {
  pending:     '⏳ En attente',
  in_progress: '🔄 En cours',
  escalated:   '⬆️ Escaladé',
  closed:      '✅ Clôturé',
  rejected:    '❌ Rejeté',
};

const STATUS_COLORS: Record<Status, string> = {
  pending:     '#f3f4f6',
  in_progress: '#dbeafe',
  escalated:   '#fce7f3',
  closed:      '#d1fae5',
  rejected:    '#fee2e2',
};

export default function AdminDashboard() {
  const { user, logoutUser } = useAuth();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editNote, setEditNote] = useState('');
  const [editStatus, setEditStatus] = useState<Status>('pending');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getReports()
      .then(setReports)
      .catch(() => setError('Impossible de charger les signalements'))
      .finally(() => setLoading(false));
  }, []);

  const handleEditOpen = (report: Report) => {
    setEditingId(report.id);
    setEditNote(report.adminNote ?? '');
    setEditStatus(report.status);
  };

  const handleEditSave = async (id: number) => {
    setSaving(true);
    try {
      const updated = await updateReport(id, { adminNote: editNote, status: editStatus });
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
      setEditingId(null);
    } catch {
      setError('Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleEscalate = async (id: number) => {
    try {
      const updated = await escalateReport(id);
      setReports((prev) => prev.map((r) => (r.id === id ? { ...r, ...updated } : r)));
    } catch {
      setError('Erreur lors de l\'escalade');
    }
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
            fontSize: '12px', padding: '2px 10px', borderRadius: '20px',
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

      {/* Contenu */}
      <div style={{ maxWidth: '960px', margin: '40px auto', padding: '0 20px' }}>
        <h2 style={{ color: '#1a1a2e', marginBottom: '4px' }}>Signalements</h2>
        <p style={{ color: '#666', marginBottom: '32px', fontSize: '14px' }}>
          {reports.length} signalement{reports.length !== 1 ? 's' : ''} au total
        </p>

        {error && (
          <div style={{
            background: '#fff0f0', border: '1px solid #ffcccc', borderRadius: '8px',
            padding: '12px 16px', marginBottom: '24px', color: '#cc0000', fontSize: '14px',
          }}>
            ⚠️ {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', color: '#666', padding: '60px' }}>
            Chargement...
          </div>
        ) : reports.length === 0 ? (
          <div style={{
            background: 'white', borderRadius: '16px', padding: '60px',
            textAlign: 'center', color: '#999',
          }}>
            Aucun signalement pour le moment.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {reports.map((report) => (
              <div key={report.id} style={{
                background: 'white', borderRadius: '16px',
                padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                borderLeft: `4px solid ${GRADE_COLORS[report.grade]}`,
              }}>
                {/* Ligne titre + badges */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ margin: '0 0 6px', color: '#1a1a2e', fontSize: '16px' }}>
                      {report.title}
                    </h3>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{
                        background: GRADE_COLORS[report.grade], color: 'white',
                        fontSize: '12px', padding: '2px 10px', borderRadius: '20px', fontWeight: 600,
                      }}>
                        {GRADE_LABELS[report.grade]}
                      </span>
                      <span style={{
                        background: STATUS_COLORS[report.status], color: '#333',
                        fontSize: '12px', padding: '2px 10px', borderRadius: '20px',
                      }}>
                        {STATUS_LABELS[report.status]}
                      </span>
                      {report.isAnonymous && (
                        <span style={{
                          background: '#f3f4f6', color: '#666',
                          fontSize: '12px', padding: '2px 10px', borderRadius: '20px',
                        }}>
                          🔒 Anonyme
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ color: '#aaa', fontSize: '12px', whiteSpace: 'nowrap', marginLeft: '16px' }}>
                    {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                  </span>
                </div>

                {/* Description */}
                <p style={{ color: '#555', fontSize: '14px', margin: '0 0 12px', lineHeight: 1.6 }}>
                  {report.description}
                </p>

                {/* Élève */}
                {!report.isAnonymous && report.student && (
                  <p style={{ color: '#888', fontSize: '13px', margin: '0 0 12px' }}>
                    👤 {report.student.firstName} {report.student.lastName} — {report.student.email}
                  </p>
                )}

                {/* Note admin existante */}
                {report.adminNote && editingId !== report.id && (
                  <div style={{
                    background: '#f0f4ff', borderRadius: '8px',
                    padding: '10px 14px', marginBottom: '12px', fontSize: '13px', color: '#333',
                  }}>
                    📝 <strong>Note :</strong> {report.adminNote}
                  </div>
                )}

                {/* Formulaire d'édition inline */}
                {editingId === report.id ? (
                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#333', marginBottom: '6px' }}>
                        Statut
                      </label>
                      <select
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value as Status)}
                        style={{
                          padding: '8px 12px', border: '2px solid #e0e0e0',
                          borderRadius: '8px', fontSize: '14px', outline: 'none',
                        }}
                      >
                        <option value="pending">⏳ En attente</option>
                        <option value="in_progress">🔄 En cours</option>
                        <option value="escalated">⬆️ Escaladé</option>
                        <option value="closed">✅ Clôturé</option>
                        <option value="rejected">❌ Rejeté</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontWeight: 600, fontSize: '13px', color: '#333', marginBottom: '6px' }}>
                        Note admin
                      </label>
                      <textarea
                        value={editNote}
                        onChange={(e) => setEditNote(e.target.value)}
                        rows={3}
                        placeholder="Ajouter une note interne..."
                        style={{
                          width: '100%', padding: '10px 14px',
                          border: '2px solid #e0e0e0', borderRadius: '8px',
                          fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                          resize: 'vertical', fontFamily: 'inherit',
                        }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => handleEditSave(report.id)}
                        disabled={saving}
                        style={{
                          padding: '8px 20px', background: '#1a1a2e', color: 'white',
                          border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                        }}
                      >
                        {saving ? 'Enregistrement...' : 'Enregistrer'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        style={{
                          padding: '8px 20px', background: 'transparent', color: '#666',
                          border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                        }}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Boutons d'action */
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button
                      onClick={() => handleEditOpen(report)}
                      style={{
                        padding: '7px 16px', background: '#1a1a2e', color: 'white',
                        border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                      }}
                    >
                      ✏️ Modifier
                    </button>
                    {report.status !== 'escalated' && report.status !== 'closed' && (
                      <button
                        onClick={() => handleEscalate(report.id)}
                        style={{
                          padding: '7px 16px', background: '#7c3aed', color: 'white',
                          border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
                        }}
                      >
                        ⬆️ Escalader au directeur
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

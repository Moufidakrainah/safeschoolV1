import { useState } from 'react';
import { createReport } from '../services/api';
import { useAuth } from '../context/AuthContext';

const GRADE_COLORS: Record<string, string> = {
  critical: '#dc2626',
  urgent:   '#f97316',
  serious:  '#eab308',
  watch:    '#22c55e',
};

const GRADE_LABELS: Record<string, string> = {
  critical: '🔴 Critique',
  urgent:   '🟠 Urgent',
  serious:  '🟡 Sérieux',
  watch:    '🟢 À surveiller',
};

export default function StudentDashboard() {
  const { user, logoutUser } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(null);
    setLoading(true);
    try {
      const report = await createReport(title, description, isAnonymous);
      setSuccess(report);
      setTitle('');
      setDescription('');
      setIsAnonymous(false);
    } catch (err: any) {
      setError("Erreur lors de l'envoi du signalement");
    } finally {
      setLoading(false);
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
      <div style={{ maxWidth: '680px', margin: '40px auto', padding: '0 20px' }}>
        <h2 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Faire un signalement</h2>
        <p style={{ color: '#666', marginBottom: '32px', fontSize: '14px' }}>
          Ton signalement sera analysé et traité en toute confidentialité.
        </p>

        <div style={{
          background: 'white', borderRadius: '16px',
          padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#333' }}>
                Titre du signalement
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ex: Harcelement dans la cour de recreation"
                required
                style={{
                  width: '100%', padding: '12px 16px',
                  border: '2px solid #e0e0e0', borderRadius: '8px',
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={(e) => e.target.style.borderColor = '#0f3460'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#333' }}>
                Description détaillée
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Décris ce qui s'est passé, quand, où et qui était impliqué..."
                required
                rows={5}
                style={{
                  width: '100%', padding: '12px 16px',
                  border: '2px solid #e0e0e0', borderRadius: '8px',
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                  resize: 'vertical', fontFamily: 'inherit',
                }}
                onFocus={(e) => e.target.style.borderColor = '#0f3460'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            <div style={{ marginBottom: '28px' }}>
              <label style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                cursor: 'pointer', fontSize: '14px', color: '#333',
              }}>
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={(e) => setIsAnonymous(e.target.checked)}
                  style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                />
                <span>
                  <strong>Signalement anonyme</strong> — mon nom ne sera pas visible par l'administration
                </span>
              </label>
            </div>

            {error && (
              <div style={{
                background: '#fff0f0', border: '1px solid #ffcccc',
                borderRadius: '8px', padding: '12px', marginBottom: '20px',
                color: '#cc0000', fontSize: '14px',
              }}>
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%', padding: '14px',
                background: loading ? '#ccc' : 'linear-gradient(135deg, #1a1a2e, #0f3460)',
                color: 'white', border: 'none', borderRadius: '8px',
                fontSize: '16px', fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Envoi en cours...' : 'Envoyer le signalement'}
            </button>
          </form>
        </div>

        {/* Confirmation */}
        {success && (
          <div style={{
            background: 'white', borderRadius: '16px',
            padding: '24px', marginTop: '24px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
            borderLeft: `4px solid ${GRADE_COLORS[success.grade]}`,
          }}>
            <h3 style={{ margin: '0 0 12px', color: '#1a1a2e' }}>
              ✅ Signalement envoyé avec succès !
            </h3>
            <p style={{ margin: '0 0 8px', fontSize: '14px', color: '#555' }}>
              <strong>Grade attribué par l'IA :</strong>{' '}
              <span style={{
                background: GRADE_COLORS[success.grade],
                color: 'white', padding: '2px 10px',
                borderRadius: '12px', fontSize: '13px',
              }}>
                {GRADE_LABELS[success.grade]}
              </span>
            </p>
            <p style={{ margin: 0, fontSize: '14px', color: '#555' }}>
              <strong>Statut :</strong> En attente de traitement
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
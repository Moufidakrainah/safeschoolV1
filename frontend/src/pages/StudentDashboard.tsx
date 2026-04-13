import { useState, useEffect} from 'react';
import { useAuth } from '../context/AuthContext';
import { createReport, searchUsers, getReports, getNotifications, markNotificationRead } from '../services/api';

export default function StudentDashboard() {
  const { user, logoutUser } = useAuth();
  const [step, setStep] = useState(0); // 0 = accueil, 1-6 = étapes formulaire

  // Données du formulaire
  const [whoSignals, setWhoSignals] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [suspects, setSuspects] = useState<any[]>([]);
  const [suspectInput, setSuspectInput] = useState('');
  const [suspectSuggestions, setSuspectSuggestions] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [myReports, setMyReports] = useState<any[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [victimName, setVictimName] = useState('');
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [victimInput, setVictimInput] = useState('');
  const [victimSuggestions, setVictimSuggestions] = useState<any[]>([]);
  const [selectedVictim, setSelectedVictim] = useState<any>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const title = `${type} - ${whoSignals}`;
      const victimInfo = whoSignals === 'Je suis témoin' && victimName
      ? ` | Victime : ${victimName}`
      : '';
      const fullDescription = `${description} (Fréquence: ${frequency})${victimInfo}`;

      const suspectsData = suspects.map(s => ({
        userId: s.id || undefined,
        freeText: s.id ? undefined : `${s.firstName} ${s.lastName}`,
      }));

      const report = await createReport(
        title,
        fullDescription,
        isAnonymous,
        suspectsData,
        frequency,
        user?.studentProfile?.schoolClass || '',
      );
      setResult(report);
      setStep(7);
    } catch (err) {
      console.error('Erreur envoi signalement');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyReports = async () => {
    setLoadingReports(true);
    try {
      const data = await getReports();
      setMyReports(data);
    } catch (err) {
      console.error('Erreur chargement dossiers');
    } finally {
      setLoadingReports(false);
    }
  };

  const handleSuspectSearch = async (value: string) => {
    setSuspectInput(value);
    if (value.length < 2) { setSuspectSuggestions([]); return; }
    setSearchingUsers(true);
    try {
      const results = await searchUsers(value);
      setSuspectSuggestions(results);
    } catch {
      setSuspectSuggestions([]);
    } finally {
      setSearchingUsers(false);
    }
  };

  const addSuspect = (suspect: { id?: string; firstName: string; lastName: string; role?: string }) => {
    if (!suspects.find(s => s.firstName === suspect.firstName && s.lastName === suspect.lastName)) {
      setSuspects([...suspects, suspect]);
    }
    setSuspectInput('');
    setSuspectSuggestions([]);
  };

  const removeSuspect = (index: number) => {
    setSuspects(suspects.filter((_, i) => i !== index));
  };

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
      const unread = data.filter((n: any) => !n.isRead).length;
      setUnreadCount(unread);
    } catch (err) {
      console.error('Erreur notifications');
    }
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
}, [user?.id]);
  

  // PAGE ACCUEIL
  if (step === 0) return (
  <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: 'Segoe UI, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontWeight: 800, fontSize: '20px', color: '#0f3460' }}>Signalement</span>
          <span style={{ fontWeight: 800, fontSize: '20px', color: '#1a1a2e' }}>Collège</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>{user?.firstName} {user?.lastName}</span>
          
          {/* Bouton notification */}
          <div style={{ position: 'relative' }}>
            <button onClick={() => setShowNotifications(!showNotifications)}
              style={{ padding: '8px 12px', background: '#f0f4ff', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '16px', position: 'relative' }}>
              🔔
              {unreadCount > 0 && (
                <span style={{ position: 'absolute', top: '-6px', right: '-6px', background: '#dc2626', color: 'white', borderRadius: '50%', width: '18px', height: '18px', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Dropdown notifications */}
            {showNotifications && (
              <div style={{ position: 'absolute', right: 0, top: '40px', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.15)', width: '320px', zIndex: 100, maxHeight: '400px', overflowY: 'auto' }}>
                <div style={{ padding: '16px', borderBottom: '1px solid #eee', fontWeight: 700, fontSize: '14px' }}>
                  Notifications {unreadCount > 0 && <span style={{ color: '#dc2626' }}>({unreadCount} non lues)</span>}
                </div>
                {notifications.length === 0 ? (
                  <p style={{ padding: '20px', color: '#aaa', textAlign: 'center', fontSize: '14px' }}>Aucune notification</p>
                ) : (
                  notifications.map((n: any) => (
                    <div key={n.id} onClick={async () => { await markNotificationRead(n.id); fetchNotifications(); }}
                      style={{ padding: '14px 16px', borderBottom: '1px solid #f0f0f0', cursor: 'pointer', background: n.isRead ? 'white' : '#f0f4ff' }}>
                      <p style={{ margin: '0 0 4px', fontSize: '13px', color: '#333' }}>{n.message}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: '#aaa' }}>
                        {new Date(n.createdAt).toLocaleDateString('fr-FR')} à {new Date(n.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          <button onClick={logoutUser} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
            Déconnexion
          </button>
        </div>
      </div>

      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #e8f0fe, #f0f4ff)', padding: '48px 32px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <p style={{ color: '#0f3460', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
            Collège Jeanne d'Arc — Dispositif anti-harcèlement
          </p>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a2e', marginBottom: '12px', lineHeight: 1.3 }}>
            Tu vis ou tu témoines une situation de harcèlement ?
          </h1>
          <p style={{ color: '#0f3460', fontSize: '15px', marginBottom: '32px' }}>
            Signale-le en 5 minutes. Anonymat possible. Notre équipe intervient sous 24h.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => setStep(1)} style={{
              padding: '14px 32px', background: '#0f3460', color: 'white',
              border: 'none', borderRadius: '8px', fontSize: '15px',
              fontWeight: 600, cursor: 'pointer',
            }}>
              Faire un signalement
            </button>
            <button onClick={() => { fetchMyReports(); setStep(8); }} style={{
              padding: '14px 32px', background: 'white', color: '#0f3460',
              border: '2px solid #0f3460', borderRadius: '8px', fontSize: '15px',
              fontWeight: 600, cursor: 'pointer',
            }}>
              Suivre mon dossier
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', maxWidth: '600px', margin: '32px auto', padding: '0 20px' }}>
        {[
          { value: '24h', label: 'Délai de prise en charge', color: '#0f3460' },
          { value: '100%', label: 'Confidentialité garantie', color: '#22c55e' },
          { value: 'Anonymat', label: 'Option disponible', color: '#f97316' },
        ].map(stat => (
          <div key={stat.label} style={{ background: 'white', borderRadius: '12px', padding: '20px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Qui peut signaler */}
        <div style={{ maxWidth: '600px', margin: '0 auto 40px', padding: '0 20px' }}>
        <div style={{ background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <h3 style={{ margin: '0 0 16px', color: '#1a1a2e', fontSize: '15px', fontWeight: 700 }}>Qui peut signaler ?</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#444', alignItems: 'flex-start' }}>
            <span>• Un élève (victime ou témoin)</span>
            <span>• Un professeur</span>
            <span>• personnel du collège</span>
          </div>
        </div>
      </div>
    </div>
  );

  // PAGE CONFIRMATION
  if (step === 7) return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: 'Segoe UI, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', maxWidth: '500px', width: '100%', margin: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h2 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Signalement envoyé</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
          Votre signalement a bien été reçu et sera traité dans les meilleurs délais.
        </p>
        {result && whoSignals === 'Je suis victime' && (
          <div style={{ background: '#f0f4ff', borderRadius: '8px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
            <p style={{ fontSize: '12px', color: '#666', margin: '0 0 4px' }}>Numéro de dossier</p>
            <p style={{ fontSize: '20px', fontWeight: 700, color: '#0f3460', margin: 0 }}>{result.caseNumber}</p>
            <p style={{ fontSize: '12px', color: '#666', margin: '8px 0 0' }}>Conservez ce numéro pour suivre l'avancement</p>
          </div>
        )}

        {result && whoSignals !== 'Je suis victime' && (
          <div style={{ background: '#f0f4ff', borderRadius: '8px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
            <p style={{ fontSize: '13px', color: '#444', margin: 0 }}>
              ✉️ Votre signalement a bien été transmis à l'administration. Merci pour votre vigilance.
            </p>
          </div>
        )}
        <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
          <p style={{ fontWeight: 600, fontSize: '14px', margin: '0 0 12px' }}>Prochaines étapes</p>
          {['Un référent vous est assigné sous 24h', 'Un entretien sera organisé', 'Vous serez informé(e) des mesures prises'].map((s, i) => (
            <div key={i} style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', marginBottom: '8px', fontSize: '13px', color: '#555' }}>
              <span style={{ background: '#0f3460', color: 'white', borderRadius: '50%', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', flexShrink: 0 }}>{i + 1}</span>
              {s}
            </div>
          ))}
        </div>
        <button onClick={() => { setStep(0); setResult(null); setType(''); setDescription(''); setFrequency(''); setWhoSignals(''); }}
          style={{ padding: '12px 24px', background: '#0f3460', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
          Retour à l'accueil
        </button>
      </div>
    </div>
  );

  // PAGE SUIVI DOSSIER
if (step === 8) return (
  <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: 'Segoe UI, sans-serif' }}>
    {/* Header */}
    <div style={{ background: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        <span style={{ fontWeight: 800, fontSize: '20px', color: '#0f3460' }}>Signalement</span>
        <span style={{ fontWeight: 800, fontSize: '20px', color: '#1a1a2e' }}>Collège</span>
      </div>
      <button onClick={() => setStep(0)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#666' }}>
        ← Retour
      </button>
    </div>

    <div style={{ maxWidth: '600px', margin: '32px auto', padding: '0 20px' }}>
      <h2 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Mes dossiers</h2>
      <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
        Suivi de vos signalements en cours
      </p>

      {loadingReports ? (
        <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Chargement...</div>
      ) : myReports.length === 0 ? (
        <div style={{ background: 'white', borderRadius: '12px', padding: '32px', textAlign: 'center', boxShadow: '0 2px 10px rgba(0,0,0,0.06)' }}>
          <p style={{ color: '#666', fontSize: '14px' }}>Aucun signalement trouvé</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {myReports
            .filter((report: any) => !report.title.includes('Je suis témoin'))
            .map((report: any) => (
            <div key={report.id} style={{
              background: 'white', borderRadius: '12px',
              padding: '20px 24px', boxShadow: '0 2px 10px rgba(0,0,0,0.06)',
              borderLeft: `4px solid ${
                report.grade === 'critique' ? '#dc2626' :
                report.grade === 'grave' ? '#f97316' :
                report.grade === 'moyen' ? '#eab308' : '#22c55e'
              }`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700, fontSize: '15px', color: '#0f3460' }}>
                      {report.caseNumber}
                    </span>
                    <span style={{
                      background: report.grade === 'critique' ? '#dc2626' :
                                  report.grade === 'grave' ? '#f97316' :
                                  report.grade === 'moyen' ? '#eab308' : '#22c55e',
                      color: 'white', padding: '2px 10px',
                      borderRadius: '12px', fontSize: '12px',
                    }}>
                      {report.grade === 'critique' ? '🔴 Critique' :
                       report.grade === 'grave' ? '🟠 Grave' :
                       report.grade === 'moyen' ? '🟡 Moyen' : '🟢 Faible'}
                    </span>
                  </div>
                  <div style={{ fontSize: '14px', color: '#333', marginBottom: '6px', fontWeight: 600 }}>
                    {report.title}
                  </div>
                  <div style={{ fontSize: '13px', color: '#666' }}>
                    📅 {new Date(report.createdAt).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <span style={{
                  background: '#f3f4f6', color: '#555',
                  padding: '4px 12px', borderRadius: '12px', fontSize: '12px',
                  whiteSpace: 'nowrap',
                }}>
                  {report.status === 'pending' ? '⏳ En attente' :
                   report.status === 'in_progress' ? '🔄 En cours' :
                   report.status === 'escalated' ? '🚨 Escaladé' :
                   report.status === 'closed' ? '✅ Clôturé' : '❌ Rejeté'}
                </span>
              </div>

              {report.adminNote && (
                <div style={{
                  marginTop: '12px', background: '#f0f4ff',
                  borderRadius: '8px', padding: '10px 14px',
                  fontSize: '13px', color: '#444',
                }}>
                  💬 <strong>Note de l'administration :</strong> {report.adminNote}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

  // FORMULAIRE — barre de progression
  const steps = ['Qui signale', 'Type', 'Faits', 'Personnes', 'Preuves', 'Validation'];

  return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: 'Segoe UI, sans-serif' }}>
      {/* Header */}
      <div style={{ background: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontWeight: 800, fontSize: '20px', color: '#0f3460' }}>Signalement</span>
          <span style={{ fontWeight: 800, fontSize: '20px', color: '#1a1a2e' }}>Collège</span>
        </div>
        <button onClick={() => setStep(0)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#666' }}>
          Annuler
        </button>
      </div>

      {/* Barre de progression */}
      <div style={{ background: 'white', padding: '16px 32px', borderBottom: '1px solid #eee' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', gap: '8px' }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: step === i + 1 ? 700 : 400, color: step === i + 1 ? '#0f3460' : step > i + 1 ? '#22c55e' : '#aaa' }}>
                {s}
              </div>
              <div style={{ height: '3px', borderRadius: '2px', marginTop: '4px', background: step > i + 1 ? '#22c55e' : step === i + 1 ? '#0f3460' : '#e0e0e0' }} />
            </div>
          ))}
        </div>
      </div>

      {/* Contenu */}
      <div style={{ maxWidth: '600px', margin: '32px auto', padding: '0 20px' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

          {/* ÉTAPE 1 — Qui signale */}
          {step === 1 && (
            <div>
              <h2 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Qui signale ?</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Sélectionne ta situation</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {['Je suis victime', 'Je suis témoin',].map(option => (
                  <div key={option} onClick={() => setWhoSignals(option)} style={{
                    padding: '16px', borderRadius: '8px', cursor: 'pointer',
                    border: `2px solid ${whoSignals === option ? '#0f3460' : '#e0e0e0'}`,
                    background: whoSignals === option ? '#f0f4ff' : 'white',
                    fontSize: '14px', fontWeight: whoSignals === option ? 600 : 400,
                  }}>
                    {option}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 2 — Type */}
          {step === 2 && (
            <div>
              <h2 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Quel type de harcèlement ?</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Sélectionne le type qui correspond le mieux</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                {[
                  { label: 'Physique', sub: 'Coups, bousculades', icon: '✋' },
                  { label: 'Verbal', sub: 'Insultes, moqueries', icon: '💬' },
                  { label: 'Cyber', sub: 'Réseaux, SMS', icon: '📱' },
                  { label: 'Exclusion sociale', sub: 'Mise à l\'écart', icon: '🚫' },
                  { label: 'Sexuel', sub: 'Gestes, remarques', icon: '⚠️' },
                  { label: 'Autre', sub: 'Décrire ci-dessous', icon: '...' },
                ].map(t => (
                  <div key={t.label} onClick={() => setType(t.label)} style={{
                    padding: '16px', borderRadius: '8px', cursor: 'pointer', textAlign: 'center',
                    border: `2px solid ${type === t.label ? '#0f3460' : '#e0e0e0'}`,
                    background: type === t.label ? '#f0f4ff' : 'white',
                  }}>
                    <div style={{ fontSize: '24px', marginBottom: '4px' }}>{t.icon}</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: '#1a1a2e' }}>{t.label}</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>{t.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ÉTAPE 3 — Faits */}
          {step === 3 && (
            <div>
              <h2 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Décris les faits</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Explique ce qui s'est passé</p>
              {whoSignals === 'Je suis témoin' && (
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#333' }}>
                    Nom de la victime
                  </label>
                  <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={victimInput}
                  onChange={async (e) => {
                    setVictimInput(e.target.value);
                    setSelectedVictim(null);
                    setVictimName(e.target.value);
                    if (e.target.value.length >= 2) {
                      const results = await searchUsers(e.target.value);
                      setVictimSuggestions(results);
                    } else {
                      setVictimSuggestions([]);
                    }
                  }}
                  placeholder="Rechercher par nom ou prénom..."
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
                {victimSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: '8px', zIndex: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid #e0e0e0' }}>
                    {victimSuggestions.map(s => (
                      <div key={s.id} onClick={() => {
                        setSelectedVictim(s);
                        setVictimName(`${s.firstName} ${s.lastName}`);
                        setVictimInput(`${s.firstName} ${s.lastName}`);
                        setVictimSuggestions([]);
                      }}
                        style={{ padding: '12px 16px', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #f0f0f0' }}
                        onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                        <span style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</span>
                        <span style={{ color: '#888', fontSize: '12px', marginLeft: '8px' }}>({s.role})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedVictim && (
                <div style={{ marginTop: '8px', background: '#f0fff4', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', color: '#22c55e', display: 'inline-block' }}>
                  ✅ {selectedVictim.firstName} {selectedVictim.lastName} sélectionné(e)
                </div>
              )}
                </div>
              )} 
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Décris ce qui s'est passé, quand, où et qui était impliqué..."
                rows={5}
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit', marginBottom: '20px' }}
              />
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#333' }}>
                Fréquence des actes
              </label>
              <select value={frequency} onChange={e => setFrequency(e.target.value)}
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', outline: 'none', background: 'white' }}>
                <option value="">Sélectionner...</option>
                <option value="Une fois">Une fois</option>
                <option value="Deux fois">Deux fois</option>
                <option value="Trois fois ou plus">Trois fois ou plus</option>
                <option value="Tous les jours">Tous les jours</option>
              </select>
            </div>
          )}

          {/* ÉTAPE 4 — Personnes */}
        {step === 4 && (
          <div>
            <h2 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Personnes impliquées</h2>
            <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
              Indique les personnes soupçonnées — cette information est confidentielle
            </p>

            {/* Champ de recherche */}
            <div style={{ position: 'relative', marginBottom: '16px' }}>
              <input
                type="text"
                value={suspectInput}
                onChange={e => handleSuspectSearch(e.target.value)}
                placeholder="Rechercher par nom ou prénom..."
                style={{
                  width: '100%', padding: '12px 16px',
                  border: '2px solid #e0e0e0', borderRadius: '8px',
                  fontSize: '14px', outline: 'none', boxSizing: 'border-box',
                }}
                onFocus={e => e.target.style.borderColor = '#0f3460'}
                onBlur={e => e.target.style.borderColor = '#e0e0e0'}
              />

              {/* Suggestions */}
              {suspectSuggestions.length > 0 && (
                <div style={{
                  position: 'absolute', top: '100%', left: 0, right: 0,
                  background: 'white', borderRadius: '8px', zIndex: 10,
                  boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid #e0e0e0',
                }}>
                  {suspectSuggestions.map(s => (
                    <div key={s.id} onClick={() => addSuspect(s)}
                      style={{ padding: '12px 16px', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #f0f0f0' }}
                      onMouseEnter={e => (e.currentTarget.style.background = '#f0f4ff')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'white')}>
                      <span style={{ fontWeight: 600 }}>{s.firstName} {s.lastName}</span>
                      <span style={{ color: '#888', fontSize: '12px', marginLeft: '8px' }}>({s.role})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Ajouter nom libre */}
            {suspectInput.length >= 2 && suspectSuggestions.length === 0 && !searchingUsers && (
              <button onClick={() => addSuspect({ firstName: suspectInput, lastName: '' })}
                style={{ padding: '8px 16px', background: '#f0f4ff', border: '1px solid #0f3460', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#0f3460', marginBottom: '16px' }}>
                + Ajouter "{suspectInput}" comme soupçonné
              </button>
            )}

            {/* Liste des soupçonnés ajoutés */}
            {suspects.length > 0 && (
              <div style={{ marginTop: '16px' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>
                  Soupçonnés ajoutés :
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                  {suspects.map((s, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '8px',
                      background: '#f0f4ff', padding: '6px 12px', borderRadius: '20px',
                      fontSize: '13px', color: '#0f3460',
                    }}>
                      <span>{s.firstName} {s.lastName}</span>
                      <span onClick={() => removeSuspect(i)}
                        style={{ cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>×</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {suspects.length === 0 && (
              <p style={{ fontSize: '13px', color: '#aaa', textAlign: 'center', marginTop: '16px' }}>
                Aucun soupçonné ajouté — tu peux passer cette étape
              </p>
            )}
          </div>
        )}

          {/* ÉTAPE 5 — Preuves */}
          {step === 5 && (
            <div>
              <h2 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Preuves</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Photos, captures d'écran, etc.</p>
              <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '16px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
                🚧 Cette fonctionnalité sera disponible prochainement
              </div>
            </div>
          )}

          {/* ÉTAPE 6 — Validation */}
          {step === 6 && (
            <div>
              <h2 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Validation</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Vérifie et envoie ton signalement</p>
              <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '16px', marginBottom: '20px', fontSize: '14px' }}>
                <p><strong>Qui signale :</strong> {whoSignals}</p>
                <p><strong>Type :</strong> {type}</p>
                <p><strong>Description :</strong> {description}</p>
                <p><strong>Fréquence :</strong> {frequency}</p>
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', marginBottom: '20px' }}>
                <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)}
                  style={{ width: '18px', height: '18px' }} />
                <span><strong>Signalement anonyme</strong> — mon nom ne sera pas visible</span>
              </label>
            </div>
          )}

          {/* Boutons navigation */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
            <button onClick={() => setStep(s => s - 1)}
              style={{ padding: '12px 24px', background: 'white', border: '2px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#333', }}>
              Précédent
            </button>
            {step < 6 ? (
              <button onClick={() => setStep(s => s + 1)}
                disabled={
                  (step === 1 && !whoSignals) ||
                  (step === 2 && !type) ||
                  (step === 3 && (!description || !frequency))
                }
                style={{
                  padding: '12px 24px', borderRadius: '8px', fontSize: '14px', fontWeight: 600,
                  border: 'none', cursor: 'pointer',
                  background: (step === 1 && !whoSignals) || (step === 2 && !type) || (step === 3 && (!description || !frequency)) ? '#ccc' : '#0f3460',
                  color: 'white', 
                }}>
                Suivant →
              </button>
            ) : (
              <button onClick={handleSubmit} disabled={loading}
                style={{ padding: '12px 24px', background: loading ? '#ccc' : '#22c55e', color: 'white', border: 'none', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '14px', fontWeight: 600 }}>
                {loading ? 'Envoi...' : 'Envoyer le signalement ✓'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
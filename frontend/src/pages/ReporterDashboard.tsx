import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createReport, searchUsers } from '../services/api';

export default function ReporterDashboard() {
  const { user, logoutUser } = useAuth();
  const [step, setStep] = useState(0);

  const [whoSignals, setWhoSignals] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [, setResult] = useState<any>(null);
  const [suspects, setSuspects] = useState<any[]>([]);
  const [suspectInput, setSuspectInput] = useState('');
  const [suspectSuggestions, setSuspectSuggestions] = useState<any[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [victimName, setVictimName] = useState('');
  const [victimInput, setVictimInput] = useState('');
  const [victimSuggestions, setVictimSuggestions] = useState<any[]>([]);
  const [selectedVictim, setSelectedVictim] = useState<any>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const title = `${type} - ${whoSignals}`;
      const victimInfo = victimName ? ` | Victime : ${victimName}` : '';
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
        '',
      );
      setResult(report);
      setStep(7);
    } catch (err) {
      console.error('Erreur envoi signalement');
    } finally {
      setLoading(false);
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

  const roleLabel = user?.role === 'teacher' ? 'Professeur' : 'Personnel du collège';

  // PAGE ACCUEIL
  if (step === 0) return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: 'Segoe UI, sans-serif' }}>
      <div style={{ background: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontWeight: 800, fontSize: '20px', color: '#0f3460' }}>Signalement</span>
          <span style={{ fontWeight: 800, fontSize: '20px', color: '#1a1a2e' }}>Collège</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '12px', background: '#f0f4ff', color: '#0f3460', padding: '4px 10px', borderRadius: '12px', fontWeight: 600 }}>{roleLabel}</span>
          <span style={{ fontSize: '14px', color: '#666' }}>{user?.firstName} {user?.lastName}</span>
          <button onClick={logoutUser} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #ddd', borderRadius: '8px', cursor: 'pointer', fontSize: '13px' }}>
            Déconnexion
          </button>
        </div>
      </div>

      <div style={{ background: 'linear-gradient(135deg, #e8f0fe, #f0f4ff)', padding: '48px 32px', textAlign: 'center' }}>
        <div style={{ maxWidth: '600px', margin: '0 auto' }}>
          <p style={{ color: '#0f3460', fontSize: '13px', fontWeight: 600, marginBottom: '12px' }}>
            Collège Jeanne d'Arc — Dispositif anti-harcèlement
          </p>
          <h1 style={{ fontSize: '28px', fontWeight: 800, color: '#1a1a2e', marginBottom: '12px', lineHeight: 1.3 }}>
            Vous êtes témoin d'une situation de harcèlement ?
          </h1>
          <p style={{ color: '#0f3460', fontSize: '15px', marginBottom: '32px' }}>
            Signalez-le en 5 minutes. Anonymat possible. Notre équipe intervient sous 24h.
          </p>
          <button onClick={() => setStep(1)} style={{
            padding: '14px 32px', background: '#0f3460', color: 'white',
            border: 'none', borderRadius: '8px', fontSize: '15px',
            fontWeight: 600, cursor: 'pointer',
          }}>
            Faire un signalement
          </button>
        </div>
      </div>

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
    </div>
  );

  // PAGE CONFIRMATION
  if (step === 7) return (
    <div style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: 'Segoe UI, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: 'white', borderRadius: '16px', padding: '40px', maxWidth: '500px', width: '100%', margin: '20px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', textAlign: 'center' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
        <h2 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Signalement transmis</h2>
        <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
          Votre signalement a bien été reçu. L'équipe de direction en sera informée dans les plus brefs délais.
        </p>
        <div style={{ background: '#f0f4ff', borderRadius: '8px', padding: '16px', marginBottom: '24px', textAlign: 'left' }}>
          <p style={{ fontSize: '13px', color: '#444', margin: 0 }}>
            ✉️ Un accusé de réception vous a été envoyé. Vous n'avez pas accès au suivi du dossier — celui-ci est géré directement par l'administration.
          </p>
        </div>
        <button onClick={() => { setStep(0); setResult(null); setType(''); setDescription(''); setFrequency(''); setWhoSignals(''); setVictimName(''); setSuspects([]); }}
          style={{ padding: '12px 24px', background: '#0f3460', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600 }}>
          Retour à l'accueil
        </button>
      </div>
    </div>
  );

  // FORMULAIRE
  const steps = ['Qui signale', 'Type', 'Faits', 'Personnes', 'Preuves', 'Validation'];

  return (
    <main style={{ minHeight: '100vh', background: '#f5f7fa', fontFamily: 'Segoe UI, sans-serif' }}>
      <div style={{ background: 'white', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 1px 4px rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span style={{ fontWeight: 800, fontSize: '20px', color: '#0f3460' }}>Signalement</span>
          <span style={{ fontWeight: 800, fontSize: '20px', color: '#1a1a2e' }}>Collège</span>
        </div>
        <button onClick={() => setStep(0)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#666' }}>
          Annuler
        </button>
      </div>

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

      <div style={{ maxWidth: '600px', margin: '32px auto', padding: '0 20px' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '32px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>

          {step === 1 && (
            <div>
              <h2 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Qui signale ?</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Sélectionne ta situation</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {user?.role === 'teacher' ? (
                  <div onClick={() => setWhoSignals('Je signale en tant que professeur')} style={{
                    padding: '16px', borderRadius: '8px', cursor: 'pointer',
                    border: `2px solid ${whoSignals === 'Je signale en tant que professeur' ? '#0f3460' : '#e0e0e0'}`,
                    background: whoSignals === 'Je signale en tant que professeur' ? '#f0f4ff' : 'white',
                    fontSize: '14px', fontWeight: whoSignals === 'Je signale en tant que professeur' ? 600 : 400,
                  }}>
                    Je signale en tant que professeur
                  </div>
                ) : (
                  <div onClick={() => setWhoSignals('Je signale en tant que personnel du collège')} style={{
                    padding: '16px', borderRadius: '8px', cursor: 'pointer',
                    border: `2px solid ${whoSignals === 'Je signale en tant que personnel du collège' ? '#0f3460' : '#e0e0e0'}`,
                    background: whoSignals === 'Je signale en tant que personnel du collège' ? '#f0f4ff' : 'white',
                    fontSize: '14px', fontWeight: whoSignals === 'Je signale en tant que personnel du collège' ? 600 : 400,
                  }}>
                    Je signale en tant que personnel du collège
                  </div>
                )}
              </div>
            </div>
          )}

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

          {step === 3 && (
            <div>
              <h2 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Décris les faits</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Explique ce que vous avez observé</p>
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
                style={{ width: '100%', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', outline: 'none', background: 'white', color: '#333' }}>
                <option value="">Sélectionner...</option>
                <option value="Une fois">Une fois</option>
                <option value="Deux fois">Deux fois</option>
                <option value="Trois fois ou plus">Trois fois ou plus</option>
                <option value="Tous les jours">Tous les jours</option>
              </select>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Personnes impliquées</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>
                Indique la victime et les personnes soupçonnées — cette information est confidentielle
              </p>

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

              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600, fontSize: '14px', color: '#333' }}>
                Soupçonné(s)
              </label>
              <div style={{ position: 'relative', marginBottom: '16px' }}>
                <input
                  type="text"
                  value={suspectInput}
                  onChange={e => handleSuspectSearch(e.target.value)}
                  placeholder="Rechercher par nom ou prénom..."
                  style={{ width: '100%', padding: '12px 16px', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '14px', outline: 'none', boxSizing: 'border-box' }}
                />
                {suspectSuggestions.length > 0 && (
                  <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: 'white', borderRadius: '8px', zIndex: 10, boxShadow: '0 4px 20px rgba(0,0,0,0.12)', border: '1px solid #e0e0e0' }}>
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

              {suspectInput.length >= 2 && suspectSuggestions.length === 0 && !searchingUsers && (
                <button onClick={() => addSuspect({ firstName: suspectInput, lastName: '' })}
                  style={{ padding: '8px 16px', background: '#f0f4ff', border: '1px solid #0f3460', borderRadius: '8px', cursor: 'pointer', fontSize: '13px', color: '#0f3460', marginBottom: '16px' }}>
                  + Ajouter "{suspectInput}" comme soupçonné
                </button>
              )}

              {suspects.length > 0 && (
                <div style={{ marginTop: '8px' }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#333', marginBottom: '8px' }}>Soupçonnés ajoutés :</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {suspects.map((s, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f0f4ff', padding: '6px 12px', borderRadius: '20px', fontSize: '13px', color: '#0f3460' }}>
                        <span>{s.firstName} {s.lastName}</span>
                        <span onClick={() => removeSuspect(i)} style={{ cursor: 'pointer', color: '#dc2626', fontWeight: 700 }}>×</span>
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

          {step === 5 && (
            <div>
              <h2 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Preuves</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Photos, captures d'écran, etc.</p>
              <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '16px', fontSize: '14px', color: '#666', textAlign: 'center' }}>
                🚧 Cette fonctionnalité sera disponible prochainement
              </div>
            </div>
          )}

          {step === 6 && (
            <div>
              <h2 style={{ color: '#1a1a2e', marginBottom: '8px' }}>Validation</h2>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '24px' }}>Vérifiez et envoyez votre signalement</p>
              <div style={{ background: '#f9f9f9', borderRadius: '8px', padding: '16px', marginBottom: '20px', fontSize: '14px' }}>
                <p><strong>Qui signale :</strong> {whoSignals}</p>
                <p><strong>Type :</strong> {type}</p>
                <p><strong>Description :</strong> {description}</p>
                <p><strong>Fréquence :</strong> {frequency}</p>
                {victimName && <p><strong>Victime :</strong> {victimName}</p>}
                {suspects.length > 0 && <p><strong>Soupçonnés :</strong> {suspects.map(s => `${s.firstName} ${s.lastName}`).join(', ')}</p>}
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '14px', marginBottom: '20px' }}>
                <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)}
                  style={{ width: '18px', height: '18px' }} />
                <span><strong>Signalement anonyme</strong> — mon nom ne sera pas visible</span>
              </label>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px' }}>
            <button onClick={() => setStep(s => s - 1)}
              style={{ padding: '12px 24px', background: 'white', border: '2px solid #e0e0e0', borderRadius: '8px', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#333' }}>
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
    </main>
  );
}
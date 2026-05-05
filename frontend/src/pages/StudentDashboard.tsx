import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { createReport, searchUsers, getReports, getNotifications, markNotificationRead, getNotes, getStudentParents} from '../services/api';
import { SEVERITY_BADGES, SEVERITY_COLORS, severityFromApiGrade } from '../utils/severity';
import Button from '../components/Button';
import Card from '../components/Card';
import StepBar from '../components/StepBar';
import Autocomplete from '../components/Autocomplete';
import Badge from '../components/Badge';
import type { Report, Note, UserSearchResult, BadgeVariant } from '../types';

type StudentSection = 'report' | 'dossiers' | 'profile' | 'workshop' | 'quiz';

function statusToBadgeVariant(status: string): BadgeVariant {
  const map: Record<string, BadgeVariant> = {
    pending: 'pending', in_progress: 'in_progress',
    escalated: 'escalated', closed: 'closed', rejected: 'rejected',
  };
  return map[status] ?? 'default';
}

export default function StudentDashboard() {
  const { user, logoutUser } = useAuth();
  const [viewSection, setViewSection] = useState<StudentSection>('report');
  const [step, setStep] = useState(1);

  const [whoSignals, setWhoSignals] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Report | null>(null);
  const [suspects, setSuspects] = useState<UserSearchResult[]>([]);
  const [suspectInput, setSuspectInput] = useState('');
  const [suspectSuggestions, setSuspectSuggestions] = useState<UserSearchResult[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [myReports, setMyReports] = useState<Report[]>([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [victimName, setVictimName] = useState('');
  const [notifications, setNotifications] = useState<Note[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [victimInput, setVictimInput] = useState('');
  const [victimSuggestions, setVictimSuggestions] = useState<UserSearchResult[]>([]);
  const [selectedVictim, setSelectedVictim] = useState<UserSearchResult | null>(null);
  const [reportNotes, setReportNotes] = useState<Record<string, any[]>>({});
  const [parents, setParents] = useState<any[]>([]);
  const [loadingParents, setLoadingParents] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const title = `${type} - ${whoSignals}`;
      const victimInfo = whoSignals === 'Je suis témoin' && victimName ? ` | Victime : ${victimName}` : '';
      const fullDescription = `${description} (Fréquence: ${frequency})${victimInfo}`;
      const suspectsData = suspects.map(s => ({
        userId: s.id || undefined,
        freeText: s.id ? undefined : `${s.firstName} ${s.lastName}`,
      }));
      const report = await createReport(title, fullDescription, isAnonymous, suspectsData, frequency, user?.studentProfile?.schoolClass || '');
      setResult(report);
      setStep(7);
    } catch (err) {
      console.error('Erreur envoi signalement', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchReportNotes = async (reportId: string) => {
    try {
      const data = await getNotes(reportId);
      setReportNotes(prev => ({ ...prev, [reportId]: data }));
    } catch (err) {
      console.error('Erreur chargement notes', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications();
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.isRead).length);
    } catch (err) {
      console.error('Erreur notifications', err);
    }
  };

  const fetchMyReports = async () => {
    setLoadingReports(true);
    try {
      const data = await getReports();
      setMyReports(data);
      data.forEach((r: any) => fetchReportNotes(r.id));
    } catch (err) {
      console.error('Erreur chargement dossiers', err);
    } finally {
      setLoadingReports(false);
    }
  };

  const handleSuspectSearch = async (value: string) => {
    setSuspectInput(value);
    if (value.length < 2) { setSuspectSuggestions([]); return; }
    setSearchingUsers(true);
    try {
      setSuspectSuggestions(await searchUsers(value));
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

  const removeSuspect = (index: number) => setSuspects(suspects.filter((_, i) => i !== index));

  const resetForm = () => {
    setStep(1);
    setType('');
    setDescription('');
    setFrequency('');
    setWhoSignals('');
    setVictimName('');
    setVictimInput('');
    setSelectedVictim(null);
    setSuspects([]);
    setIsAnonymous(false);
    setResult(null);
  };

   const fetchParents = async () => {
    if (!user?.id) return;
    setLoadingParents(true);
    try {
      const data = await getStudentParents(user.id);
      setParents(data);
    } catch {
      setParents([]);
    } finally {
      setLoadingParents(false);
    }
  };


  useEffect(() => {
    if (user) fetchNotifications();
  }, [user?.id]);

  useEffect(() => {
   if (user) { fetchNotifications(); fetchParents(); }
 }, [user?.id]);


  // ── Header commun ──────────────────────────────────────────────────────────
  const Header = () => {
    const navItems: { key: StudentSection; label: string }[] = [
      { key: 'profile',   label: 'Mon profil' },
      { key: 'report',    label: 'Faire un signalement' },
      { key: 'dossiers',  label: 'Suivre mes dossiers' },
      { key: 'workshop',  label: 'Ateliers' },
      { key: 'quiz',      label: 'Quiz' },
    ];

    return (
      <header>
        {/* Topbar */}
        <div className="px-8 py-2 bg-surface flex items-center">
          <div className="flex-1" />
          <span className="text-gray-800 font-bold text-sm">
            Espace Élève — {user?.firstName} {user?.lastName?.toUpperCase()}
          </span>
          <div className="flex-1 flex justify-end items-center gap-3">
            {/* Cloche notifications */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg cursor-pointer text-base relative"
                aria-label="Notifications"
              >
                🔔
                {unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-10 bg-white rounded-xl shadow-xl w-80 z-50 max-h-96 overflow-y-auto border border-gray-100">
                  <div className="px-4 py-3 border-b border-gray-100 font-bold text-sm">
                    Notifications {unreadCount > 0 && <span className="text-red-600">({unreadCount} non lues)</span>}
                  </div>
                  {notifications.length === 0 ? (
                    <p className="p-5 text-gray-400 text-sm text-center">Aucune notification</p>
                  ) : notifications.map((n: any) => (
                    <div
                      key={n.id}
                      onClick={async () => { await markNotificationRead(n.id); fetchNotifications(); }}
                      className={`px-4 py-3 border-b border-gray-50 cursor-pointer ${n.isRead ? 'bg-white' : 'bg-surface'}`}
                    >
                      <p className="text-sm text-gray-700 m-0 mb-1">{n.message}</p>
                      <p className="text-xs text-gray-400 m-0">
                        {new Date(n.createdAt).toLocaleDateString('fr-FR')} à {new Date(n.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <Button variant="outline" onClick={logoutUser}>Se déconnecter</Button>
          </div>
        </div>

        {/* Navbar */}
        <nav className="bg-primary px-8 py-4 flex items-center gap-8" aria-label="Navigation élève">
          <img src="/logos/safeschool-logo.png" alt="SafeSchool" className="h-8" />
          {navItems.map(item => (
            <button
              key={item.key}
              onClick={() => {
                setViewSection(item.key);
                if (item.key === 'dossiers') { fetchMyReports(); }
                if (item.key === 'report') { resetForm(); }
              }}
              aria-current={viewSection === item.key ? 'page' : undefined}
              className={`font-bold text-sm transition-opacity ${
                viewSection === item.key
                  ? 'text-white underline underline-offset-4'
                  : 'text-white/80 hover:text-white'
              }`}
            >
              {item.key === 'dossiers' && unreadCount > 0
                ? `${item.label} (${unreadCount})`
                : item.label}
            </button>
          ))}
        </nav>
      </header>
    );
  };

  // ── Section profil ─────────────────────────────────────────────────────────
  if (viewSection === 'profile') return (
    <>
      <Header />
      <main className="max-w-xl mx-auto mt-8 px-5 pb-10">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Mon profil</h2>

        {/* Informations personnelles */}
        <Card className="mb-4">
          <h3 className="text-primary font-bold text-sm mb-4">👤 Informations personnelles</h3>
          <table className="w-full text-sm">
            <tbody>
              {[
                { label: 'Prénom',       value: user?.firstName },
                { label: 'Nom',          value: user?.lastName },
                { label: 'Email',        value: user?.email },
                { label: 'Classe',       value: user?.studentProfile?.schoolClass ?? '—' },
                { label: 'Date de naissance', value: user?.studentProfile?.dateOfBirth ?? '—' },
              ].map(row => (
                <tr key={row.label} className="border-b border-gray-100">
                  <td className="py-2 text-gray-400 font-semibold w-2/5">{row.label}</td>
                  <td className="py-2 text-gray-700">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>

        {/* Parents */}
        <Card>
          <h3 className="text-primary font-bold text-sm mb-4">👨‍👩‍👧 Parents / Responsables légaux</h3>
          {loadingParents ? (
            <p className="text-gray-400 text-sm text-center py-4">Chargement...</p>
          ) : parents.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-4">Aucun parent enregistré</p>
          ) : (
            <div className="flex flex-col gap-4">
              {parents.map((parent: any, i: number) => (
                <div key={parent.id} className="bg-gray-50 rounded-lg p-4">
                  <p className="font-semibold text-gray-800 mb-2">
                    Parent {i + 1} — {parent.firstName} {parent.lastName}
                  </p>
                  <table className="w-full text-sm">
                    <tbody>
                      {[
                        { label: 'Email',     value: parent.email },
                        { label: 'Téléphone', value: parent.phone ?? '—' },
                        { label: 'Adresse',   value: parent.address ?? '—' },
                      ].map(row => (
                        <tr key={row.label} className="border-b border-gray-100">
                          <td className="py-1.5 text-gray-400 font-semibold w-2/5">{row.label}</td>
                          <td className="py-1.5 text-gray-700">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </Card>
      </main>
    </>
  );

  // ── Section ateliers ───────────────────────────────────────────────────────
  if (viewSection === 'workshop') return (
    <>
      <Header />
      <main className="p-8 max-w-xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Ateliers</h2>
        <p className="text-gray-500 mt-2">Cette section sera disponible prochainement.</p>
      </main>
    </>
  );

  // ── Section quiz ───────────────────────────────────────────────────────────
  if (viewSection === 'quiz') return (
    <>
      <Header />
      <main className="p-8 max-w-xl mx-auto">
        <h2 className="text-2xl font-bold mb-2">Quiz</h2>
        <p className="text-gray-500 mt-2">Cette section sera disponible prochainement.</p>
      </main>
    </>
  );

  // ── Section suivi dossiers ─────────────────────────────────────────────────
  if (viewSection === 'dossiers') return (
    <>
      <Header />
      <main className="max-w-xl mx-auto mt-8 px-5 pb-10">
        <h2 className="text-gray-800 font-bold text-2xl mb-2">Mes dossiers</h2>
        <p className="text-gray-500 text-sm mb-6">Suivi de vos signalements en cours</p>

        {loadingReports ? (
          <p className="text-center py-10 text-gray-400">Chargement...</p>
        ) : myReports.length === 0 ? (
          <Card className="text-center">
            <p className="text-gray-400 text-sm">Aucun signalement trouvé</p>
          </Card>
        ) : (
          <div className="flex flex-col gap-3">
            {myReports
              .filter((report: any) => !report.title.includes('Je suis témoin'))
              .map((report: any) => {
                const severity = severityFromApiGrade(report.grade);
                return (
                  <div
                    key={report.id}
                    className="bg-white rounded-xl px-6 py-5 shadow-sm"
                    style={{ borderLeft: `4px solid ${SEVERITY_COLORS[severity]}` }}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-sm text-primary">{report.caseNumber}</span>
                          <span className="text-white text-xs px-3 py-0.5 rounded-full" style={{ background: SEVERITY_COLORS[severity] }}>
                            {SEVERITY_BADGES[severity]}
                          </span>
                        </div>
                        <div className="text-sm text-gray-700 font-semibold mb-1">{report.title}</div>
                        <div className="text-xs text-gray-400">📅 {new Date(report.createdAt).toLocaleDateString('fr-FR')}</div>
                      </div>
                      <Badge variant={statusToBadgeVariant(report.status)} />
                    </div>

                    {report.adminNote && (
                      <div className="mt-3 bg-surface rounded-lg px-4 py-2 text-sm text-gray-600">
                        💬 <strong>Note de l'administration :</strong> {report.adminNote}
                      </div>
                    )}

                    {reportNotes[report.id]?.filter((n: any) => n.type === 'convocation').map((note: any) => {
                      const MONTHS_FR: Record<string, number> = {
                        'janvier':1,'février':2,'mars':3,'avril':4,'mai':5,'juin':6,
                        'juillet':7,'août':8,'septembre':9,'octobre':10,'novembre':11,'décembre':12
                      };
                      const match = note.content.match(/Rendez-vous le (\d{2}) (\w+) (\d{4}) à (\d{2})h(\d{2})/);
                      let isPast = true;
                      let displayDate = '';
                      let message = note.content;

                      if (match) {
                        const [, day, monthStr, year, hours, minutes] = match;
                        const monthNum = MONTHS_FR[monthStr.toLowerCase()];
                        const yearNum = Number(year);
                        if (monthNum && yearNum >= 2020 && yearNum <= 2100) {
                          const rdvDate = new Date(yearNum, monthNum - 1, Number(day), Number(hours), Number(minutes));
                          isPast = rdvDate < new Date();
                          displayDate = `${String(day).padStart(2,'0')}/${String(monthNum).padStart(2,'0')}/${year} à ${hours}h${minutes}`;
                          const msgMatch = note.content.match(/Rendez-vous le .+?\. (.+)/s);
                          message = msgMatch ? msgMatch[1] : '';
                        }
                      }

                      return (
                        <div
                          key={note.id}
                          className={`mt-3 rounded-lg px-4 py-2 text-sm ${isPast ? 'bg-gray-50' : 'bg-surface'}`}
                          style={{ borderLeft: `3px solid ${isPast ? '#ccc' : '#7c3aed'}` }}
                        >
                          {!displayDate ? (
                            <span className="text-primary">📅 Convocation : {note.content}</span>
                          ) : isPast ? (
                            <span className="text-gray-400">📋 Un rendez-vous a eu lieu le <strong>{displayDate}</strong></span>
                          ) : (
                            <span className="text-primary">📅 Convocation : Vous êtes convoqué(e) le <strong>{displayDate}</strong>{message ? ` — ${message}` : ''}</span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })}
          </div>
        )}
      </main>
    </>
  );

  // ── Confirmation envoi ─────────────────────────────────────────────────────
  if (step === 7) return (
    <>
      <Header />
      <main className="bg-gray-50 font-sans flex items-center justify-center min-h-[80vh]">
        <Card className="max-w-md w-full mx-5 text-center">
          <div className="text-5xl mb-4">✅</div>
          <h2 className="text-gray-800 font-bold text-xl mb-2">Signalement envoyé</h2>
          <p className="text-gray-500 text-sm mb-6">Votre signalement a bien été reçu et sera traité dans les meilleurs délais.</p>
          {result && whoSignals === 'Je suis victime' && (
            <div className="bg-surface rounded-lg p-4 mb-6 text-left">
              <p className="text-xs text-gray-400 mb-1">Numéro de dossier</p>
              <p className="text-2xl font-bold text-primary mb-1">{result.caseNumber}</p>
              <p className="text-xs text-gray-400">Conservez ce numéro pour suivre l'avancement</p>
            </div>
          )}
          {result && whoSignals !== 'Je suis victime' && (
            <div className="bg-surface rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600">✉️ Votre signalement a bien été transmis à l'administration. Merci pour votre vigilance.</p>
            </div>
          )}
          <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
            <p className="font-semibold text-sm mb-3">Prochaines étapes</p>
            {['Un référent vous est assigné sous 24h', 'Un entretien sera organisé', 'Vous serez informé(e) des mesures prises'].map((s, i) => (
              <div key={i} className="flex gap-2 items-start mb-2 text-sm text-gray-600">
                <span className="bg-primary text-white rounded-full w-5 h-5 flex items-center justify-center text-xs shrink-0">{i + 1}</span>
                {s}
              </div>
            ))}
          </div>
          <Button onClick={() => { resetForm(); setViewSection('report'); }}>Retour à l'accueil</Button>
        </Card>
      </main>
    </>
  );

  // ── Formulaire multi-étapes ────────────────────────────────────────────────
  const steps = ['Qui signale', 'Type', 'Faits', 'Personnes', 'Preuves', 'Validation'];
  const isNextDisabled =
    (step === 1 && !whoSignals) ||
    (step === 2 && !type) ||
    (step === 3 && (!description || !frequency));

  return (
    <>
      <Header />
      <StepBar steps={steps} currentStep={step} />
      <div className="max-w-xl mx-auto mt-8 px-5 pb-10">
        <Card>

          {/* Étape 1 : Qui signale */}
          {step === 1 && (
           <fieldset>
            <legend className="text-gray-800 font-bold text-lg mb-6">Sélectionne ta situation</legend>
              <div className="flex flex-col gap-3">
                {['Je suis victime', 'Je suis témoin'].map(option => (
                  <button
                    key={option}
                    onClick={() => setWhoSignals(option)}
                    className={`px-4 py-4 rounded-lg cursor-pointer text-sm text-left transition-all border-2 ${
                      whoSignals === option ? 'border-primary bg-surface font-semibold' : 'border-gray-200 bg-white'
                    }`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Étape 2 : Type */}
          {step === 2 && (
            <fieldset>
              <legend className="text-gray-800 font-bold text-lg mb-2">Quel type de harcèlement ?</legend>
              <p className="text-gray-500 text-sm mb-6">Sélectionne le type qui correspond le mieux</p>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: 'Physique',          sub: 'Coups, bousculades', icon: '✋' },
                  { label: 'Verbal',            sub: 'Insultes, moqueries', icon: '💬' },
                  { label: 'Cyber',             sub: 'Réseaux, SMS', icon: '📱' },
                  { label: 'Exclusion sociale', sub: "Mise à l'écart", icon: '🚫' },
                  { label: 'Sexuel',            sub: 'Gestes, remarques', icon: '⚠️' },
                  { label: 'Autre',             sub: 'Décrire ci-dessous', icon: '...' },
                ].map(t => (
                  <button
                    key={t.label}
                    onClick={() => setType(t.label)}
                    className={`px-4 py-4 rounded-lg cursor-pointer text-center transition-all border-2 ${
                      type === t.label ? 'border-primary bg-surface' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="text-2xl mb-1">{t.icon}</div>
                    <div className="text-sm font-semibold text-gray-800">{t.label}</div>
                    <div className="text-xs text-gray-400">{t.sub}</div>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* Étape 3 : Faits */}
          {step === 3 && (
            <div>
              <h2 className="text-gray-800 font-bold text-lg mb-2">Décris les faits</h2>
              <p className="text-gray-500 text-sm mb-6">Explique ce qui s'est passé</p>
              {whoSignals === 'Je suis témoin' && (
                <div className="mb-5">
                  <label className="block mb-2 text-sm font-semibold text-gray-700">Nom de la victime</label>
                  <Autocomplete
                    value={victimInput}
                    onChange={async val => {
                      setVictimInput(val);
                      setSelectedVictim(null);
                      setVictimName(val);
                      if (val.length >= 2) setVictimSuggestions(await searchUsers(val));
                      else setVictimSuggestions([]);
                    }}
                    suggestions={victimSuggestions}
                    onSelect={s => {
                      setSelectedVictim(s);
                      setVictimName(`${s.firstName} ${s.lastName}`);
                      setVictimInput(`${s.firstName} ${s.lastName}`);
                      setVictimSuggestions([]);
                    }}
                    placeholder="Rechercher par nom ou prénom..."
                    label="Nom de la victime"
                  />
                  {selectedVictim && (
                    <p className="mt-2 bg-green-50 px-3 py-1 rounded-lg text-sm text-green-500 inline-block">
                      ✅ {selectedVictim.firstName} {selectedVictim.lastName} sélectionné(e)
                    </p>
                  )}
                </div>
              )}
              <textarea
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder="Décris ce qui s'est passé, quand, où et qui était impliqué..."
                rows={5}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none resize-y font-[inherit] box-border mb-5"
              />
              <label className="block mb-2 text-sm font-semibold text-gray-700">Fréquence des actes</label>
              <select
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-700"
              >
                <option value="">Sélectionner...</option>
                <option value="Une fois">Une fois</option>
                <option value="Deux fois">Deux fois</option>
                <option value="Trois fois ou plus">Trois fois ou plus</option>
                <option value="Tous les jours">Tous les jours</option>
              </select>
            </div>
          )}

          {/* Étape 4 : Personnes */}
          {step === 4 && (
            <div>
              <h2 className="text-gray-800 font-bold text-lg mb-2">Personnes impliquées</h2>
              <p className="text-gray-500 text-sm mb-6">Indique les personnes soupçonnées — cette information est confidentielle</p>
              <Autocomplete
                value={suspectInput}
                onChange={handleSuspectSearch}
                suggestions={suspectSuggestions}
                onSelect={addSuspect}
                placeholder="Rechercher par nom ou prénom..."
                label="Soupçonnés"
              />
              {suspectInput.length >= 2 && suspectSuggestions.length === 0 && !searchingUsers && (
                <Button variant="outline" onClick={() => addSuspect({ firstName: suspectInput, lastName: '' })} className="mt-3">
                  + Ajouter "{suspectInput}" comme soupçonné
                </Button>
              )}
              {suspects.length > 0 ? (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Soupçonnés ajoutés :</p>
                  <div className="flex flex-wrap gap-2">
                    {suspects.map((s, i) => (
                      <div key={i} className="flex items-center gap-2 bg-surface px-3 py-1 rounded-full text-sm text-primary">
                        <span>{s.firstName} {s.lastName}</span>
                        <button onClick={() => removeSuspect(i)} className="text-red-500 font-bold cursor-pointer bg-transparent border-none">×</button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-300 text-center mt-4">Aucun soupçonné ajouté — tu peux passer cette étape</p>
              )}
            </div>
          )}

          {/* Étape 5 : Preuves */}
          {step === 5 && (
            <div>
              <h2 className="text-gray-800 font-bold text-lg mb-2">Preuves</h2>
              <p className="text-gray-500 text-sm mb-6">Photos, captures d'écran, etc.</p>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-400 text-center">
                🚧 Cette fonctionnalité sera disponible prochainement
              </div>
            </div>
          )}

          {/* Étape 6 : Validation */}
          {step === 6 && (
            <div>
              <h2 className="text-gray-800 font-bold text-lg mb-2">Validation</h2>
              <p className="text-gray-500 text-sm mb-6">Vérifie et envoie ton signalement</p>
              <dl className="bg-gray-50 rounded-lg p-4 mb-5 text-sm space-y-2">
                {[
                  { label: 'Qui signale', value: whoSignals },
                  { label: 'Type',        value: type },
                  { label: 'Description', value: description },
                  { label: 'Fréquence',   value: frequency },
                ].map(row => (
                  <div key={row.label} className="flex gap-2">
                    <dt className="font-semibold text-gray-700 min-w-[120px]">{row.label} :</dt>
                    <dd className="text-gray-600">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <label className="flex items-center gap-3 cursor-pointer text-sm mb-5">
                <input type="checkbox" checked={isAnonymous} onChange={e => setIsAnonymous(e.target.checked)} className="w-4 h-4" />
                <span><strong>Signalement anonyme</strong> — mon nom ne sera pas visible</span>
              </label>
            </div>
          )}

          {/* Boutons navigation */}
          <div className="flex justify-between mt-8">
            <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 1}>
              ← Précédent
            </Button>
            {step < 6 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={isNextDisabled}>
                Suivant →
              </Button>
            ) : (
              <Button variant="success" onClick={handleSubmit} disabled={loading}>
                {loading ? 'Envoi...' : 'Envoyer le signalement ✓'}
              </Button>
            )}
          </div>

        </Card>
      </div>
    </>
  );
}

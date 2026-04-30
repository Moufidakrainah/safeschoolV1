import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { createReport, searchUsers } from '../services/api';
import Button from '../components/Button';
import Card from '../components/Card';
import StepBar from '../components/StepBar';
import Autocomplete from '../components/Autocomplete';
import ReporterHeader from '../components/layout/ReporterHeader/ReporterHeader';
import type { UserSearchResult } from '../types';

// ─── ReporterDashboard ────────────────────────────────────────────────────────

export default function ReporterDashboard() {
  const { user, logoutUser } = useAuth();
  const { t } = useTranslation();
  const [step, setStep] = useState(1);

  const [whoSignals, setWhoSignals] = useState('');
  const [type, setType] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suspects, setSuspects] = useState<UserSearchResult[]>([]);
  const [suspectInput, setSuspectInput] = useState('');
  const [suspectSuggestions, setSuspectSuggestions] = useState<UserSearchResult[]>([]);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [victimName, setVictimName] = useState('');
  const [victimInput, setVictimInput] = useState('');
  const [victimSuggestions, setVictimSuggestions] = useState<UserSearchResult[]>([]);
  const [selectedVictim, setSelectedVictim] = useState<UserSearchResult | null>(null);
  const [viewSection, setViewSection] = useState<'profile' | 'report' | 'workshop' | 'quiz'>('report');

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
      await createReport(title, fullDescription, isAnonymous, suspectsData, frequency, '');
      setStep(7);
    // } catch {
    //   console.error('Erreur envoi signalement');
      } catch (err) {
    console.error('Erreur envoi signalement', err); // ← ajoute err ici
    } finally {
      setLoading(false);
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
  };

  const headerProps = {
	user,
	logoutUser,
	viewSection,
	setViewSection,
	};


  // ── Formulaire multi-étapes ───────────────────────────────────────────────────
  const steps = [
    t('reporter.steps.who'),
    t('reporter.steps.type'),
    t('reporter.steps.facts'),
    t('reporter.steps.people'),
    t('reporter.steps.evidence'),
    t('reporter.steps.validate'),
  ];

  const isNextDisabled =
    (step === 1 && !whoSignals) ||
    (step === 2 && !type) ||
    (step === 3 && (!description || !frequency));

  const whoOptions = user?.role === 'teacher'
    ? [{ value: t('reporter.step1.teacher'), label: t('reporter.step1.teacher') }]
    : [{ value: t('reporter.step1.staff'),   label: t('reporter.step1.staff') }];

  const typeOptions = [
    { label: t('reporter.step2.physical'),  sub: t('reporter.step2.physicalSub'),  icon: '✋' },
    { label: t('reporter.step2.verbal'),    sub: t('reporter.step2.verbalSub'),    icon: '💬' },
    { label: t('reporter.step2.cyber'),     sub: t('reporter.step2.cyberSub'),     icon: '📱' },
    { label: t('reporter.step2.exclusion'), sub: t('reporter.step2.exclusionSub'), icon: '🚫' },
    { label: t('reporter.step2.sexual'),    sub: t('reporter.step2.sexualSub'),    icon: '⚠️' },
    { label: t('reporter.step2.other'),     sub: t('reporter.step2.otherSub'),     icon: '...' },
  ];



	// ── Navigation entre les sections ─────────────────────────────────────────────
	if (viewSection === 'profile') {
	return (
		<>
		<ReporterHeader {...headerProps} />
		<main className="p-8 max-w-xl mx-auto">
			<h2 className="text-2xl font-bold mb-4">{t('reporter.profile.title')}</h2>

			<div className="bg-white shadow rounded-lg p-6 space-y-4">
			<p><strong>{t('reporter.profile.firstName')} :</strong> {user?.firstName}</p>
			<p><strong>{t('reporter.profile.lastName')} :</strong> {user?.lastName}</p>
			<p><strong>{t('reporter.profile.email')} :</strong> {user?.email}</p>
			<p><strong>{t('reporter.profile.role')} :</strong> {user?.role}</p>
			</div>
		</main>
		</>
	);
	}

	if (viewSection === 'workshop') {
	return (
		<>
		<ReporterHeader {...headerProps} />
		<main className="p-8">
			<h2 className="text-2xl font-bold">{t('reporter.workshop.title')}</h2>
			<p className="text-gray-600 mt-2">{t('reporter.workshop.soon')}</p>
		</main>
		</>
	);
	}

	if (viewSection === 'quiz') {
	return (
		<>
		<ReporterHeader {...headerProps} />
		<main className="p-8">
			<h2 className="text-2xl font-bold">{t('reporter.quiz.title')}</h2>
			<p className="text-gray-600 mt-2">{t('reporter.quiz.soon')}</p>
		</main>
		</>
	);
	}




  if (viewSection === 'report') 
  {
	
  return (
	<>

	<ReporterHeader {...headerProps} />


    <main className="bg-gray-50 font-sans">
      
	
      <StepBar steps={steps} currentStep={step} />

      <div className="max-w-xl mx-auto mt-8 px-5 pb-10">
        <Card>

          {/* ── Étape 1 : Qui signale ── */}
          {step === 1 && (
            <fieldset>
              <legend className="text-gray-800 font-bold text-lg mb-2">{t('reporter.step1.title')}</legend>
              <p className="text-gray-500 text-sm mb-6">{t('reporter.step1.subtitle')}</p>
              <div className="flex flex-col gap-3">
                {whoOptions.map(opt => (
                  <button
                    key={opt.value}
                    role="radio"
                    aria-checked={whoSignals === opt.value}
                    onClick={() => setWhoSignals(opt.value)}
                    className={`px-4 py-4 rounded-lg cursor-pointer text-sm text-left transition-all border-2 ${
                      whoSignals === opt.value
                        ? 'border-primary bg-surface font-semibold'
                        : 'border-gray-200 bg-white font-normal'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* ── Étape 2 : Type ── */}
          {step === 2 && (
            <fieldset>
              <legend className="text-gray-800 font-bold text-lg mb-2">{t('reporter.step2.title')}</legend>
              <p className="text-gray-500 text-sm mb-6">{t('reporter.step2.subtitle')}</p>
              <div className="grid grid-cols-2 gap-3" role="radiogroup">
                {typeOptions.map(opt => (
                  <button
                    key={opt.label}
                    role="radio"
                    aria-checked={type === opt.label}
                    onClick={() => setType(opt.label)}
                    className={`px-4 py-4 rounded-lg cursor-pointer text-center transition-all border-2 ${
                      type === opt.label
                        ? 'border-primary bg-surface'
                        : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="text-2xl mb-1" role="img" aria-hidden="true">{opt.icon}</div>
                    <div className="text-sm font-semibold text-gray-800">{opt.label}</div>
                    <div className="text-xs text-gray-400">{opt.sub}</div>
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {/* ── Étape 3 : Faits ── */}
          {step === 3 && (
            <div>
              <h2 className="text-gray-800 font-bold text-lg mb-2">{t('reporter.step3.title')}</h2>
              <p className="text-gray-500 text-sm mb-6">{t('reporter.step3.subtitle')}</p>
              <label className="block mb-1 text-sm font-semibold text-gray-700" htmlFor="description">
                {t('reporter.step3.descriptionLabel')}
              </label>
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('reporter.step3.descriptionPlaceholder')}
                rows={5}
                aria-required="true"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none resize-y font-[inherit] box-border mb-5"
              />
              <label className="block mb-2 text-sm font-semibold text-gray-700" htmlFor="frequency">
                {t('reporter.step3.frequencyLabel')}
              </label>
              <select
                id="frequency"
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                aria-required="true"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none bg-white text-gray-700"
              >
                <option value="">{t('reporter.step3.frequencyPlaceholder')}</option>
                <option value="Une fois">{t('reporter.step3.freq1')}</option>
                <option value="Deux fois">{t('reporter.step3.freq2')}</option>
                <option value="Trois fois ou plus">{t('reporter.step3.freq3')}</option>
                <option value="Tous les jours">{t('reporter.step3.freq4')}</option>
              </select>
            </div>
          )}

          {/* ── Étape 4 : Personnes ── */}
          {step === 4 && (
            <div>
              <h2 className="text-gray-800 font-bold text-lg mb-2">{t('reporter.step4.title')}</h2>
              <p className="text-gray-500 text-sm mb-6">{t('reporter.step4.subtitle')}</p>

              {/* Victime */}
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                {t('reporter.step4.victimLabel')}
              </label>
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
                placeholder={t('reporter.step4.searchPlaceholder')}
                label={t('reporter.step4.victimLabel')}
              />
              {selectedVictim && (
                <p className="mt-2 bg-green-50 px-3 py-1 rounded-lg text-sm text-green-500 inline-block" role="status">
                  ✅ {selectedVictim.firstName} {selectedVictim.lastName} {t('reporter.step4.selected')}
                </p>
              )}

              {/* Soupçonnés */}
              <label className="block mt-5 mb-2 text-sm font-semibold text-gray-700">
                {t('reporter.step4.suspectsLabel')}
              </label>
              <Autocomplete
                value={suspectInput}
                onChange={handleSuspectSearch}
                suggestions={suspectSuggestions}
                onSelect={addSuspect}
                placeholder={t('reporter.step4.searchPlaceholder')}
                label={t('reporter.step4.suspectsLabel')}
              />

              {suspectInput.length >= 2 && suspectSuggestions.length === 0 && !searchingUsers && (
                <Button
                  variant="outline"
                  onClick={() => addSuspect({ firstName: suspectInput, lastName: '' })}
                  className="mt-3"
                >
                  + {t('reporter.step4.addFreeText')} "{suspectInput}"
                </Button>
              )}

              {suspects.length > 0 ? (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">{t('reporter.step4.suspectsAdded')}</p>
                  <div className="flex flex-wrap gap-2" role="list" aria-label={t('reporter.step4.suspectsAdded')}>
                    {suspects.map((s, i) => (
                      <div
                        key={i}
                        role="listitem"
                        className="flex items-center gap-2 bg-surface px-3 py-1 rounded-full text-sm text-primary"
                      >
                        <span>{s.firstName} {s.lastName}</span>
                        <button
                          onClick={() => removeSuspect(i)}
                          aria-label={`${t('reporter.step4.removeSuspect')} ${s.firstName} ${s.lastName}`}
                          className="text-red-500 font-bold cursor-pointer bg-transparent border-none"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-300 text-center mt-4">{t('reporter.step4.noSuspect')}</p>
              )}
            </div>
          )}

          {/* ── Étape 5 : Preuves ── */}
          {step === 5 && (
            <div>
              <h2 className="text-gray-800 font-bold text-lg mb-2">{t('reporter.step5.title')}</h2>
              <p className="text-gray-500 text-sm mb-6">{t('reporter.step5.subtitle')}</p>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-400 text-center">
                🚧 {t('reporter.step5.soon')}
              </div>
            </div>
          )}

          {/* ── Étape 6 : Validation ── */}
          {step === 6 && (
            <div>
              <h2 className="text-gray-800 font-bold text-lg mb-2">{t('reporter.step6.title')}</h2>
              <p className="text-gray-500 text-sm mb-6">{t('reporter.step6.subtitle')}</p>
              <dl className="bg-gray-50 rounded-lg p-4 mb-5 text-sm space-y-2">
                {([
                  { label: t('reporter.step6.who'),         value: whoSignals },
                  { label: t('reporter.step6.type'),        value: type },
                  { label: t('reporter.step6.description'), value: description },
                  { label: t('reporter.step6.frequency'),   value: frequency },
                  ...(victimName ? [{ label: t('reporter.step6.victim'), value: victimName }] : []),
                  ...(suspects.length > 0 ? [{ label: t('reporter.step6.suspects'), value: suspects.map(s => `${s.firstName} ${s.lastName}`).join(', ') }] : []),
                ] as const).map(row => (
                  <div key={row.label} className="flex gap-2">
                    <dt className="font-semibold text-gray-700 min-w-[120px]">{row.label} :</dt>
                    <dd className="text-gray-600">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <label className="flex items-center gap-3 cursor-pointer text-sm mb-5">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={e => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4"
                  aria-label={t('reporter.step6.anonymous')}
                />
                <span>
                  <strong>{t('reporter.step6.anonymous')}</strong> — {t('reporter.step6.anonymousDesc')}
                </span>
              </label>
            </div>
          )}

		{/* // ── Page confirmation ───────────────────────────────────────────────────────── */}
		{step <= 6 && (
		<div className="flex justify-between mt-8">
			<Button
			variant="ghost"
			onClick={() => setStep(s => s - 1)}
			disabled={step === 1}
			>
			← {t('common.previous')}
			</Button>

			{step < 6 ? (
			<Button
				onClick={() => setStep(s => s + 1)}
				disabled={isNextDisabled}
			>
				{t('common.next')} →
			</Button>
			) : (
			<Button
				variant="success"
				onClick={handleSubmit}
				disabled={loading}
			>
				{loading ? t('reporter.submitting') : `${t('reporter.submit')} ✓`}
			</Button>
			)}
		</div>
		)}

		{step === 7 &&  (
			<div className="bg-gray-50 font-sans flex items-center justify-center">
			<Card className="max-w-md w-full mx-5 text-center">
				<div className="text-5xl mb-4" role="img" aria-label={t('reporter.success.iconLabel')}>✅</div>
				<h2 className="text-gray-800 font-bold text-xl mb-2">{t('reporter.success.title')}</h2>
				<p className="text-gray-500 text-sm mb-6">{t('reporter.success.message')}</p>
				<div className="bg-surface rounded-lg p-4 mb-6 text-left">
				<p className="text-sm text-gray-600">{t('reporter.success.notice')}</p>
				</div>
				<Button onClick={resetForm}>{t('reporter.success.back')}</Button>
			</Card>
			</div>
			// </>
		)}

        </Card>
      </div>
    </main>
	  </>
  );

  }
}
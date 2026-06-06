import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useStudentReportForm } from '../../hooks/useStudentReportForm';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import StepBar from '../StepBar';
import Autocomplete from '../Autocomplete';
import type { AuthUser } from '../../types';

interface StudentFormProps {
  user: AuthUser | null;
}

export default function StudentForm({ user }: StudentFormProps) {
  const { t } = useTranslation();

  const typeOptions = [
    { label: 'Physique',          value: 'physique',   sub: t('reporter.step2.physicalSub')  },
    { label: 'Verbal',            value: 'verbal',     sub: t('reporter.step2.verbalSub')    },
    { label: 'Cyber',             value: 'cyber',      sub: t('reporter.step2.cyberSub')     },
    { label: 'Exclusion sociale', value: 'exclusion',  sub: t('reporter.step2.exclusionSub') },
    { label: 'Sexuel',            value: 'sexuel',     sub: t('reporter.step2.sexualSub')    },
  ];

  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  const {
    step, setStep,
    whoSignals, setWhoSignals,
    type, setType,
    description, setDescription,
    frequency, setFrequency,
    isAnonymous, setIsAnonymous,
    loading, submitError,
    showErrors, setShowErrors,
    isNextDisabled,
    suspects, suspectInput, searchingUsers,
    victimName,
    victimInput, setVictimInput,
    selectedVictim, setSelectedVictim, setVictimName,
    handleSubmit, handleSuspectSearch,
    addSuspect, removeSuspect, resetForm,
  } = useStudentReportForm(user?.role, t);

  const steps = [
    'Qui signale',
    t('reporter.steps.type'),
    t('reporter.steps.facts'),
    t('reporter.steps.people'),
    t('reporter.steps.evidence'),
    t('reporter.steps.validate'),
  ];

  useEffect(() => {
    const index = typeOptions.findIndex(o => o.value === type);
    if (index >= 0) cardRefs.current[index]?.focus();
  }, [type]);

  // Écran de confirmation
  if (step === 7) {
    return (
      <main className="bg-gray-50 font-sans">
        <h1 className="sr-only">{t('reporter.title.reportCreated')}</h1>
        <StepBar steps={steps} currentStep={step} />
        <div className="max-w-xl mx-auto mt-8 px-5 pb-10">
          <Card className="max-w-md w-full mx-5 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h2 className="text-gray-800 font-bold text-xl mb-2">{t('reporter.success.title')}</h2>
            <p className="text-gray-500 text-sm mb-6">{t('reporter.success.message')}</p>
            <div className="bg-surface rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600">{t('reporter.success.notice')}</p>
            </div>
            <Button onClick={resetForm}>{t('reporter.success.back')}</Button>
          </Card>
        </div>
      </main>
    );
  }

  return (

    <section className="page-section">

		<div className="bg-surface shadow-sm rounded-sm px-6 py-8 mb-3 flex flex-col items-center gap-3">



    {/* <main className="bg-gray-50 font-sans"> */}
      <h1 className="sr-only">{t('reporter.title.createAReport')}</h1>
      <StepBar steps={steps} currentStep={step} />
      <div className="w-full mt-8">
        <div>

          {/* Étape 1 : Victime ou témoin */}
          {step === 1 && (
            <fieldset>
              <legend className="text-gray-800 font-bold text-lg mb-2">
                Tu signales en tant que ?
              </legend>
              <p className="text-gray-500 text-sm mb-6">Sélectionne ta situation</p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setWhoSignals('victime')}
                  className={`px-4 py-6 rounded-lg cursor-pointer text-center transition-all border-2 ${
                    whoSignals === 'victime' ? 'border-primary bg-surface' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-800">Je suis la victime</div>
                  <div className="text-xs text-gray-400 mt-1">Le harcèlement me vise directement</div>
                </button>
                <button
                  onClick={() => setWhoSignals('temoin')}
                  className={`px-4 py-6 rounded-lg cursor-pointer text-center transition-all border-2 ${
                    whoSignals === 'temoin' ? 'border-primary bg-surface' : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-800">Je suis témoin</div>
                  <div className="text-xs text-gray-400 mt-1">J'ai été témoin de harcèlement</div>
                </button>
              </div>
              {showErrors && !whoSignals && (
                <p role="alert" className="mt-3 text-sm text-red-600">⚠️ Veuillez choisir votre situation</p>
              )}
            </fieldset>
          )}

          {/* Étape 2 : Type de harcèlement */}
          {step === 2 && (
            <fieldset>
              <legend className="text-gray-800 font-bold text-lg mb-2">{t('reporter.step2.title')}</legend>
              <p className="text-gray-500 text-sm mb-6">{t('reporter.step2.subtitle')}</p>
              <div role="radiogroup" aria-label={t('reporter.step2.title')} className="grid grid-cols-2 gap-3">
                {typeOptions.map((opt, index) => (
                  <div
                    key={opt.value}
                    ref={el => (cardRefs.current[index] = el)}
                    role="radio"
                    aria-checked={type === opt.value}
                    tabIndex={type === opt.value ? 0 : -1}
                    onClick={() => setType(opt.value)}
                    onKeyDown={(e) => {
                      const currentIndex = typeOptions.findIndex(o => o.value === type);
                      const fallbackIndex = currentIndex === -1 ? 0 : currentIndex;
                      if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); setType(opt.value); }
                      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { e.preventDefault(); setType(typeOptions[(fallbackIndex + 1) % typeOptions.length].value); }
                      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { e.preventDefault(); setType(typeOptions[(fallbackIndex - 1 + typeOptions.length) % typeOptions.length].value); }
                    }}
                    className={`px-4 py-4 rounded-lg cursor-pointer text-center transition-all border-2 outline-none ${
                      type === opt.value ? 'border-primary bg-surface' : 'border-gray-200 bg-white'
                    } focus-visible:ring-2 focus-visible:ring-primary`}
                  >
                    <div className="text-sm font-semibold text-gray-800">{opt.label}</div>
                    <div className="text-xs text-gray-400">{opt.sub}</div>
                  </div>
                ))}
              </div>
              {showErrors && !type && (
                <p role="alert" className="mt-3 text-sm text-red-600">⚠️ {t('reporter.validation.typeRequired')}</p>
              )}
            </fieldset>
          )}

          {/* Étape 3 : Description + fréquence */}
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
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary resize-y font-[inherit] box-border mb-1"
              />
              {showErrors && !description && (
                <p role="alert" className="mb-4 text-sm text-red-600">⚠️ {t('reporter.validation.descriptionRequired')}</p>
              )}
              <label className="block mb-2 mt-4 text-sm font-semibold text-gray-700" htmlFor="frequency">
                {t('reporter.step3.frequencyLabel')}
              </label>
              <select
                id="frequency"
                value={frequency}
                onChange={e => setFrequency(e.target.value)}
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary bg-white text-gray-700"
              >
                <option value="">{t('reporter.step3.frequencyPlaceholder')}</option>
                <option value="Une fois">{t('reporter.step3.freq1')}</option>
                <option value="Deux fois">{t('reporter.step3.freq2')}</option>
                <option value="Trois fois ou plus">{t('reporter.step3.freq3')}</option>
                <option value="Tous les jours">{t('reporter.step3.freq4')}</option>
              </select>
              {showErrors && !frequency && (
                <p role="alert" className="mt-2 text-sm text-red-600">⚠️ {t('reporter.validation.frequencyRequired')}</p>
              )}
            </div>
          )}

          {/* Étape 4 : Victime et suspects */}
          {step === 4 && (
            <div>
              <h2 className="text-gray-800 font-bold text-lg mb-2">{t('reporter.step4.title')}</h2>
              <p className="text-gray-500 text-sm mb-6">{t('reporter.step4.subtitle')}</p>

              {/* Victimes — saisie libre, plusieurs possibles */}
              <>
                <label className="block mb-2 text-sm font-semibold text-gray-700">
                  {whoSignals === 'victime' ? 'Autres victimes (optionnel)' : t('reporter.step4.victimLabel')}
                </label>
                {whoSignals === 'victime' && (
                  <p className="text-xs text-gray-400 mb-2">Tu es déjà enregistré(e) comme victime. Tu peux ajouter d'autres victimes si besoin.</p>
                )}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={victimInput}
                    onChange={e => setVictimInput(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && victimInput.trim()) {
                        e.preventDefault();
                        setVictimName(prev => prev ? prev + '|' + victimInput.trim() : victimInput.trim());
                        setVictimInput('');
                      }
                    }}
                    placeholder="Ex: Prénom Nom - Classe"
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      if (victimInput.trim()) {
                        setVictimName(prev => prev ? prev + '|' + victimInput.trim() : victimInput.trim());
                        setVictimInput('');
                      }
                    }}
                    disabled={!victimInput.trim()}
                  >
                    + Ajouter
                  </Button>
                </div>
                <p className="text-xs text-gray-400 mt-1">Appuie sur Entrée ou clique sur Ajouter</p>
                {victimName && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {victimName.split('|').map((v, i) => (
                      <div key={i} className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-full text-sm text-blue-600">
                        <span>{v}</span>
                        <button
                          onClick={() => {
                            const arr = victimName.split('|').filter((_, idx) => idx !== i);
                            setVictimName(arr.join('|'));
                          }}
                          className="text-red-500 font-bold bg-transparent border-none cursor-pointer"
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-5" />
              </>

              {/* Suspects — saisie libre uniquement, pas d'autocomplete */}
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                {t('reporter.step4.suspectsLabel')}
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={suspectInput}
                  onChange={e => { const { setSuspectInput } = {} as any; handleSuspectSearch(e.target.value); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' && suspectInput.trim()) {
                      e.preventDefault();
                      addSuspect({ firstName: suspectInput.trim(), lastName: '' });
                    }
                  }}
                  placeholder="Ex: Prénom Nom - Classe"
                  className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                />
                <Button
                  variant="outline"
                  onClick={() => { if (suspectInput.trim()) addSuspect({ firstName: suspectInput.trim(), lastName: '' }); }}
                  disabled={!suspectInput.trim()}
                >
                  + Ajouter
                </Button>
              </div>
              <p className="text-xs text-gray-400 mt-1">Appuie sur Entrée ou clique sur Ajouter</p>
              {suspects.length > 0 ? (
                <div className="mt-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">{t('reporter.step4.suspectsAdded')}</p>
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
                <p className="text-sm text-gray-300 text-center mt-4">{t('reporter.step4.noSuspect')}</p>
              )}
            </div>
          )}

          {/* Étape 5 : Preuves */}
          {step === 5 && (
            <div>
              <h2 className="text-gray-800 font-bold text-lg mb-2">{t('reporter.step5.title')}</h2>
              <p className="text-gray-500 text-sm mb-6">{t('reporter.step5.subtitle')}</p>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-400 text-center">
                🚧 {t('reporter.step5.soon')}
              </div>
            </div>
          )}

          {/* Étape 6 : Récapitulatif */}
          {step === 6 && (
            <div>
              <h2 className="text-gray-800 font-bold text-lg mb-2">{t('reporter.step6.title')}</h2>
              <p className="text-gray-500 text-sm mb-6">{t('reporter.step6.subtitle')}</p>
              <dl className="bg-gray-50 rounded-lg p-4 mb-5 text-sm space-y-2">
                {([
                  { label: 'Situation',                value: whoSignals === 'victime' ? 'Je suis la victime' : 'Je suis témoin' },
                  { label: t('reporter.step6.type'),   value: type        },
                  { label: t('reporter.step6.description'), value: description },
                  { label: t('reporter.step6.frequency'),   value: frequency   },
                  ...(victimName ? [{ label: 'Victime(s)', value: victimName.split('|').join(', ') }] : []),
                  ...(suspects.length > 0 ? [{ label: t('reporter.step6.suspects'), value: suspects.map(s => `${s.firstName} ${s.lastName}`).join(', ') }] : []),
                ] as const).map(row => (
                  <div key={row.label} className="flex gap-2">
                    <dt className="font-semibold text-gray-700 min-w-[120px]">{row.label} :</dt>
                    <dd className="text-gray-600 wrap-break-word min-w-0">{row.value}</dd>
                  </div>
                ))}
              </dl>
              <label className="flex items-center gap-3 cursor-pointer text-sm mb-5">
                <input
                  type="checkbox"
                  checked={isAnonymous}
                  onChange={e => setIsAnonymous(e.target.checked)}
                  className="w-4 h-4"
                />
                <span><strong>{t('reporter.step6.anonymous')}</strong> — {t('reporter.step6.anonymousDesc')}</span>
              </label>
              {submitError && (
                <div role="alert" className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-2">
                  <span>⚠️</span>{submitError}
                </div>
              )}
            </div>
          )}

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <Button variant="ghost" onClick={() => { setShowErrors(false); setStep(s => s - 1); }} disabled={step === 1}>
              ← {t('common.previous')}
            </Button>
            {step < 6 ? (
              <Button onClick={() => {
                if (isNextDisabled) { setShowErrors(true); return; }
                setShowErrors(false);
                setStep(s => s + 1);
              }}>
                {t('common.next')} →
              </Button>
            ) : (
              <Button variant="success" onClick={handleSubmit} disabled={loading}>
                {loading ? t('reporter.submitting') : `${t('reporter.submit')} ✓`}
              </Button>
            )}
          </div>

        </div>
      </div>
    {/* </main> */}
      </div>

    </section>
  );
}

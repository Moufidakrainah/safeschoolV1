/**
 * ReporterForm — formulaire multi-étapes de signalement.
 *
 * Gère :
 *   - L'état et la logique du formulaire (via le hook useReportForm)
 *   - Les 5 étapes du formulaire + l'écran de confirmation (step 6)
 *   - La navigation entre étapes (Précédent / Suivant / Envoyer)
 *   - La validation inline (messages d'erreur sous les champs)
 *
 * Reçoit uniquement `user` en prop (pour le rôle et les options de traduction).
 */

import { useEffect, useRef, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useReportForm } from '../../hooks/useReportForm';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import StepBar from '../StepBar';
import Autocomplete from '../Autocomplete';
import type { AuthUser } from '../../types';

// ─── Types ──────────────────────────────────────────────────────────────────


interface ReporterFormProps {
  user: AuthUser | null;
}

// ─── Composant ──────────────────────────────────────────────────────────────

export default function ReporterForm({ user }: ReporterFormProps) {
  const { t } = useTranslation();

  // Tout l'état et les handlers du formulaire viennent du hook personnalisé.
  const {
    step, setStep,
    type, setType,
    description, setDescription,
    frequency, setFrequency,
    whoSignals,
    isAnonymous, setIsAnonymous,
    loading,
    submitError,
    showErrors, setShowErrors,
    isNextDisabled,
    suspects,
    suspectInput,
    suspectSuggestions,
    searchingUsers,
    victimName,
    victimInput, setVictimInput,
    victimSuggestions, setVictimSuggestions,
    selectedVictim, setSelectedVictim, setVictimName,
    handleSubmit,
    handleSuspectSearch,
    handleVictimSearch,
    addSuspect,
    removeSuspect,
    resetForm,
  } = useReportForm(user?.role, t);

  // Labels des étapes affichés dans la StepBar.
  const steps = [
    t('reporter.steps.type'),
    t('reporter.steps.facts'),
    t('reporter.steps.people'),
    t('reporter.steps.evidence'),
    t('reporter.steps.validate'),
  ];

  // typeOptions : les 6 types de harcèlement avec icône et sous-titre.
  const typeOptions = useMemo(() => [
      { label: t('reporter.step2.physical'),  sub: t('reporter.step2.physicalSub'),  icon: '✋' },
      { label: t('reporter.step2.verbal'),    sub: t('reporter.step2.verbalSub'),    icon: '💬' },
      { label: t('reporter.step2.cyber'),     sub: t('reporter.step2.cyberSub'),     icon: '📱' },
      { label: t('reporter.step2.exclusion'), sub: t('reporter.step2.exclusionSub'), icon: '🚫' },
      { label: t('reporter.step2.sexual'),    sub: t('reporter.step2.sexualSub'),    icon: '⚠️' },
      { label: t('reporter.step2.other'),     sub: t('reporter.step2.otherSub'),     icon: '...' },
  ], [t]);
  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);

  useEffect(() => {
    const index = typeOptions.findIndex(o => o.label === type);
    if (index >= 0) {
      cardRefs.current[index]?.focus();
    }
  }, [type, typeOptions]);

  // ── Écran de confirmation (step 6) ──────────────────────────────────────
  if (step === 6) {
    return (
      <main className="bg-gray-50 font-sans">
        <h1 className="sr-only">{t('reporter.title.reportCreated')}</h1>
        <StepBar steps={steps} currentStep={step} />
        <div className="max-w-xl mx-auto mt-8 px-5 pb-10">
          <Card className="max-w-md w-full mx-5 text-center p-6 shadow-sm">
            <div className="text-5xl mb-4" role="img" aria-label={t('reporter.success.iconLabel')}>✅</div>
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

  // ── Formulaire multi-étapes (steps 1 à 5) ───────────────────────────────
  return (
    <main className="bg-gray-50 font-sans">
      <h1 className="sr-only">{t('reporter.title.createAReport')}</h1>
      <StepBar steps={steps} currentStep={step} />
      <div className="max-w-xl mx-auto mt-8 px-5 pb-10">
        <Card className="p-6 shadow-sm">

          {/* Étape 1 : Type de harcèlement */}
          {step === 1 && (
            <fieldset>
              <legend className="text-gray-800 font-bold text-lg mb-2">{t('reporter.step2.title')}</legend>
              <p className="text-gray-500 text-sm mb-6">{t('reporter.step2.subtitle')}</p>
              <div
                role="radiogroup"
                aria-label={t('reporter.step2.title')}
                className="grid grid-cols-1 sm:grid-cols-2 gap-3"
              >
                {typeOptions.map((opt, index) => (
                  <button
                    key={opt.label}
                    ref={el => { cardRefs.current[index] = el; }}
                    role="radio"
                    aria-checked={type === opt.label}
                    tabIndex={type === opt.label ? 0 : -1}
                    onClick={() => setType(opt.label)}
                    onKeyDown={e => {
                      const current = typeOptions.findIndex(o => o.label === type);
                      const fallback = current === -1 ? 0 : current;
                      if (e.key === ' ' || e.key === 'Enter') {
                        e.preventDefault();
                        setType(opt.label);
                      }
                      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
                        e.preventDefault();
                        setType(typeOptions[(fallback + 1) % typeOptions.length].label);
                      }
                      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
                        e.preventDefault();
                        setType(typeOptions[(fallback - 1 + typeOptions.length) % typeOptions.length].label);
                      }
                    }}
                    className={`px-4 py-4 rounded-lg cursor-pointer text-center transition-all border-2 outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                      type === opt.label ? 'border-primary bg-surface' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="text-2xl mb-1" aria-hidden="true">{opt.icon}</div>
                    <div className="text-sm font-semibold text-gray-800">{opt.label}</div>
                    <div className="text-xs text-gray-400">{opt.sub}</div>
                  </button>
                ))}
              </div>
              {/* Erreur si l'utilisateur tente d'avancer sans choisir */}
              {showErrors && !type && (
                <p role="alert" className="mt-3 text-sm text-red-600">⚠️ {t('reporter.validation.typeRequired')}</p>
              )}
            </fieldset>
          )}

          {/* Étape 2 : Description des faits + fréquence */}
          {step === 2 && (
            <div>
              <h2 className="text-gray-800 font-bold text-lg mb-2">{t('reporter.step3.title')}</h2>
              <p className="text-gray-500 text-sm mb-6">{t('reporter.step3.subtitle')}</p>
              <label className="block mb-1 text-sm font-semibold text-gray-700" htmlFor="description">
                {t('reporter.step3.descriptionLabel')}
              </label>
              <Textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('reporter.step3.descriptionPlaceholder')}
                rows={5}
                aria-required="true"
                className="resize-y mb-1"
              />
              {showErrors && !description && (
                <p role="alert" className="mb-4 text-sm text-red-600">⚠️ {t('reporter.validation.descriptionRequired')}</p>
              )}
              <label className="block mb-2 mt-4 text-sm font-semibold text-gray-700" htmlFor="frequency">
                {t('reporter.step3.frequencyLabel')}
              </label>
              <Select value={frequency} onValueChange={v => setFrequency(v)}>
                <SelectTrigger id="frequency" aria-required="true">
                  <SelectValue placeholder={t('reporter.step3.frequencyPlaceholder')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Une fois">{t('reporter.step3.freq1')}</SelectItem>
                  <SelectItem value="Deux fois">{t('reporter.step3.freq2')}</SelectItem>
                  <SelectItem value="Trois fois ou plus">{t('reporter.step3.freq3')}</SelectItem>
                  <SelectItem value="Tous les jours">{t('reporter.step3.freq4')}</SelectItem>
                </SelectContent>
              </Select>
              {showErrors && !frequency && (
                <p role="alert" className="mt-2 text-sm text-red-600">{t('reporter.validation.frequencyRequired')}</p>
              )}
            </div>
          )}

          {/* Étape 3 : Victime et suspects */}
          {step === 3 && (
            <div>
              <h2 className="text-gray-800 font-bold text-lg mb-2">{t('reporter.step4.title')}</h2>
              <p className="text-gray-500 text-sm mb-6">{t('reporter.step4.subtitle')}</p>

              {/* Victime */}
              <label className="block mb-2 text-sm font-semibold text-gray-700">
                {t('reporter.step4.victimLabel')}
              </label>
              <Autocomplete
                value={victimInput}
                onChange={handleVictimSearch}
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

              {/* Suspects */}
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
                      <div key={i} role="listitem" className="flex items-center gap-2 bg-surface px-3 py-1 rounded-full text-sm text-primary">
                        <span>{s.firstName} {s.lastName}</span>
                        <button
                          onClick={() => removeSuspect(i)}
                          aria-label={`${t('reporter.step4.removeSuspect')} ${s.firstName} ${s.lastName}`}
                          className="text-red-500 font-bold cursor-pointer bg-transparent border-none"
                        >×</button>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-300 text-center mt-4">{t('reporter.step4.noSuspect')}</p>
              )}
            </div>
          )}

          {/* Étape 4 : Preuves (à venir) */}
          {step === 4 && (
            <div>
              <h2 className="text-gray-800 font-bold text-lg mb-2">{t('reporter.step5.title')}</h2>
              <p className="text-gray-500 text-sm mb-6">{t('reporter.step5.subtitle')}</p>
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-400 text-center">
                🚧 {t('reporter.step5.soon')}
              </div>
            </div>
          )}

          {/* Étape 5 : Récapitulatif + envoi */}
          {step === 5 && (
            <div>
              <h2 className="text-gray-800 font-bold text-lg mb-2">{t('reporter.step6.title')}</h2>
              <p className="text-gray-500 text-sm mb-6">{t('reporter.step6.subtitle')}</p>
              <dl className="bg-gray-50 rounded-lg p-4 mb-5 text-sm space-y-2">
                {([
                  { label: t('reporter.step6.who'),         value: whoSignals  },
                  { label: t('reporter.step6.type'),        value: type        },
                  { label: t('reporter.step6.description'), value: description },
                  { label: t('reporter.step6.frequency'),   value: frequency   },
                  ...(victimName ? [{ label: t('reporter.step6.victim'), value: victimName }] : []),
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
                  aria-label={t('reporter.step6.anonymous')}
                />
                <span>
                  <strong>{t('reporter.step6.anonymous')}</strong> — {t('reporter.step6.anonymousDesc')}
                </span>
              </label>
              {/* Bandeau d'erreur si la soumission précédente a échoué */}
              {submitError && (
                <div
                  role="alert"
                  className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-2"
                >
                  <span aria-hidden="true">⚠️</span>
                  {submitError}
                </div>
              )}
            </div>
          )}

          {/* Boutons de navigation entre étapes */}
          <div className="flex justify-between mt-8">
            <Button
              variant="ghost"
              onClick={() => { setShowErrors(false); setStep(s => s - 1); }}
              disabled={step === 1}
            >
              ← {t('common.previous')}
            </Button>
            {step < 5 ? (
              <Button onClick={() => {
                // Si les champs requis sont vides, afficher les erreurs sans avancer.
                if (isNextDisabled) { setShowErrors(true); return; }
                setShowErrors(false);
                setStep(s => s + 1);
              }}
                disabled={isNextDisabled}
                >
                {t('common.next')} →
              </Button>
            ) : (
              <Button onClick={handleSubmit} variant="success" disabled={loading}>
                {loading ? t('reporter.submitting') : `${t('reporter.submit')} ✓`}
              </Button>
            )}
          </div>

        </Card>
      </div>
    </main>
  );
}

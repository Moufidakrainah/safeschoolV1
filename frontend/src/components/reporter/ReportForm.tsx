/**
 * ReportForm — formulaire multi-étapes de signalement.
 *
 * Gère en autonomie :
 *   - L'état et la logique du formulaire (via le hook useReportForm)
 *   - Les 5 étapes du formulaire + l'écran de confirmation (step 6)
 *   - La navigation entre étapes (Précédent / Suivant / Envoyer)
 *   - La validation inline (messages d'erreur sous les champs)
 *
 * Reçoit uniquement `user` en prop (pour le rôle et les options de traduction).
 */


import { useEffect, useState, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useReportForm } from '../../hooks/useReportForm';
import Button from '../Button';
import Card from '../Card';
import StepBar from '../StepBar';
import Autocomplete from '../Autocomplete';
import type { AuthUser } from '../../types';

// ─── Types ──────────────────────────────────────────────────────────────────

interface ReportFormProps {
  user: AuthUser | null;
}

// ─── Composant ──────────────────────────────────────────────────────────────



export default function ReportForm({ user }: ReportFormProps) {
  const { t } = useTranslation();




const typeOptions = [
      { label: t('reporter.step2.physical'),  sub: t('reporter.step2.physicalSub'), },
      { label: t('reporter.step2.verbal'),    sub: t('reporter.step2.verbalSub'),     },
      { label: t('reporter.step2.cyber'),     sub: t('reporter.step2.cyberSub'),      },
      { label: t('reporter.step2.exclusion'), sub: t('reporter.step2.exclusionSub'),  },
      { label: t('reporter.step2.sexual'),    sub: t('reporter.step2.sexualSub'),    },
      { label: t('reporter.step2.other'),     sub: t('reporter.step2.otherSub'),     },
];


const [typeInput, setTypeInput] = useState("");
const [filteredTypes, setFilteredTypes] = useState(typeOptions);
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






const handleTypeSearch = (value: string) => {
  setTypeInput(value);
  setFilteredTypes(
    typeOptions.filter(opt =>
      opt.label.toLowerCase().includes(value.toLowerCase())
    )
  );
};



const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

useEffect(() => {
  const index = typeOptions.findIndex(o => o.label === type);
  if (index >= 0) {
    cardRefs.current[index]?.focus();
  }
}, [type]);



  // ── Écran de confirmation (step 6) ──────────────────────────────────────
  if (step === 6) {
    return (
      <main className="bg-gray-50 font-sans">
    <h1 className="sr-only">{t('reporter.title.reportCreated')}</h1>


        <StepBar steps={steps} currentStep={step} />
        <div className="max-w-xl mx-auto mt-8 px-5 pb-10">
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
      </main>
    );
  }

  // ── Formulaire multi-étapes (steps 1 à 5) ───────────────────────────────
  return (
    <main className="bg-gray-50 font-sans">
    <h1 className="sr-only">{t('reporter.title.createAReport')}</h1>


      <StepBar steps={steps} currentStep={step} />
      <div className="max-w-xl mx-auto mt-8 px-5 pb-10">
        <Card>

          {/* Étape 1 : Type de harcèlement */}
          {/* {step === 1 && (
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
                      type === opt.label ? 'border-primary bg-surface' : 'border-gray-200 bg-white'
                    }`}
                  >
                    <div className="text-2xl mb-1" role="img" aria-hidden="true">{opt.icon}</div>
                    <div className="text-sm font-semibold text-gray-800">{opt.label}</div>
                    <div className="text-xs text-gray-400">{opt.sub}</div>
                  </button>
                ))}
              </div>
              {showErrors && !type && (
                <p role="alert" className="mt-3 text-sm text-red-600">⚠️ {t('reporter.validation.typeRequired')}</p>
              )}
            </fieldset>
          )} */}

	


{step === 1 && (
  <fieldset>
    <legend className="text-gray-800 font-bold text-lg mb-2">
      {t('reporter.step2.title')}
    </legend>

    <p className="text-gray-500 text-sm mb-6">
      {t('reporter.step2.subtitle')}
    </p>

    {/* <div
      role="radiogroup"
      aria-label={t('reporter.step2.title')}
      className="grid grid-cols-2 gap-3"
    >
      {typeOptions.map((opt, index) => (
        <div
          key={opt.label}
          role="radio"
          aria-checked={type === opt.label}
          tabIndex={type === opt.label ? 0 : -1}
          onClick={() => setType(opt.label)}
			onKeyDown={(e) => {
  const currentIndex = typeOptions.findIndex(o => o.label === type);
  const fallbackIndex = currentIndex === -1 ? 0 : currentIndex;

  // ✔ Valider la carte focusée
  if (e.key === " " || e.key === "Enter") {
    e.preventDefault();
    setType(opt.label);
  }

  // ✔ Aller à la carte suivante
  if (e.key === "ArrowRight" || e.key === "ArrowDown") {
    e.preventDefault();
    const next = (fallbackIndex + 1) % typeOptions.length;
    setType(typeOptions[next].label);
  }

  // ✔ Aller à la carte précédente
  if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
    e.preventDefault();
    const prev = (fallbackIndex - 1 + typeOptions.length) % typeOptions.length;
    setType(typeOptions[prev].label);
  }
}}


          className={`
            px-4 py-4 rounded-lg cursor-pointer text-center transition-all border-2 outline-none
            ${type === opt.label ? "border-primary bg-surface" : "border-gray-200 bg-white"}
            focus-visible:ring-2 focus-visible:ring-primary
          `}
        >
          <div className="text-2xl mb-1" aria-hidden="true">
            {opt.icon}
          </div>
          <div className="text-sm font-semibold text-gray-800">
            {opt.label}
          </div>
          <div className="text-xs text-gray-400">
            {opt.sub}
          </div>
        </div>
      ))}
    </div> */}

<div
  role="radiogroup"
  aria-label={t('reporter.step2.title')}
  className="grid grid-cols-2 gap-3"
>
  {typeOptions.map((opt, index) => (
    <div
      key={opt.label}
      ref={el => (cardRefs.current[index] = el)}
      role="radio"
      aria-checked={type === opt.label}
      tabIndex={type === opt.label ? 0 : -1}
      onClick={() => setType(opt.label)}
      onKeyDown={(e) => {
        const currentIndex = typeOptions.findIndex(o => o.label === type);
        const fallbackIndex = currentIndex === -1 ? 0 : currentIndex;

        // ✔ Valider la carte focusée
        if (e.key === " " || e.key === "Enter") {
          e.preventDefault();
          setType(opt.label);
        }

        // ✔ Aller à la carte suivante
        if (e.key === "ArrowRight" || e.key === "ArrowDown") {
          e.preventDefault();
          const next = (fallbackIndex + 1) % typeOptions.length;
          setType(typeOptions[next].label);
        }

        // ✔ Aller à la carte précédente
        if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
          e.preventDefault();
          const prev = (fallbackIndex - 1 + typeOptions.length) % typeOptions.length;
          setType(typeOptions[prev].label);
        }
      }}
      className={`
        px-4 py-4 rounded-lg cursor-pointer text-center transition-all border-2 outline-none
        ${type === opt.label ? "border-primary bg-surface" : "border-gray-200 bg-white"}
        focus-visible:ring-2 focus-visible:ring-primary
      `}
    >
      <div className="text-2xl mb-1" aria-hidden="true">
        {opt.icon}
      </div>

      <div className="text-sm font-semibold text-gray-800">
        {opt.label}
      </div>

      <div className="text-xs text-gray-400">
        {opt.sub}
      </div>
    </div>
  ))}
</div>

    {showErrors && !type && (
      <p role="alert" className="mt-3 text-sm text-red-600">
        ⚠️ {t('reporter.validation.typeRequired')}
      </p>
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
              <textarea
                id="description"
                value={description}
                onChange={e => setDescription(e.target.value)}
                placeholder={t('reporter.step3.descriptionPlaceholder')}
                rows={5}
                aria-required="true"
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
                aria-required="true"
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
              }}>
                {t('common.next')} →
              </Button>
            ) : (
              <Button variant="success" onClick={handleSubmit} disabled={loading}>
                {loading ? t('reporter.submitting') : `${t('reporter.submit')} ✓`}
              </Button>
            )}
          </div>

        </Card>
      </div>
    </main>
  );
}

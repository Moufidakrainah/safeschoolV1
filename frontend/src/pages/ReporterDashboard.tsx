// React & libs
import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Contexts & hooks
import { useAuth } from '../context/AuthContext';
import { useReportForm } from '../hooks/useReportForm';

// API services
import { getStaffProfile } from '../services/api';

// UI components
import Button from '../components/Button';
import Card from '../components/Card';
import StepBar from '../components/StepBar';
import Autocomplete from '../components/Autocomplete';
import ReporterHeader from '../components/layout/ReporterHeader/ReporterHeader';

// Types
import type { UserSearchResult } from '../types';


/**
 * ReporterDashboard — page principale pour les utilisateurs de rôle 'teacher' ou 'staff'.
 *
 * Ce composant gère trois sections via l'état `viewSection` :
 *   - 'profile'  : informations personnelles et professionnelles de l'utilisateur
 *   - 'report'   : formulaire multi-étapes de signalement (5 étapes + écran de succès)
 *   - 'quiz'     : redirection vers le module quiz
 *
 * L'état de navigation entre sections est initialisé depuis le query param ?section=
 * pour permettre les deeplinks (ex. /reporter?section=profile).
 */
export default function ReporterDashboard() {
  // --- Hooks globaux ---
  // useAuth fournit l'utilisateur connecté et la fonction de déconnexion
  const { user, logoutUser } = useAuth();
  // t() est la fonction de traduction — toutes les chaînes UI passent par elle
  const { t } = useTranslation();
  const navigate = useNavigate();

  // --- Navigation entre sections ---
  // viewSection détermine quelle vue afficher : profil, formulaire ou quiz
  // La valeur initiale est lue depuis ?section= pour supporter les liens directs
  const [searchParams] = useSearchParams();
  const [viewSection, setViewSection] = useState<'profile' | 'report' | 'quiz'>(
    (searchParams.get('section') as 'profile' | 'report' | 'quiz') ?? 'report'
  );

  // --- État du formulaire et logique métier ---
  // Tout l'état du formulaire (champs, suspects, victime, validation…) et les
  // handlers asynchrones sont délégués au hook useReportForm.
  // Le composant ne conserve que ce qui concerne la navigation et le profil.
  const {
    step, setStep,
    whoSignals, setWhoSignals,
    type, setType,
    description, setDescription,
    frequency, setFrequency,
    isAnonymous, setIsAnonymous,
    loading,
    submitError,
    showErrors, setShowErrors,
    isNextDisabled,
    suspects,
    suspectInput,
    suspectSuggestions,
    searchingUsers,
    victimName, setVictimName,
    victimInput, setVictimInput,
    victimSuggestions, setVictimSuggestions,
    selectedVictim, setSelectedVictim,
    handleSubmit,
    handleSuspectSearch,
    handleVictimSearch,
    addSuspect,
    removeSuspect,
    resetForm,
  } = useReportForm(user?.role, t);

  // --- État du profil professionnel (section 'profile') ---
  const [staffProfile, setStaffProfile] = useState<any>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);

  // --- Effets ---

  // Charge le profil professionnel dès que l'id utilisateur est disponible.
  // La dépendance [user?.id] garantit que le chargement ne se relance que si
  // l'utilisateur change (reconnexion avec un autre compte).
  useEffect(() => {
    if (user?.id) {
      setLoadingProfile(true);
      getStaffProfile(user.id)
        .then(data => setStaffProfile(data))
        .catch(() => setStaffProfile(null))
        .finally(() => setLoadingProfile(false));
    }
  }, [user?.id]);

  // --- Données dérivées ---

  // headerProps regroupe les props partagées par le header dans toutes les vues.
  // Passer un objet unique évite de répéter les 4 props à chaque <ReporterHeader />.
  const headerProps = { user, logoutUser, viewSection, setViewSection };

  // Labels des étapes affichés dans la barre de progression (StepBar).
  const steps = [
    t('reporter.steps.type'),
    t('reporter.steps.facts'),
    t('reporter.steps.people'),
    t('reporter.steps.evidence'),
    t('reporter.steps.validate'),
  ];

  // whoOptions et typeOptions sont mémoïsés avec useMemo : ils ne sont recalculés
  // que si la langue (t) ou le rôle changent, pas à chaque re-render du composant.
  const whoOptions = useMemo(
    () => user?.role === 'teacher'
      ? [{ value: t('reporter.step1.teacher'), label: t('reporter.step1.teacher') }]
      : [{ value: t('reporter.step1.staff'), label: t('reporter.step1.staff') }],
    [t, user?.role]
  );

  const typeOptions = useMemo(
    () => [
      { label: t('reporter.step2.physical'),  sub: t('reporter.step2.physicalSub'),  icon: '✋' },
      { label: t('reporter.step2.verbal'),    sub: t('reporter.step2.verbalSub'),    icon: '💬' },
      { label: t('reporter.step2.cyber'),     sub: t('reporter.step2.cyberSub'),     icon: '📱' },
      { label: t('reporter.step2.exclusion'), sub: t('reporter.step2.exclusionSub'), icon: '🚫' },
      { label: t('reporter.step2.sexual'),    sub: t('reporter.step2.sexualSub'),    icon: '⚠️' },
      { label: t('reporter.step2.other'),     sub: t('reporter.step2.otherSub'),     icon: '...' },
    ],
    [t]
  );

  // Redirige vers la page quiz si l'utilisateur sélectionne cette section.
  // Le navigate est dans un effet car il s'agit d'un side effect (action sur le routeur)
  // qui ne doit pas se produire pendant le rendu.
  useEffect(() => {
    if (viewSection === 'quiz') {
      navigate('/quiz');
    }
  }, [viewSection, navigate]);


  // --- Rendu conditionnel par section ---
  // Chaque section retourne son propre arbre JSX (early return pattern).
  // Cela évite une imbrication profonde et rend chaque section lisible indépendamment.

  // SECTION PROFIL — informations personnelles et professionnelles
  if (viewSection === 'profile') {
    return (
      <>
        <ReporterHeader {...headerProps} />
        <main className="p-8 max-w-xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('reporter.profile.title')}</h2>

          {/* Informations personnelles */}
          <div className="bg-white shadow rounded-lg p-6 mb-4">
            <h3 className="text-primary font-bold text-sm mb-4">👤 Informations personnelles</h3>
            <table className="w-full text-sm">
              <tbody>
                {[
                  { label: t('reporter.profile.firstName'), value: user?.firstName },
                  { label: t('reporter.profile.lastName'),  value: user?.lastName },
                  { label: t('reporter.profile.email'),     value: user?.email },
                //   { label: t('reporter.profile.role'),      value: user?.role },
                ].map(row => (
                  <tr key={row.label} className="border-b border-gray-100">
                    <td className="py-2 text-gray-400 font-semibold w-2/5">{row.label}</td>
                    <td className="py-2 text-gray-700">{row.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Profil professionnel */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-primary font-bold text-sm mb-4">🏫 Profil professionnel</h3>
            {loadingProfile ? (
              <p className="text-gray-400 text-sm text-center py-4">Chargement...</p>
            ) : !staffProfile ? (
              <p className="text-gray-400 text-sm text-center py-4">Aucun profil professionnel enregistré</p>
            ) : (
              <>
                <table className="w-full text-sm mb-4">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-gray-400 font-semibold w-2/5">Profession</td>
                      <td className="py-2 text-gray-700 capitalize">{staffProfile.profession}</td>
                    </tr>
                    {staffProfile.subject && (
                      <tr className="border-b border-gray-100">
                        <td className="py-2 text-gray-400 font-semibold w-2/5">Matière</td>
                        <td className="py-2 text-gray-700">{staffProfile.subject}</td>
                      </tr>
                    )}
                  </tbody>
                </table>

                {staffProfile.classes?.length > 0 && (
                  <>
                    <p className="text-gray-400 font-semibold text-sm mb-2">Classes</p>
                    <div className="flex flex-wrap gap-2">
                      {staffProfile.classes.map((c: id) => (
                        <span key={c.id} className="bg-surface text-primary text-xs font-bold px-3 py-1 rounded-full">
                          {c.level} {c.section}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </main>
      </>
    );
  }

  // SECTION SIGNALEMENT — formulaire multi-étapes
  // Deux cas : écran de succès (step === 6) ou formulaire actif (step 1 à 5)
  if (viewSection === 'report')
	{

		// Écran de confirmation affiché après un envoi réussi
		if (step === 6)
		{
			return (		
				<>
				<ReporterHeader {...headerProps} />

				<main className="bg-gray-50 font-sans">
					<StepBar steps={steps} currentStep={step} /> {/* ✅ FIX 4 : step - 2 car step démarre à 2 */}
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
				</>
				)
			}
		// Formulaire multi-étapes (steps 1 à 5)
		// Chaque étape est rendue conditionnellement selon la valeur de `step`.
		// La StepBar en haut reflète la progression. Les boutons Précédent/Suivant
		// incrémentent/décrémentent step. Le bouton Envoyer n'apparaît qu'à l'étape 5.
	return (
	<>
		<ReporterHeader {...headerProps} />
		<main className="bg-gray-50 font-sans">
		<StepBar steps={steps} currentStep={step} />
		<div className="max-w-xl mx-auto mt-8 px-5 pb-10">
			<Card>

			{/* Étape 1 : Type */}
			{step === 1 && (
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
				{/* Message d'erreur si l'utilisateur essaie d'avancer sans choisir de type */}
				{showErrors && !type && (
					<p role="alert" className="mt-3 text-sm text-red-600">⚠️ {t('reporter.validation.typeRequired')}</p>
				)}
				</fieldset>
			)}

			{/* Étape 2 : Faits */}
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
				{/* Message d'erreur si description vide */}
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
				{/* Message d'erreur si fréquence non sélectionnée */}
				{showErrors && !frequency && (
					<p role="alert" className="mt-2 text-sm text-red-600">⚠️ {t('reporter.validation.frequencyRequired')}</p>
				)}
				</div>
			)}

			{/* Étape 3 : Personnes */}
			{step === 3 && (
				<div>
				<h2 className="text-gray-800 font-bold text-lg mb-2">{t('reporter.step4.title')}</h2>
				<p className="text-gray-500 text-sm mb-6">{t('reporter.step4.subtitle')}</p>
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

			{/* Étape 4 : Preuves */}
			{step === 4 && (
				<div>
				<h2 className="text-gray-800 font-bold text-lg mb-2">{t('reporter.step5.title')}</h2>
				<p className="text-gray-500 text-sm mb-6">{t('reporter.step5.subtitle')}</p>
				<div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-400 text-center">
					🚧 {t('reporter.step5.soon')}
				</div>
				</div>
			)}

			{/* Étape 5 : Validation */}
			{step === 5 && (
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
				{/* Error banner — only visible if the previous submission attempt failed */}
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
				
			{/* Boutons navigation */}
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
					// Si les champs requis de cette étape sont vides, afficher les erreurs inline
					// sans avancer. L'utilisateur voit ce qui manque et peut corriger.
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
	</>
	);
	}
}
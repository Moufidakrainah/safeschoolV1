/**
 * useStudentReportForm — hook personnalisé pour le formulaire de signalement multi-étapes.
 *
 * Centralise tout l'état et la logique métier du formulaire :
 *   - État de chaque champ (type, description, fréquence, suspects, victime…)
 *   - Handlers asynchrones (soumission, recherche d'utilisateurs)
 *   - Validation inline (showErrors, isNextDisabled)
 *   - Réinitialisation du formulaire
 *
 * Le composant qui appelle le hook n'a plus qu'à gérer le rendu JSX.
 */

import { useState } from 'react';
import { createReport, searchUsers } from '../services/api';
import type { UserSearchResult } from '../types';

// ─── Types ──────────────────────────────────────────────────────────────────

// Suspect tel qu'attendu par l'API : soit un userId connu, soit un texte libre.
interface SuspectPayload {
  userId?: string;
  freeText?: string;
}

// Tout ce que le hook expose au composant.
export interface UseStudentReportFormReturn {
  // État des étapes
  step:        number;
  setStep:     React.Dispatch<React.SetStateAction<number>>;

  // Champs du formulaire
  whoSignals:     string;
  setWhoSignals:  React.Dispatch<React.SetStateAction<string>>;
  type:           string;
  setType:        React.Dispatch<React.SetStateAction<string>>;
  description:    string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  frequency:      string;
  setFrequency:   React.Dispatch<React.SetStateAction<string>>;
  isAnonymous:    boolean;
  setIsAnonymous: React.Dispatch<React.SetStateAction<boolean>>;

  // Soumission
  loading:      boolean;
  submitError:  string | null;

  // Validation inline
  showErrors:   boolean;
  setShowErrors: React.Dispatch<React.SetStateAction<boolean>>;
  isNextDisabled: boolean;

  // Suspects
  suspects:           UserSearchResult[];
  suspectInput:       string;
  suspectSuggestions: UserSearchResult[];
  searchingUsers:     boolean;

  // Victime
  victimName:         string;
  setVictimName:      React.Dispatch<React.SetStateAction<string>>;
  victimInput:        string;
  victimSuggestions:  UserSearchResult[];
  selectedVictim:     UserSearchResult | null;
  setSelectedVictim:  React.Dispatch<React.SetStateAction<UserSearchResult | null>>;
  setVictimInput:     React.Dispatch<React.SetStateAction<string>>;
  setVictimSuggestions: React.Dispatch<React.SetStateAction<UserSearchResult[]>>;

  // Handlers
  handleSubmit:       () => Promise<void>;
  handleSuspectSearch:(value: string) => Promise<void>;
  handleVictimSearch: (value: string) => Promise<void>;
  addSuspect:         (suspect: { id?: string; firstName: string; lastName: string; role?: string }) => void;
  removeSuspect:      (index: number) => void;
  resetForm:          () => void;
}

// ─── Hook ───────────────────────────────────────────────────────────────────

export function useReportForm(
  userRole: string | undefined,
  t: (key: string) => string,
): UseStudentReportFormReturn {

  // "Qui signale" est pré-rempli selon le rôle : teacher → libellé teacher, sinon staff.
  // La valeur est calculée une seule fois à l'initialisation du hook.
  const defaultWho = userRole === 'student' ;

  // ── État des étapes ─────────────────────────────────────────────────────
  // step 1-5 = étapes du formulaire, step 6 = écran de confirmation
  const [step, setStep] = useState(0);

  // ── Champs du formulaire ────────────────────────────────────────────────
  const [whoSignals,   setWhoSignals]   = useState<string>('');
  const [type,         setType]         = useState('');
  const [description,  setDescription]  = useState('');
  const [frequency,    setFrequency]    = useState('');
  const [isAnonymous,  setIsAnonymous]  = useState(false);

  // ── Soumission ──────────────────────────────────────────────────────────
  const [loading,     setLoading]     = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Validation inline ───────────────────────────────────────────────────
  // showErrors passe à true quand l'utilisateur clique "Suivant" avec des champs vides.
  // Les messages d'erreur s'affichent sous les champs concernés.
  // Remis à false dès qu'on change d'étape (en avant ou en arrière).
  const [showErrors, setShowErrors] = useState(false);

  // Vrai si les champs requis de l'étape courante sont incomplets.
  // Utilisé à la fois pour bloquer la navigation et pour déclencher showErrors.
  const isNextDisabled =
    (step === 1 && !type) ||
    (step === 2 && (!description.trim() || !frequency));

  // ── Suspects ────────────────────────────────────────────────────────────
  const [suspects,           setSuspects]           = useState<UserSearchResult[]>([]);
  const [suspectInput,       setSuspectInput]       = useState('');
  const [suspectSuggestions, setSuspectSuggestions] = useState<UserSearchResult[]>([]);
  // searchingUsers : true pendant l'appel API — masque le bouton "texte libre"
  // pour ne pas le proposer avant d'avoir les vraies suggestions.
  const [searchingUsers, setSearchingUsers] = useState(false);

  // ── Victime ─────────────────────────────────────────────────────────────
  const [victimName,         setVictimName]         = useState('');
  const [victimInput,        setVictimInput]        = useState('');
  const [victimSuggestions,  setVictimSuggestions]  = useState<UserSearchResult[]>([]);
  const [selectedVictim,     setSelectedVictim]     = useState<UserSearchResult | null>(null);

  // ── Handlers ────────────────────────────────────────────────────────────

  /**
   * Soumet le signalement à l'API.
   * Guard en début de fonction : les champs obligatoires doivent être remplis
   * (double sécurité — isNextDisabled bloque déjà la navigation à l'étape 1-2).
   */
  const handleSubmit = async () => {
    if (!type || !description || !frequency) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const title = `${type} - ${whoSignals}`;
      const victimInfo = victimName ? ` | Victime : ${victimName}` : '';
      const fullDescription = `${description} (Fréquence: ${frequency})${victimInfo}`;
      const suspectsData: SuspectPayload[] = suspects.map(s => ({
        userId:   s.id   || undefined,
        freeText: s.id   ? undefined : `${s.firstName} ${s.lastName}`,
      }));
      await createReport(title, fullDescription, isAnonymous, suspectsData, frequency, '');
      setStep(6);
    } catch (err) {
      console.error('Report submission failed', err);
      setSubmitError(t('reporter.submitError'));
    } finally {
      setLoading(false);
    }
  };

  /**
   * Recherche de suspects : appel API à chaque frappe (dès 2 caractères).
   * searchingUsers masque le bouton "texte libre" pendant le chargement.
   */
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

  /**
   * Recherche de victime : appel API à chaque frappe (dès 2 caractères).
   * Contrairement aux suspects, la victime peut être saisie en texte libre
   * directement dans l'input (pas de bouton dédié).
   */
  const handleVictimSearch = async (value: string) => {
    setVictimInput(value);
    setSelectedVictim(null);
    setVictimName(value);
    if (value.length < 2) { setVictimSuggestions([]); return; }
    try {
      setVictimSuggestions(await searchUsers(value));
    } catch {
      setVictimSuggestions([]);
    }
  };

  /**
   * Ajoute un suspect à la liste en évitant les doublons (prénom + nom).
   * Accepte un objet issu de l'API (avec id) ou un texte libre (sans id).
   */
  const addSuspect = (suspect: { id?: string; firstName: string; lastName: string; role?: string }) => {
    if (!suspects.find(s => s.firstName === suspect.firstName && s.lastName === suspect.lastName)) {
      setSuspects([...suspects, suspect]);
    }
    setSuspectInput('');
    setSuspectSuggestions([]);
  };

  /** Supprime un suspect par son index. */
  const removeSuspect = (index: number) => setSuspects(suspects.filter((_, i) => i !== index));

  /**
   * Réinitialise tous les champs du formulaire et revient à l'étape 1.
   * Appelé après un envoi réussi (bouton "Nouveau signalement").
   */
  const resetForm = () => {
    setStep(0);
    setType('');
    setDescription('');
    setFrequency('');
    setWhoSignals(defaultWho);
    setVictimName('');
    setVictimInput('');
    setSelectedVictim(null);
    setSuspects([]);
    setIsAnonymous(false);
    setSubmitError(null);
    setShowErrors(false);
  };

  // ── Valeur retournée ────────────────────────────────────────────────────
  return {
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
  };
}

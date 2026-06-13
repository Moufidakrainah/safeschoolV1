import { useState } from 'react';
import { createReport } from '@/services/api';
import type { UserSearchResult } from '@/types';

export interface UseReportFormReturn {
  step:        number;
  setStep:     React.Dispatch<React.SetStateAction<number>>;
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
  loading:      boolean;
  submitError:  string | null;
  showErrors:   boolean;
  setShowErrors: React.Dispatch<React.SetStateAction<boolean>>;
  isNextDisabled: boolean;
  suspects:           UserSearchResult[];
  suspectInput:       string;
  setSuspectInput:    React.Dispatch<React.SetStateAction<string>>;
  victimName:         string;
  setVictimName:      React.Dispatch<React.SetStateAction<string>>;
  victimInput:        string;
  selectedVictim:     UserSearchResult | null;
  setSelectedVictim:  React.Dispatch<React.SetStateAction<UserSearchResult | null>>;
  setVictimInput:     React.Dispatch<React.SetStateAction<string>>;
  handleSubmit:       () => Promise<void>;
  addSuspect:         (suspect: { id?: string; firstName: string; lastName: string; role?: string }) => void;
  removeSuspect:      (index: number) => void;
  resetForm:          () => void;
  descriptionError:   string;
  setDescriptionError: React.Dispatch<React.SetStateAction<string>>;
  victimError:        string;
  setVictimError:     React.Dispatch<React.SetStateAction<string>>;
  suspectError:       string;
  setSuspectError:    React.Dispatch<React.SetStateAction<string>>;
  validateDescription: (value: string) => string;
  validatePersonName:  (value: string) => string;
}

const descriptionRegex = /^(?!(.)\1{9,})[\s\S]+$/u;
const personRegex = /^(?!(.)\1{4,})[\p{L}\s\-']+$/u;

const validateDescription = (value: string): string => {
  if (!value.trim()) return 'La description est obligatoire';
  if (value.length < 20) return 'La description doit contenir au moins 20 caractères';
  if (value.length > 2000) return 'La description ne peut pas dépasser 2000 caractères';
  if (!descriptionRegex.test(value)) return 'La description semble invalide (caractères répétitifs détectés)';
  return '';
};

const validatePersonName = (value: string): string => {
  if (!value.trim()) return 'Le nom est obligatoire';
  if (value.length < 2) return 'Le nom doit contenir au moins 2 caractères';
  if (value.length > 50) return 'Le nom ne peut pas dépasser 50 caractères';
  if (!personRegex.test(value)) return 'Le nom contient des caractères invalides ou répétitifs';
  return '';
};

export function useReportForm(
  userRole: string | undefined,
  t: (key: string) => string,
): UseReportFormReturn {

  const defaultWho = 'temoin';

  const [step, setStep]               = useState(1);
  const [whoSignals, setWhoSignals]   = useState(defaultWho);
  const [type, setType]               = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency]     = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showErrors, setShowErrors]   = useState(false);
  const [descriptionError, setDescriptionError] = useState('');
  const [victimError, setVictimError]           = useState('');
  const [suspectError, setSuspectError]         = useState('');

  const isNextDisabled =
    (step === 1 && !type) ||
    (step === 2 && (!!validateDescription(description) || !frequency));

  const [suspects,     setSuspects]     = useState<UserSearchResult[]>([]);
  const [suspectInput, setSuspectInput] = useState('');
  const [victimName,   setVictimName]   = useState('');
  const [victimInput,  setVictimInput]  = useState('');
  const [selectedVictim, setSelectedVictim] = useState<UserSearchResult | null>(null);

  const handleSubmit = async () => {
    if (!type || !description || !frequency) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const fullDescription = `${description} (${t('reporter.step6.frequency')}: ${frequency})`;
      const suspectsData = suspects.map(s => ({ freeText: `${s.firstName} ${s.lastName}` }));
      const victimsData = victimName ? [{ freeText: victimName }] : [];
      await createReport(type, 'temoin', fullDescription, isAnonymous, suspectsData, victimsData, frequency);
      setStep(6);
    } catch {
      setSubmitError(t('reporter.submitError'));
    } finally {
      setLoading(false);
    }
  };

  const addSuspect = (suspect: { id?: string; firstName: string; lastName: string; role?: string }) => {
    const name = `${suspect.firstName} ${suspect.lastName}`.trim();
    const err = validatePersonName(name);
    if (err) { setSuspectError(err); return; }
    setSuspectError('');
    if (!suspects.find(s => s.firstName === suspect.firstName && s.lastName === suspect.lastName)) {
      setSuspects([...suspects, suspect as UserSearchResult]);
    }
    setSuspectInput('');
  };

  const removeSuspect = (index: number) => setSuspects(suspects.filter((_, i) => i !== index));

  const resetForm = () => {
    setStep(1);
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

  return {
    step, setStep,
    descriptionError, setDescriptionError,
    victimError, setVictimError,
    suspectError, setSuspectError,
    validateDescription, validatePersonName,
    whoSignals, setWhoSignals,
    type, setType,
    description, setDescription,
    frequency, setFrequency,
    isAnonymous, setIsAnonymous,
    loading, submitError,
    showErrors, setShowErrors,
    isNextDisabled,
    suspects, suspectInput, setSuspectInput,
    victimName, setVictimName,
    victimInput, setVictimInput,
    selectedVictim, setSelectedVictim,
    handleSubmit,
    addSuspect, removeSuspect,
    resetForm,
  };
}

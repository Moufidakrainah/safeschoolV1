import { useState } from 'react';
import { createReport, isOfflineError } from '@/services/api';
import type { UserSearchResult } from '@/types';

export interface UseStudentReportFormReturn {
  step: number;
  setStep: React.Dispatch<React.SetStateAction<number>>;
  whoSignals: string;
  setWhoSignals: React.Dispatch<React.SetStateAction<string>>;
  type: string;
  setType: React.Dispatch<React.SetStateAction<string>>;
  description: string;
  setDescription: React.Dispatch<React.SetStateAction<string>>;
  frequency: string;
  setFrequency: React.Dispatch<React.SetStateAction<string>>;
  isAnonymous: boolean;
  setIsAnonymous: React.Dispatch<React.SetStateAction<boolean>>;
  loading: boolean;
  submitError: string | null;
  fieldErrors: Record<string, string>;
  showErrors: boolean;
  setShowErrors: React.Dispatch<React.SetStateAction<boolean>>;
  isNextDisabled: boolean;
  suspects: UserSearchResult[];
  suspectInput: string;
  setSuspectInput: React.Dispatch<React.SetStateAction<string>>;
  victimName: string;
  setVictimName: React.Dispatch<React.SetStateAction<string>>;
  victimInput: string;
  selectedVictim: UserSearchResult | null;
  setSelectedVictim: React.Dispatch<React.SetStateAction<UserSearchResult | null>>;
  setVictimInput: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: () => Promise<void>;
  handleNext: () => void;
  addSuspect: (suspect: { id?: string; firstName: string; lastName: string; role?: string }) => void;
  removeSuspect: (index: number) => void;
  resetForm: () => void;
  validateDescriptionKey: (desc: string) => string | null;
  validateNameKey: (name: string) => string | null;
  // Clés i18n (pas des messages) — t() est appelé dans le composant
  victimErrorKey: string;
  setVictimErrorKey: React.Dispatch<React.SetStateAction<string>>;
  suspectErrorKey: string;
  setSuspectErrorKey: React.Dispatch<React.SetStateAction<string>>;
  descriptionErrorKey: string;
  setDescriptionErrorKey: React.Dispatch<React.SetStateAction<string>>;
  frequencyErrorKey: string;
  setFrequencyErrorKey: React.Dispatch<React.SetStateAction<string>>;
}

export function useStudentReportForm(
  userRole: string | undefined,
  t: (key: string) => string,
): UseStudentReportFormReturn {
  
  // ── Validators — retournent des CLÉS i18n, pas des messages ──
  const validateNameKey = (name: string): string | null => {
    if (name.length < 2) return 'validation.nameMin';
    if (name.length > 50) return 'validation.nameMax';
    if (!/^(?!(.)\1{4,})[\p{L}\s\-']+$/u.test(name)) return 'validation.nameInvalid';
    return null;
  };

  const validateDescriptionKey = (desc: string): string | null => {
    if (!desc.trim()) return 'validation.descRequired';
    if (desc.length < 20) return 'validation.descMin';
    if (desc.length > 2000) return 'validation.descMax';
    if (/(.)\1{9,}/.test(desc)) return 'validation.descInvalid';
    const cleaned = desc.replace(/\s/g, '');
    if (cleaned.length > 10) {
      const freq: Record<string, number> = {};
      for (const c of cleaned) freq[c] = (freq[c] ?? 0) + 1;
      const maxFreq = Math.max(...Object.values(freq));
      if (maxFreq / cleaned.length > 0.7) return 'validation.descInvalid';
    }
    return null;
  };

  // ── État ──
  const [step, setStep]               = useState(1);
  const [whoSignals, setWhoSignals]   = useState<string>();
  const [type, setType]               = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency]     = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading]         = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  // Stocke des CLÉS i18n, pas des messages
  const [descriptionErrorKey, setDescriptionErrorKey] = useState('');
  const [frequencyErrorKey, setFrequencyErrorKey]     = useState('');
  const [victimErrorKey, setVictimErrorKey]           = useState('');
  const [suspectErrorKey, setSuspectErrorKey]         = useState('');
  const [showErrors, setShowErrors]                   = useState(false);
  const [suspects, setSuspects]         = useState<UserSearchResult[]>([]);
  const [suspectInput, setSuspectInput] = useState('');
  const [victimName, setVictimName]     = useState('');
  const [victimInput, setVictimInput]   = useState('');
  const [selectedVictim, setSelectedVictim] = useState<UserSearchResult | null>(null);

  const isNextDisabled =
    (step === 1 && !whoSignals) ||
    (step === 2 && !type) ||
    (step === 3 && (!!validateDescriptionKey(description) || !frequency));

  const handleNext = () => {
    const errors: Record<string, string> = {};

    if (step === 1 && !whoSignals) { setShowErrors(true); return; }
    if (step === 2 && !type)       { setShowErrors(true); return; }

    if (step === 3) {
      const descErrKey = validateDescriptionKey(description.trim());
      if (descErrKey) {
        setDescriptionErrorKey(descErrKey);
        setShowErrors(true);
        return;
      }
      setDescriptionErrorKey('');

      if (!frequency) {
        setFrequencyErrorKey('validation.freqRequired');
        setShowErrors(true);
        return;
      }
      setFrequencyErrorKey('');
    }

    if (step === 4) {
      if (victimName) {
        victimName.split('|').filter(Boolean).forEach((v, i) => {
          const errKey = validateNameKey(v.trim());
          if (errKey) errors[`victim_${i}`] = t(errKey);
        });
      }
      suspects.forEach((s, i) => {
        const fullName = `${s.firstName} ${s.lastName}`.trim();
        const errKey = validateNameKey(fullName);
        if (errKey) errors[`suspect_${i}`] = t(errKey);
      });
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setShowErrors(true);
      return;
    }

    setFieldErrors({});
    setShowErrors(false);
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!type || !description || !frequency) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const fullDescription = `${description} (${t('reporter.step6.frequency')}: ${frequency})`;
      const suspectsData = suspects.map(s => ({ freeText: `${s.firstName} ${s.lastName}`.trim() }));
      const victimsData = victimName
        ? victimName.split('|').filter(v => v.trim()).map(v => ({ freeText: v.trim() }))
        : [];
      await createReport(type, whoSignals, fullDescription, isAnonymous, suspectsData, victimsData, frequency);
      setStep(7);
    } catch (err: unknown) {
      if (isOfflineError(err)) {
        setSubmitError(t('offline.actionUnavailable'));
        return;
      }
      const messages = (err as { response?: { data?: { message?: unknown } }; message?: unknown })?.response?.data?.message
        ?? (err as { message?: unknown })?.message;
      if (Array.isArray(messages) && messages.length > 0) {
        setSubmitError(messages.join(' — '));
      } else if (typeof messages === 'string') {
        setSubmitError(messages);
      } else {
        setSubmitError(t('reporter.submitError'));
      }
    } finally {
      setLoading(false);
    }
  };

  const clearFieldErrors = () => setFieldErrors({});

  const addSuspect = (suspect: { id?: string; firstName: string; lastName: string; role?: string }) => {
    const name = `${suspect.firstName} ${suspect.lastName}`.trim();
    const errKey = validateNameKey(name);
    if (errKey) { setSuspectErrorKey(errKey); return; }
    setSuspectErrorKey('');
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
    setWhoSignals();
    setVictimName('');
    setVictimInput('');
    setSelectedVictim(null);
    setSuspects([]);
    setIsAnonymous(false);
    setSubmitError(null);
    setFieldErrors({});
    setShowErrors(false);
    setDescriptionErrorKey('');
    setFrequencyErrorKey('');
    setVictimErrorKey('');
    setSuspectErrorKey('');
  };

  return {
    step, setStep,
    whoSignals, setWhoSignals,
    type, setType,
    description, setDescription,
    frequency, setFrequency,
    isAnonymous, setIsAnonymous,
    loading, submitError, fieldErrors,
    showErrors, setShowErrors,
    isNextDisabled,
    suspects, suspectInput, setSuspectInput,
    victimName, setVictimName,
    victimInput, setVictimInput,
    selectedVictim, setSelectedVictim,
    handleSubmit, handleNext, clearFieldErrors,
    validateDescriptionKey, validateNameKey,
    descriptionErrorKey, setDescriptionErrorKey,
    frequencyErrorKey, setFrequencyErrorKey,
    victimErrorKey, setVictimErrorKey,
    suspectErrorKey, setSuspectErrorKey,
    addSuspect, removeSuspect, resetForm,
  };
}
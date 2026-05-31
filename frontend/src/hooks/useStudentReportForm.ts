import { useState } from 'react';
import { createReport, searchUsers } from '../services/api';
import type { UserSearchResult } from '../types';

export interface UseStudentReportFormReturn {
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
  searchingUsers:     boolean;
  victimName:         string;
  setVictimName:      React.Dispatch<React.SetStateAction<string>>;
  victimInput:        string;
  selectedVictim:     UserSearchResult | null;
  setSelectedVictim:  React.Dispatch<React.SetStateAction<UserSearchResult | null>>;
  setVictimInput:     React.Dispatch<React.SetStateAction<string>>;
  handleSubmit:       () => Promise<void>;
  handleSuspectSearch:(value: string) => Promise<void>;
  handleVictimSearch: (value: string) => Promise<void>;
  addSuspect:         (suspect: { id?: string; firstName: string; lastName: string; role?: string }) => void;
  removeSuspect:      (index: number) => void;
  resetForm:          () => void;
}

export function useStudentReportForm(
  userRole: string | undefined,
  t: (key: string) => string,
): UseStudentReportFormReturn {

//   const defaultWho = userRole === 'student' ? 'victime' : 'temoin';
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

  const isNextDisabled =
    (step === 1 && !whoSignals) ||
    (step === 2 && !type) ||
    (step === 3 && (!description.trim() || !frequency));

  const [suspects,           setSuspects]           = useState<UserSearchResult[]>([]);
  const [suspectInput,       setSuspectInput]       = useState('');
  const [searchingUsers,     setSearchingUsers]     = useState(false);

  const [victimName,        setVictimName]        = useState('');
  const [victimInput,       setVictimInput]       = useState('');
  const [selectedVictim,    setSelectedVictim]    = useState<UserSearchResult | null>(null);

  const handleSubmit = async () => {
    if (!type || !description || !frequency) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const fullDescription = `${description} (${t('reporter.step6.frequency')}: ${frequency})`;

      const suspectsData = suspects.map(s => ({
        freeText: s.id ? `${s.firstName} ${s.lastName}` : `${s.firstName} ${s.lastName}`,
      }));
      // Si reporter=victime, les victimes supplémentaires sont dans victimName
      // L'alerteur lui-même est déjà enregistré comme victim côté backend si besoin
      const victimsData = victimName
        ? victimName.split('|').filter(v => v.trim()).map(v => ({ freeText: v.trim() }))
        : [];

      await createReport(
        type,
        whoSignals,
        fullDescription,
        isAnonymous,
        suspectsData,
        victimsData,
        frequency,
      );
      setStep(7);
    } catch (err) {
      console.error('Report submission failed', err);
      setSubmitError(t('reporter.submitError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSuspectSearch = async (value: string) => {
    setSuspectInput(value);
  };

  const handleVictimSearch = async (value: string) => {
    setVictimInput(value);
    setSelectedVictim(null);
    setVictimName(value);
  };

  const addSuspect = (suspect: { id?: string; firstName: string; lastName: string; role?: string }) => {
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
    whoSignals, setWhoSignals,
    type, setType,
    description, setDescription,
    frequency, setFrequency,
    isAnonymous, setIsAnonymous,
    loading, submitError,
    showErrors, setShowErrors,
    isNextDisabled,
    suspects, suspectInput, searchingUsers,
    victimName, setVictimName,
    victimInput, setVictimInput,
    selectedVictim, setSelectedVictim,
    handleSubmit, 
	handleSuspectSearch, 
	// handleVictimSearch,
    addSuspect, 
	removeSuspect, 
	resetForm,
  };
}

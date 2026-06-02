import { useState } from 'react';
import { createReport, searchUsers } from '@/services/api';
import type { UserSearchResult } from '@/types';
import { useTranslation } from 'react-i18next';

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
  suspectSuggestions: UserSearchResult[];
  searchingUsers:     boolean;
  victimName:         string;
  setVictimName:      React.Dispatch<React.SetStateAction<string>>;
  victimInput:        string;
  victimSuggestions:  UserSearchResult[];
  selectedVictim:     UserSearchResult | null;
  setSelectedVictim:  React.Dispatch<React.SetStateAction<UserSearchResult | null>>;
  setVictimInput:     React.Dispatch<React.SetStateAction<string>>;
  setVictimSuggestions: React.Dispatch<React.SetStateAction<UserSearchResult[]>>;
  handleSubmit:       () => Promise<void>;
  handleSuspectSearch:(value: string) => Promise<void>;
  handleVictimSearch: (value: string) => Promise<void>;
  addSuspect:         (suspect: { id?: string; firstName: string; lastName: string; role?: string }) => void;
  removeSuspect:      (index: number) => void;
  resetForm:          () => void;
}

export function useReportForm(
  userRole: string | undefined,
  t: (key: string) => string,
): UseReportFormReturn {

//il faut enlever les suggestions de noms d'eleves
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
    (step === 1 && !type) ||
    (step === 2 && (!description.trim() || !frequency));

  const [suspects,           setSuspects]           = useState<UserSearchResult[]>([]);
  const [suspectInput,       setSuspectInput]       = useState('');
  const [suspectSuggestions, setSuspectSuggestions] = useState<UserSearchResult[]>([]);
  const [searchingUsers,     setSearchingUsers]     = useState(false);

  const [victimName,        setVictimName]        = useState('');
  const [victimInput,       setVictimInput]       = useState('');
  const [victimSuggestions, setVictimSuggestions] = useState<UserSearchResult[]>([]);
  const [selectedVictim,    setSelectedVictim]    = useState<UserSearchResult | null>(null);


  //some translations to be done
  const handleSubmit = async () => {
    if (!type || !description || !frequency) return;
    setLoading(true);
    setSubmitError(null);
    try {
      const fullDescription = `${description} (${t('reporter.step6.frequency')}: ${frequency})`;
      const suspectsData = suspects.map(s => ({
        freeText: `${s.firstName} ${s.lastName}`,
      }));
      const victimsData = victimName ? [{ freeText: victimName }] : [];

      await createReport(
        type,
        'temoin',
        fullDescription,
        isAnonymous,
        suspectsData,
        victimsData,
        frequency,
      );
      setStep(6);
    } catch (err) {
      setSubmitError(t('reporter.submitError'));
    } finally {
      setLoading(false);
    }
  };

//   attention, certaines fonctions ne sont plus utilisees 
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

  const addSuspect = (suspect: { id?: string; firstName: string; lastName: string; role?: string }) => {
    if (!suspects.find(s => s.firstName === suspect.firstName && s.lastName === suspect.lastName)) {
      setSuspects([...suspects, suspect as UserSearchResult]);
    }
    setSuspectInput('');
    setSuspectSuggestions([]);
  };

  const removeSuspect = (index: number) => setSuspects(suspects.filter((_, i) => i !== index)
);

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
    suspects, suspectInput, 
	suspectSuggestions, 
	searchingUsers,
    victimName, setVictimName,
    victimInput, setVictimInput,
    victimSuggestions, 
	setVictimSuggestions,
    selectedVictim, setSelectedVictim,
    handleSubmit,
	handleSuspectSearch, 
	handleVictimSearch,
    addSuspect, removeSuspect, 
	resetForm,
  };
}

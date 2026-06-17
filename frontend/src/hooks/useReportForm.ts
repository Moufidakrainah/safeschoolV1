import { useState } from "react";
import { createReport, isOfflineError } from "@/services/api";
import type { UserSearchResult } from "@/types";

export interface UseReportFormReturn {
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
  setSelectedVictim: React.Dispatch<
    React.SetStateAction<UserSearchResult | null>
  >;
  setVictimInput: React.Dispatch<React.SetStateAction<string>>;
  handleSubmit: () => Promise<void>;
  addSuspect: (suspect: {
    id?: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => void;
  removeSuspect: (index: number) => void;
  resetForm: () => void;
  // Clés i18n — t() est appelé dans le composant
  descriptionErrorKey: string;
  setDescriptionErrorKey: React.Dispatch<React.SetStateAction<string>>;
  frequencyErrorKey: string;
  setFrequencyErrorKey: React.Dispatch<React.SetStateAction<string>>;
  victimErrorKey: string;
  setVictimErrorKey: React.Dispatch<React.SetStateAction<string>>;
  suspectErrorKey: string;
  setSuspectErrorKey: React.Dispatch<React.SetStateAction<string>>;
  validateDescriptionKey: (value: string) => string | null;
  validateNameKey: (value: string) => string | null;
}

const descriptionRegex = /^(?!(.)\1{9,})[\s\S]+$/u;
const personRegex = /^(?!(.)\1{4,})[\p{L}\s\-']+$/u;

export function useReportForm(
  _userRole: string | undefined,
  t: (key: string) => string,
): UseReportFormReturn {
  const defaultWho = "temoin";

  // ── Validators — retournent des CLÉS i18n ──
  const validateDescriptionKey = (value: string): string | null => {
    if (!value.trim()) return "validation.descRequired";
    if (value.length < 20) return "validation.descMin";
    if (value.length > 2000) return "validation.descMax";
    if (!descriptionRegex.test(value)) return "validation.descInvalid";
    return null;
  };

  const validateNameKey = (value: string): string | null => {
    if (!value.trim()) return "validation.nameRequired";
    if (value.length < 2) return "validation.nameMin";
    if (value.length > 50) return "validation.nameMax";
    if (!personRegex.test(value)) return "validation.nameInvalid";
    return null;
  };

  const [step, setStep] = useState(1);
  const [whoSignals, setWhoSignals] = useState(defaultWho);
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [frequency, setFrequency] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showErrors, setShowErrors] = useState(false);

  // ── Stocke des CLÉS i18n, pas des messages ──
  const [descriptionErrorKey, setDescriptionErrorKey] = useState("");
  const [frequencyErrorKey, setFrequencyErrorKey] = useState("");
  const [victimErrorKey, setVictimErrorKey] = useState("");
  const [suspectErrorKey, setSuspectErrorKey] = useState("");

  const isNextDisabled =
    (step === 1 && !type) ||
    (step === 2 && (!!validateDescriptionKey(description) || !frequency));

  const [suspects, setSuspects] = useState<UserSearchResult[]>([]);
  const [suspectInput, setSuspectInput] = useState("");
  const [victimName, setVictimName] = useState("");
  const [victimInput, setVictimInput] = useState("");
  const [selectedVictim, setSelectedVictim] = useState<UserSearchResult | null>(
    null,
  );

  const handleSubmit = async () => {
    // Valider description
    const descKey = validateDescriptionKey(description.trim());
    if (descKey) {
      setDescriptionErrorKey(descKey);
      setShowErrors(true);
      return;
    }
    if (!frequency) {
      setFrequencyErrorKey("validation.freqRequired");
      setShowErrors(true);
      return;
    }
    if (!type) return;

    setLoading(true);
    setSubmitError(null);
    try {
      const fullDescription = `${description} (${t("reporter.step6.frequency")}: ${frequency})`;
      const suspectsData = suspects.map((s) => ({
        freeText: `${s.firstName} ${s.lastName}`,
      }));
      const victimsData = victimName
        ? victimName
            .split("|")
            .filter(Boolean)
            .map((name) => ({ freeText: name }))
        : [];
      await createReport(
        type,
        "temoin",
        fullDescription,
        isAnonymous,
        suspectsData,
        victimsData,
        frequency,
      );
      setStep(6);
    } catch (err) {
      setSubmitError(
        t(
          isOfflineError(err)
            ? "offline.actionUnavailable"
            : "reporter.submitError",
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  const addSuspect = (suspect: {
    id?: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) => {
    const name = `${suspect.firstName} ${suspect.lastName}`.trim();
    const errKey = validateNameKey(name);
    if (errKey) {
      setSuspectErrorKey(errKey);
      return;
    }
    setSuspectErrorKey("");
    if (
      !suspects.find(
        (s) =>
          s.firstName === suspect.firstName && s.lastName === suspect.lastName,
      )
    ) {
      setSuspects([...suspects, suspect as UserSearchResult]);
    }
    setSuspectInput("");
  };

  const removeSuspect = (index: number) =>
    setSuspects(suspects.filter((_, i) => i !== index));

  const resetForm = () => {
    setStep(1);
    setType("");
    setDescription("");
    setFrequency("");
    setWhoSignals(defaultWho);
    setVictimName("");
    setVictimInput("");
    setSelectedVictim(null);
    setSuspects([]);
    setIsAnonymous(false);
    setSubmitError(null);
    setShowErrors(false);
    setDescriptionErrorKey("");
    setFrequencyErrorKey("");
    setVictimErrorKey("");
    setSuspectErrorKey("");
  };

  return {
    step,
    setStep,
    descriptionErrorKey,
    setDescriptionErrorKey,
    frequencyErrorKey,
    setFrequencyErrorKey,
    victimErrorKey,
    setVictimErrorKey,
    suspectErrorKey,
    setSuspectErrorKey,
    validateDescriptionKey,
    validateNameKey,
    whoSignals,
    setWhoSignals,
    type,
    setType,
    description,
    setDescription,
    frequency,
    setFrequency,
    isAnonymous,
    setIsAnonymous,
    loading,
    submitError,
    showErrors,
    setShowErrors,
    isNextDisabled,
    suspects,
    suspectInput,
    setSuspectInput,
    victimName,
    setVictimName,
    victimInput,
    setVictimInput,
    selectedVictim,
    setSelectedVictim,
    handleSubmit,
    addSuspect,
    removeSuspect,
    resetForm,
  };
}

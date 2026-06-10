import { useState } from "react";
import { createReport, searchUsers } from "@/services/api";
import type { UserSearchResult } from "@/types";
import { useTranslation } from "react-i18next";

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
	fieldErrors: Record<string, string>;
	showErrors: boolean;
	setShowErrors: React.Dispatch<React.SetStateAction<boolean>>;
	isNextDisabled: boolean;
	suspects: UserSearchResult[];
	suspectInput: string;
	suspectSuggestions: UserSearchResult[];
	searchingUsers: boolean;
	victimName: string;
	setVictimName: React.Dispatch<React.SetStateAction<string>>;
	victimInput: string;
	victimSuggestions: UserSearchResult[];
	selectedVictim: UserSearchResult | null;
	setSelectedVictim: React.Dispatch<
		React.SetStateAction<UserSearchResult | null>
	>;
	setVictimInput: React.Dispatch<React.SetStateAction<string>>;
	setVictimSuggestions: React.Dispatch<
		React.SetStateAction<UserSearchResult[]>
	>;
	handleSubmit: () => Promise<void>;
	handleSuspectSearch: (value: string) => Promise<void>;
	handleVictimSearch: (value: string) => Promise<void>;
	addSuspect: (suspect: {
		id?: string;
		firstName: string;
		lastName: string;
		role?: string;
	}) => void;
	removeSuspect: (index: number) => void;
	resetForm: () => void;
}

function validateName(name: string): string | null {
	if (name.length < 2) return "Le nom doit contenir au moins 2 caractères";
	if (name.length > 100) return "Le nom ne peut pas dépasser 100 caractères";
	if (/(.)\1{4,}/.test(name))
		return "Le nom contient des caractères répétitifs invalides";
	return null;
}

function validateDescription(desc: string): string | null {
	if (desc.length < 20)
		return "La description doit contenir au moins 20 caractères";
	if (desc.length > 2000)
		return "La description ne peut pas dépasser 2000 caractères";
	if (/(.)\1{9,}/.test(desc))
		return "La description semble invalide (caractères répétitifs détectés)";
	const cleaned = desc.replace(/\s/g, "");
	if (cleaned.length > 10) {
		const freq: Record<string, number> = {};
		for (const c of cleaned) freq[c] = (freq[c] ?? 0) + 1;
		const maxFreq = Math.max(...Object.values(freq));
		if (maxFreq / cleaned.length > 0.7)
			return "La description semble invalide (caractères répétitifs détectés)";
	}
	return null;
}

export function useReportForm(
	userRole: string | undefined,
	t: (key: string) => string,
): UseReportFormReturn {
	//il faut enlever les suggestions de noms d'eleves
	const defaultWho = "temoin";

	const [step, setStep] = useState(1);
	const [whoSignals, setWhoSignals] = useState(defaultWho);
	const [type, setType] = useState("");
	const [description, setDescription] = useState("");
	const [frequency, setFrequency] = useState("");
	const [isAnonymous, setIsAnonymous] = useState(false);
	const [loading, setLoading] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
	const [showErrors, setShowErrors] = useState(false);
	const isNextDisabled =
		(step === 1 && !type) ||
		(step === 2 && (!description.trim() || !frequency));
	const [suspects, setSuspects] = useState<UserSearchResult[]>([]);
	const [suspectInput, setSuspectInput] = useState("");
	const [suspectSuggestions, setSuspectSuggestions] = useState<
		UserSearchResult[]
	>([]);
	const [searchingUsers, setSearchingUsers] = useState(false);

	const [victimName, setVictimName] = useState("");
	const [victimInput, setVictimInput] = useState("");
	const [victimSuggestions, setVictimSuggestions] = useState<
		UserSearchResult[]
	>([]);
	const [selectedVictim, setSelectedVictim] = useState<UserSearchResult | null>(
		null,
	);
	const handleNext = () => {
		const errors: Record<string, string> = {};

		if (step === 1 && !whoSignals) {
			setShowErrors(true);
			return;
		}

		if (step === 2 && !type) {
			setShowErrors(true);
			return;
		}

		if (step === 3) {
			if (!description.trim()) {
				setShowErrors(true);
				return;
			}
			const descError = validateDescription(description.trim());
			if (descError) errors.description = descError;
			if (!frequency) errors.frequency = "La fréquence est obligatoire";
		}

		if (step === 4) {
			if (victimName) {
				victimName.split("|").forEach((v, i) => {
					const trimmed = v.trim();
					if (trimmed.length > 50) {
						errors[`victim_${i}`] = t("reporter.validation.nameTooLong");
					} else {
						const err = validateName(trimmed);
						if (err) errors[`victim_${i}`] = err;
					}
				});
			}
			suspects.forEach((s, i) => {
				const fullName = `${s.firstName} ${s.lastName}`.trim();
				if (fullName.length > 50) {
					errors[`suspect_${i}`] = t("reporter.validation.nameTooLong");
				} else {
					const err = validateName(fullName);
					if (err) errors[`suspect_${i}`] = err;
				}
			});
		}

		if (Object.keys(errors).length > 0) {
			setFieldErrors(errors);
			setShowErrors(true);
			return;
		}

		setFieldErrors({});
		setShowErrors(false);
		setStep((s) => s + 1);
	};

	//some translations to be done
	const handleSubmit = async () => {
		if (!type || !description || !frequency) return;
		setLoading(true);
		setSubmitError(null);
		try {
			const fullDescription = `${description} (${t("reporter.step6.frequency")}: ${frequency})`;
			const suspectsData = suspects.map((s) => ({
				freeText: `${s.firstName} ${s.lastName}`,
			}));
			const victimsData = victimName ? [{ freeText: victimName }] : [];

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
			const messages = err?.response?.data?.message ?? err?.message;
			if (Array.isArray(messages) && messages.length > 0) {
				setSubmitError(messages.join(" — "));
			} else if (typeof messages === "string") {
				setSubmitError(messages);
			} else {
				setSubmitError(t("reporter.submitError"));
			}
		} finally {
			setLoading(false);
		}
	};

	const clearFieldErrors = () => setFieldErrors({});

	const handleSuspectSearch = async (value: string) => {
		setSuspectInput(value);
	};

	const addSuspect = (suspect: {
		id?: string;
		firstName: string;
		lastName: string;
		role?: string;
	}) => {
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

	const handleVictimSearch = async (value: string) => {
		setVictimInput(value);
		setSelectedVictim(null);
		setVictimName(value);
		if (value.length < 2) {
			setVictimSuggestions([]);
			return;
		}
		try {
			setVictimSuggestions(await searchUsers(value));
		} catch {
			setVictimSuggestions([]);
		}
	};

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
	};

	return {
		step,
		setStep,
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
		fieldErrors,

		showErrors,
		setShowErrors,
		isNextDisabled,
		suspects,
		suspectInput,
		suspectSuggestions,
		searchingUsers,
		victimName,
		setVictimName,
		victimInput,
		setVictimInput,
		victimSuggestions,
		setVictimSuggestions,
		selectedVictim,
		setSelectedVictim,
		handleSubmit,
		handleNext,
		clearFieldErrors,
		handleSuspectSearch,
		addSuspect,
		removeSuspect,
		resetForm,
	};
}

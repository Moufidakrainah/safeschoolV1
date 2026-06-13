import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useStudentReportForm } from "@/hooks/useStudentReportForm";
import { Button } from "@/components/ui/button";
import StepBar from "@/components/StepBar";
import type { AuthUser } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

interface StudentFormProps {
	user: AuthUser | null;
}

export default function StudentForm({ user }: StudentFormProps) {
	const { t } = useTranslation();

	const typeOptions = [
		{ label: t("reporter.step2.physical"), value: "physique", sub: t("reporter.step2.physicalSub") },
		{ label: t("reporter.step2.verbal"),   value: "verbal",   sub: t("reporter.step2.verbalSub") },
		{ label: t("reporter.step2.cyber"),    value: "cyber",    sub: t("reporter.step2.cyberSub") },
		{ label: t("reporter.step2.exclusion"),value: "exclusion",sub: t("reporter.step2.exclusionSub") },
		{ label: t("reporter.step2.sexual"),   value: "sexual",   sub: t("reporter.step2.sexualSub") },
	];

	const {
		step, setStep,
		whoSignals, setWhoSignals,
		type, setType,
		description, setDescription,
		frequency, setFrequency,
		isAnonymous, setIsAnonymous,
		loading, submitError,
		showErrors, setShowErrors,
		isNextDisabled,
		fieldErrors,
		handleNext,
		suspects, suspectInput, setSuspectInput,
		victimName,
		victimInput, setVictimInput,
		selectedVictim, setSelectedVictim, setVictimName,
		handleSubmit, clearFieldErrors,
		validateDescription, validateName, descriptionError, setDescriptionError,
		victimError, setVictimError,
		suspectError, setSuspectError,
		addSuspect,
		removeSuspect,
		resetForm,
	} = useStudentReportForm(user?.role, t);

	const steps = [
		t("reporter.steps.who"),
		t("reporter.steps.type"),
		t("reporter.steps.facts"),
		t("reporter.steps.people"),
		t("reporter.steps.evidence"),
		t("reporter.steps.validate"),
	];

	const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

	useEffect(() => {
		const index = typeOptions.findIndex((o) => o.value === type);
		if (index >= 0) cardRefs.current[index]?.focus();
	}, [type]);

	// Écran de confirmation
	if (step === 7) {
		return (
			<section className="page-section">
				<div className="bg-surface shadow-sm px-6 py-8">
					<StepBar steps={steps} currentStep={step} />
					<div className="w-full mt-8">
						<div>
							<h2 className="font-bold text-lg mb-2">{t("reporter.success.title")}</h2>
							<div className="text-sm mb-6">{t("reporter.success.message")}</div>
							<div className="text-center mt-6">
								<Button onClick={resetForm}>{t("reporter.success.back")}</Button>
							</div>
						</div>
					</div>
				</div>
			</section>
		);
	}

	return (
		<section className="page-section">
			<div className="bg-surface shadow-sm px-6 py-8">
				<StepBar steps={steps} currentStep={step} />
				<div className="mt-8">
					<div>

						{/* ── Étape 1 : Victime ou témoin ── */}
						{step === 1 && (
							<fieldset>
								<legend className="font-bold text-lg mb-2">
									{t("reporter.step1.title")}
								</legend>
								<div className="grid grid-cols-2 gap-3 mt-6">
									<button
										onClick={() => setWhoSignals("victime")}
										className={`px-6 py-6 rounded-lg border-2 ${
											whoSignals === "victime" ? "border-primary bg-white" : "border-gray-200"
										}`}
									>
										<div className="text-m font-semibold">{t("reporter.step2.iAmTheVictim")}</div>
										<div className="text-sm text-gray-600 mt-1">{t("reporter.step2.iWasHarassed")}</div>
									</button>
									<button
										onClick={() => setWhoSignals("temoin")}
										className={`px-6 py-6 rounded-lg border-2 ${
											whoSignals === "temoin" ? "border-primary bg-white" : "border-gray-200"
										}`}
									>
										<div className="text-m font-semibold text-primary">{t("reporter.step2.iAmTheWitness")}</div>
										<div className="text-sm text-primary mt-1">{t("reporter.step2.iSawHarassed")}</div>
									</button>
								</div>
								{showErrors && !whoSignals && (
									<p role="alert" className="mt-3 text-sm text-critical">
										{t("reporter.step2.chooseOne")}
									</p>
								)}
							</fieldset>
						)}

						{/* ── Étape 2 : Type de harcèlement ── */}
						{step === 2 && (
							<fieldset>
								<legend className="text-primary font-bold text-lg mb-2">
									{t("reporter.step2.title")}
								</legend>
								<div className="grid grid-cols-2 gap-3 mt-6">
									{typeOptions.map((opt, index) => (
										<button
											key={opt.value}
											onClick={() => setType(opt.value)}
											className={`px-6 py-6 rounded-lg text-center border-2 outline-none ${
												type === opt.value ? "border-primary bg-white" : "border-gray-200"
											}`}
										>
											<div className="text-m font-semibold">{opt.label}</div>
											<div className="text-sm mt-1">{opt.sub}</div>
										</button>
									))}
								</div>
								{showErrors && !type && (
									<p role="alert" className="mt-3 text-sm text-critical">
										{t("reporter.validation.typeRequired")}
									</p>
								)}
							</fieldset>
						)}

						{/* ── Étape 3 : Description + fréquence ── */}
						{step === 3 && (
							<div>
								<h2 className="font-bold text-lg mb-2">{t("reporter.step3.title")}</h2>
								<div className="text-m font-semibold mt-6 mb-6">{t("reporter.step3.descriptionLabel")}</div>
								<Textarea
									id="description"
									value={description}
									onChange={(e) => {
										setDescription(e.target.value);
										setDescriptionError(validateDescription(e.target.value));
									}}
									placeholder={t("reporter.step3.descriptionPlaceholder")}
									rows={7}
									className="bg-white px-4 py-4 border-2 border-gray-200 rounded-lg"
								/>
								{showErrors && !description && !fieldErrors.description && (
									<p role="alert" className="mt-4 text-sm text-critical">
										{t("reporter.validation.descriptionRequired")}
									</p>
								)}
								{descriptionError && (
									<p role="alert" className="mt-4 text-sm text-critical">{descriptionError}</p>
								)}
								{fieldErrors.description && (
									<p role="alert" className="mt-4 text-sm text-critical">{fieldErrors.description}</p>
								)}
								<label className="block mb-2 mt-4 text-sm font-semibold text-gray-700">
									{t("reporter.step3.frequencyLabel")}
								</label>
								<Select value={frequency} onValueChange={(v) => setFrequency(v)}>
									<SelectTrigger id="frequency" className="bg-white">
										<SelectValue>
											{{
												"Une fois": t("reporter.step3.freq1"),
												"Deux fois": t("reporter.step3.freq2"),
												"Trois fois ou plus": t("reporter.step3.freq3"),
												"Tous les jours": t("reporter.step3.freq4"),
											}[frequency] || t("reporter.step3.frequencyPlaceholder")}
										</SelectValue>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="Une fois">{t("reporter.step3.freq1")}</SelectItem>
										<SelectItem value="Deux fois">{t("reporter.step3.freq2")}</SelectItem>
										<SelectItem value="Trois fois ou plus">{t("reporter.step3.freq3")}</SelectItem>
										<SelectItem value="Tous les jours">{t("reporter.step3.freq4")}</SelectItem>
									</SelectContent>
								</Select>
								{showErrors && !frequency && !fieldErrors.frequency && (
									<p role="alert" className="mt-2 text-sm text-critical">
										{t("reporter.validation.frequencyRequired")}
									</p>
								)}
								{fieldErrors.frequency && (
									<p role="alert" className="mt-2 text-sm text-critical">{fieldErrors.frequency}</p>
								)}
							</div>
						)}

						{/* ── Étape 4 : Victime et suspects ── */}
						{step === 4 && (
							<div>
								<h2 className="font-bold text-lg mb-2">{t("reporter.step4.title")}</h2>

								{/* Victimes */}
								<div className="mb-3 mt-6 text-m font-semibold">{t("reporter.step4.victimLabel")}</div>
								<div className="flex gap-2 items-center">
									<input
										type="text"
										value={victimInput}
										onChange={e => setVictimInput(e.target.value)}
										onKeyDown={e => {
											if (e.key === 'Enter' && victimInput.trim()) {
												e.preventDefault();
												const err = validateName(victimInput.trim());
												if (err) { setVictimError(err); return; }
												setVictimError('');
												setVictimName(prev => prev ? prev + '|' + victimInput.trim() : victimInput.trim());
												setVictimInput('');
											}
										}}
										placeholder={t("reporter.step4.peoplePlaceholder")}
										className="flex-1 px-4 bg-white py-3 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
									/>
									<Button
										variant={victimInput.trim().length >= 2 ? "primary" : "outline"}
										onClick={() => {
											if (victimInput.trim()) {
												const err = validateName(victimInput.trim());
												if (err) { setVictimError(err); return; }
												setVictimError('');
												setVictimName(prev => prev ? prev + '|' + victimInput.trim() : victimInput.trim());
												setVictimInput('');
												clearFieldErrors();
											}
										}}
										disabled={!victimInput.trim()}
									>
										{t("reporter.step4.addVictim")}
									</Button>
								</div>
								<p className="text-xs mt-4">{t("reporter.step4.add+Victim")}</p>
								{victimError && <p role="alert" className="text-sm text-red-600 mt-1">{victimError}</p>}

								{victimName && (
									<div className="mt-4">
										<div className="flex flex-wrap gap-2">
											{victimName.split("|").map((v, i) => (
												<div key={i} className="flex flex-col gap-1">
													<div className="flex gap-2 bg-surface px-3 py-1 rounded-full text-sm">
														<span>{v}</span>
														<button
															onClick={() => {
																const arr = victimName.split("|").filter((_, idx) => idx !== i);
																setVictimName(arr.join("|"));
																clearFieldErrors();
															}}
															className="text-critical font-bold cursor-pointer"
														>x</button>
													</div>
													{fieldErrors[`victim_${i}`] && (
														<p className="text-xs text-critical pl-2">{fieldErrors[`victim_${i}`]}</p>
													)}
												</div>
											))}
										</div>
									</div>
								)}

								{/* Suspects */}
								<div className="mt-5" />
								<label className="block mb-3 mt-6 text-m font-semibold">
									{t("reporter.step4.suspectsLabel")}
								</label>
								<div className="flex gap-2 items-center">
									<input
										type="text"
										value={suspectInput}
										onChange={e => setSuspectInput(e.target.value)}
										onKeyDown={e => {
											if (e.key === 'Enter' && suspectInput.trim()) {
												e.preventDefault();
												addSuspect({ firstName: suspectInput.trim(), lastName: '' });
											}
										}}
										placeholder={t("reporter.step4.peoplePlaceholder")}
										className="flex-1 bg-white px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
									/>
									<Button
										variant={suspectInput.trim().length >= 2 ? "primary" : "outline"}
										onClick={() => {
											if (suspectInput.trim()) {
												addSuspect({ firstName: suspectInput.trim(), lastName: "" });
												clearFieldErrors();
											}
										}}
										disabled={suspectInput.trim().length < 2}
									>
										{t("reporter.step4.addSuspect")}
									</Button>
								</div>
								<p className="text-xs mt-4">{t("reporter.step4.add+Suspect")}</p>
								{suspectError && <p role="alert" className="text-sm text-red-600 mt-1">{suspectError}</p>}

								{suspects.length > 0 && (
									<div className="mt-4">
										<div className="flex flex-wrap gap-2">
											{suspects.map((s, i) => (
												<div key={i} className="flex flex-col gap-1">
													<div className="flex items-center gap-2 bg-surface px-3 py-1 rounded-full text-sm">
														<span>{s.firstName} {s.lastName}</span>
														<button
															onClick={() => { removeSuspect(i); clearFieldErrors(); }}
															className="text-critical font-bold cursor-pointer bg-transparent border-none"
														>x</button>
													</div>
													{fieldErrors[`suspect_${i}`] && (
														<p className="text-xs text-critical pl-2">{fieldErrors[`suspect_${i}`]}</p>
													)}
												</div>
											))}
										</div>
									</div>
								)}
							</div>
						)}

						{/* ── Étape 5 : Preuves ── */}
						{step === 5 && (
							<div>
								<h2 className="font-bold text-lg mb-2">{t("reporter.step5.title")}</h2>
								<div className="mb-3 mt-6 text-m font-semibold">{t("reporter.step5.subtitle")}</div>
								<div className="p-4 text-m text-center">{t("reporter.step5.soon")}</div>
							</div>
						)}

						{/* ── Étape 6 : Récapitulatif ── */}
						{step === 6 && (
							<div>
								<h2 className="font-bold text-lg mb-6">{t("reporter.step6.title")}</h2>
								<dl className="text-m space-y-3">
									{(
										[
											{
												label: t("reporter.step6.who"),
												value: whoSignals === "victime" ? t("reporter.step6.victim") : t("reporter.step6.suspect"),
											},
											{ label: t("reporter.step6.type"), value: type },
											{ label: t("reporter.step6.description"), value: description },
											{ label: t("reporter.step6.frequency"), value: frequency },
											...(victimName ? [{ label: t("reporter.step6.victims"), value: victimName.split("|").join(", ") }] : []),
											...(suspects.length > 0 ? [{ label: t("reporter.step6.suspects"), value: suspects.map((s) => `${s.firstName} ${s.lastName}`).join(", ") }] : []),
										] as const
									).map((row) => (
										<div key={row.label} className="flex gap-2">
											<div className="font-semibold min-w-[110px]">{row.label} :</div>
											<div>{row.value}</div>
										</div>
									))}
								</dl>
								<label className="flex items-center gap-3 cursor-pointer text-m mb-6 mt-6">
									<Checkbox
										checked={isAnonymous}
										onCheckedChange={setIsAnonymous}
										className="bg-white border-2 border-gray-200"
									/>
									<span>{t("reporter.step6.anonymous")}</span>
								</label>
								{submitError && (
									<div role="alert" className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-2">
										{submitError}
									</div>
								)}
							</div>
						)}

						{/* ── Navigation ── */}
						<div className="flex justify-between mt-8">
							{step > 1 && (
								<Button
									variant={step === 1 ? "ghost" : "primary"}
									onClick={() => { setShowErrors(false); setStep((s) => s - 1); }}
									disabled={step === 1}
								>
									← {t("common.previous")}
								</Button>
							)}
							<div className="ml-auto">
								{step < 6 ? (
									<Button onClick={() => { handleNext(); }}>
										{t("common.next")} →
									</Button>
								) : (
									<Button variant="success" onClick={handleSubmit} disabled={loading}>
										{loading ? t("reporter.submitting") : t("reporter.submit")}
									</Button>
								)}
							</div>
						</div>

					</div>
				</div>
			</div>
		</section>
	);
}
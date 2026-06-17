import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { WifiOff } from "lucide-react";
import { useReportForm } from "@/hooks/useReportForm";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import StepBar from "@/components/StepBar";
import type { AuthUser } from "@/types";
import { Checkbox } from "@/components/ui/checkbox";

const MAX_VICTIMS = 5;
const MAX_SUSPECTS = 5;

interface ReporterFormProps {
  user: AuthUser | null;
}

export default function ReporterForm({ user }: ReporterFormProps) {
  const { t } = useTranslation();
  const online = useOnlineStatus();

  const {
    step,
    setStep,
    type,
    setType,
    description,
    setDescription,
    frequency,
    setFrequency,
    whoSignals,
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
    victimInput,
    setVictimInput,
    setVictimName,
    handleSubmit,
    addSuspect,
    removeSuspect,
    resetForm,
    descriptionErrorKey,
    setDescriptionErrorKey,
    frequencyErrorKey,
    victimErrorKey,
    setVictimErrorKey,
    suspectErrorKey,
    setSuspectErrorKey,
    validateDescriptionKey,
    validateNameKey,
  } = useReportForm(user?.role, t);

  const steps = [
    t("reporter.steps.type"),
    t("reporter.steps.facts"),
    t("reporter.steps.people"),
    t("reporter.steps.evidence"),
    t("reporter.steps.validate"),
  ];

  const typeOptions = [
    {
      label: t("reporter.step2.physical"),
      value: "physique",
      sub: t("reporter.step2.physicalSub"),
    },
    {
      label: t("reporter.step2.verbal"),
      value: "verbal",
      sub: t("reporter.step2.verbalSub"),
    },
    {
      label: t("reporter.step2.cyber"),
      value: "cyber",
      sub: t("reporter.step2.cyberSub"),
    },
    {
      label: t("reporter.step2.exclusion"),
      value: "exclusion",
      sub: t("reporter.step2.exclusionSub"),
    },
    {
      label: t("reporter.step2.sexual"),
      value: "sexuel",
      sub: t("reporter.step2.sexualSub"),
    },
  ];

  const cardRefs = useRef<(HTMLButtonElement | null)[]>([]);
  useEffect(() => {
    const index = typeOptions.findIndex((o) => o.value === type);
    if (index >= 0) cardRefs.current[index]?.focus();
    // typeOptions est recréé à chaque rendu mais ses `value` sont constants ; on
    // ne dépend que de `type` pour ne déplacer le focus que sur changement de type.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  // ── Helpers limites ──
  const victimCount = victimName
    ? victimName.split("|").filter(Boolean).length
    : 0;
  const victimFull = victimCount >= MAX_VICTIMS;
  const suspectFull = suspects.length >= MAX_SUSPECTS;

  const handleAddVictim = () => {
    if (!victimInput.trim() || victimFull) return;
    const errKey = validateNameKey(victimInput.trim());
    if (errKey) {
      setVictimErrorKey(errKey);
      return;
    }
    const existing = victimName ? victimName.split("|").filter(Boolean) : [];
    if (existing.includes(victimInput.trim())) return;
    setVictimErrorKey("");
    setVictimName((prev) =>
      prev ? prev + "|" + victimInput.trim() : victimInput.trim(),
    );
    setVictimInput("");
  };

  const handleAddSuspect = () => {
    if (!suspectInput.trim() || suspectFull) return;
    const errKey = validateNameKey(suspectInput.trim());
    if (errKey) {
      setSuspectErrorKey(errKey);
      return;
    }
    setSuspectErrorKey("");
    addSuspect({ firstName: suspectInput.trim(), lastName: "" });
  };

  if (step === 6) {
    return (
      <section className="page-section">
        <div className="bg-surface shadow-sm px-6 py-8">
          <StepBar steps={steps} currentStep={step} />
          <div className="w-full mt-8">
            <h2 className="font-bold text-lg mb-2">
              {t("reporter.success.title")}
            </h2>
            <p className="text-sm mb-6">{t("reporter.success.message")}</p>
            <div className="bg-surface rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-600">
                {t("reporter.success.notice")}
              </p>
            </div>
            <div className="text-center">
              <Button onClick={resetForm}>{t("reporter.success.back")}</Button>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="page-section">
      <div className="bg-surface shadow-sm px-6 py-8">
        <h1 className="sr-only">{t("reporter.title.createAReport")}</h1>
        <StepBar steps={steps} currentStep={step} />
        <div className="w-full mt-8">
          <div>
            {/* ── Étape 1 : Type ── */}
            {step === 1 && (
              <fieldset>
                <legend className="font-bold text-lg mb-2">
                  {t("reporter.step2.title")}
                </legend>
                <div className="grid grid-cols-2 gap-3 mt-6">
                  {typeOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setType(opt.value)}
                      className={`px-6 py-6 rounded-lg text-center border-2 outline-none ${type === opt.value ? "border-primary bg-white" : "border-gray-200"}`}
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

            {/* ── Étape 2 : Description + fréquence ── */}
            {step === 2 && (
              <div>
                <h2 className="font-bold text-lg mb-2">
                  {t("reporter.step3.title")}
                </h2>
                <div className="text-m font-semibold mt-6 mb-6">
                  {t("reporter.step3.descriptionLabel")}
                </div>
                <Textarea
                  id="description"
                  value={description}
                  rows={7}
                  maxLength={2000}
                  onChange={(e) => {
                    setDescription(e.target.value);
                    setDescriptionErrorKey(
                      validateDescriptionKey(e.target.value) ?? "",
                    );
                  }}
                  placeholder={t("reporter.step3.descriptionPlaceholder")}
                  className="bg-white px-4 py-4 border-2 border-gray-200 rounded-lg"
                />
                <p className="text-xs text-gray-400 text-right mt-1">
                  {description.length}/2000
                </p>
                {/* t(clé) au rendu → se met à jour au changement de langue */}
                {(descriptionErrorKey ||
                  (showErrors && !description.trim())) && (
                  <p role="alert" className="mb-4 text-sm text-critical">
                    {descriptionErrorKey
                      ? t(descriptionErrorKey)
                      : t("validation.descRequired")}
                  </p>
                )}
                <label className="block mb-2 mt-4 text-m font-semibold">
                  {t("reporter.step3.frequencyLabel")}
                </label>
                <Select
                  value={frequency}
                  onValueChange={(v) => {
                    if (v !== null) setFrequency(v);
                  }}
                >
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
                    <SelectItem value="Une fois">
                      {t("reporter.step3.freq1")}
                    </SelectItem>
                    <SelectItem value="Deux fois">
                      {t("reporter.step3.freq2")}
                    </SelectItem>
                    <SelectItem value="Trois fois ou plus">
                      {t("reporter.step3.freq3")}
                    </SelectItem>
                    <SelectItem value="Tous les jours">
                      {t("reporter.step3.freq4")}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {(frequencyErrorKey || (showErrors && !frequency)) && (
                  <p role="alert" className="mt-2 text-sm text-critical">
                    {frequencyErrorKey
                      ? t(frequencyErrorKey)
                      : t("reporter.validation.frequencyRequired")}
                  </p>
                )}
              </div>
            )}

            {/* ── Étape 3 : Victimes + suspects ── */}
            {step === 3 && (
              <div>
                <h2 className="font-bold text-lg mb-2">
                  {t("reporter.step4.title")}
                </h2>

                {/* Victimes */}
                <div className="mb-3 mt-6 text-m font-semibold">
                  {t("reporter.step4.victimLabel")}
                </div>
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <input
                    type="text"
                    value={victimInput}
                    maxLength={50}
                    onChange={(e) => setVictimInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddVictim();
                      }
                    }}
                    placeholder={t("reporter.step4.peoplePlaceholder")}
                    className="flex-1 px-4 bg-white py-3 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  <Button
                    variant={
                      victimInput.trim().length >= 2 && !victimFull
                        ? "default"
                        : "outline"
                    }
                    onClick={handleAddVictim}
                    disabled={victimInput.trim().length < 2 || victimFull}
                  >
                    {t("reporter.step4.addVictim")}
                  </Button>
                </div>
                <p className="text-xs mt-2 text-gray-400">
                  {t("reporter.step4.add+Victim")}
                </p>
                {victimFull && (
                  <p className="text-xs text-orange-500 mt-1">
                    {t("reporter.step4.maxVictims")}
                  </p>
                )}
                {victimErrorKey && (
                  <p role="alert" className="text-sm text-critical mt-1">
                    {t(victimErrorKey)}
                  </p>
                )}

                {victimName && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {victimName
                      .split("|")
                      .filter(Boolean)
                      .map((v, i) => (
                        <div
                          key={i}
                          className="flex gap-2 bg-surface px-3 py-1 rounded-full text-sm"
                        >
                          <span>{v}</span>
                          <button
                            onClick={() =>
                              setVictimName(
                                victimName
                                  .split("|")
                                  .filter((_, idx) => idx !== i)
                                  .join("|"),
                              )
                            }
                            className="text-critical font-bold cursor-pointer"
                          >
                            x
                          </button>
                        </div>
                      ))}
                  </div>
                )}

                {/* Suspects */}
                <div className="mt-5" />
                <label className="block mb-3 mt-6 text-m font-semibold">
                  {t("reporter.step4.suspectsLabel")}
                </label>
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                  <input
                    type="text"
                    value={suspectInput}
                    maxLength={50}
                    onChange={(e) => setSuspectInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddSuspect();
                      }
                    }}
                    placeholder={t("reporter.step4.peoplePlaceholder")}
                    className="flex-1 bg-white px-4 py-3 border-2 border-gray-200 rounded-lg text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                  <Button
                    variant={
                      suspectInput.trim().length >= 2 && !suspectFull
                        ? "default"
                        : "outline"
                    }
                    onClick={handleAddSuspect}
                    disabled={suspectInput.trim().length < 2 || suspectFull}
                  >
                    {t("reporter.step4.addSuspect")}
                  </Button>
                </div>
                <p className="text-xs mt-2 text-gray-400">
                  {t("reporter.step4.add+Suspect")}
                </p>
                {suspectFull && (
                  <p className="text-xs text-orange-500 mt-1">
                    {t("reporter.step4.maxSuspects")}
                  </p>
                )}
                {suspectErrorKey && (
                  <p role="alert" className="text-sm text-critical mt-1">
                    {t(suspectErrorKey)}
                  </p>
                )}

                {suspects.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    {suspects.map((s, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 bg-surface px-3 py-1 rounded-full text-sm"
                      >
                        <span>
                          {s.firstName} {s.lastName}
                        </span>
                        <button
                          onClick={() => removeSuspect(i)}
                          className="text-critical font-bold cursor-pointer bg-transparent border-none"
                        >
                          x
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Étape 4 : Preuves ── */}
            {step === 4 && (
              <div>
                <h2 className="font-bold text-lg mb-2">
                  {t("reporter.step5.title")}
                </h2>
                <div className="mb-3 mt-6 text-m font-semibold">
                  {t("reporter.step5.subtitle")}
                </div>
                <div className="p-4 text-m text-center">
                  {t("reporter.step5.soon")}
                </div>
              </div>
            )}

            {/* ── Étape 5 : Récapitulatif ── */}
            {step === 5 && (
              <div>
                <h2 className="font-bold text-lg mb-2">
                  {t("reporter.step6.title")}
                </h2>
                <dl className="text-m space-y-3">
                  {(
                    [
                      { label: t("reporter.step6.who"), value: whoSignals },
                      {
                        label: t("reporter.step6.type"),
                        value: t(
                          (
                            {
                              physique: "reporter.step2.physical",
                              verbal: "reporter.step2.verbal",
                              cyber: "reporter.step2.cyber",
                              exclusion: "reporter.step2.exclusion",
                              sexuel: "reporter.step2.sexual",
                            } as Record<string, string>
                          )[type] ?? type,
                        ),
                      },
                      {
                        label: t("reporter.step6.description"),
                        value: description,
                      },
                      {
                        label: t("reporter.step6.frequency"),
                        value:
                          (
                            {
                              "Une fois": t("reporter.step3.freq1"),
                              "Deux fois": t("reporter.step3.freq2"),
                              "Trois fois ou plus": t("reporter.step3.freq3"),
                              "Tous les jours": t("reporter.step3.freq4"),
                            } as Record<string, string>
                          )[frequency] ?? frequency,
                      },
                      ...(victimName
                        ? [
                            {
                              label: t("reporter.step6.victims"),
                              value: victimName
                                .split("|")
                                .filter(Boolean)
                                .join(", "),
                            },
                          ]
                        : []),
                      ...(suspects.length > 0
                        ? [
                            {
                              label: t("reporter.step6.suspects"),
                              value: suspects
                                .map((s) => `${s.firstName} ${s.lastName}`)
                                .join(", "),
                            },
                          ]
                        : []),
                    ] as const
                  ).map((row) => (
                    <div key={row.label} className="flex gap-2">
                      <div className="font-semibold min-w-[110px]">
                        {row.label} :
                      </div>
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
                  <div
                    role="alert"
                    className="flex items-center gap-2 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-2"
                  >
                    {submitError}
                  </div>
                )}
              </div>
            )}

            {/* Hors ligne : la soumission est bloquée, on l'explique au lieu de laisser échouer */}
            {!online && step === 5 && (
              <div
                role="status"
                className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-sm px-4 py-3 rounded-lg mt-4"
              >
                <WifiOff aria-hidden="true" className="h-4 w-4 shrink-0" />
                {t("offline.actionUnavailable")}
              </div>
            )}

            {/* ── Navigation ── */}
            <div className="flex justify-between mt-8">
              {step > 1 && (
                <Button
                  variant="default"
                  onClick={() => {
                    setShowErrors(false);
                    setStep((s) => s - 1);
                  }}
                  disabled={step === 1}
                >
                  ← {t("common.previous")}
                </Button>
              )}
              <div className="ml-auto">
                {step < 5 ? (
                  <Button
                    onClick={() => {
                      if (isNextDisabled) {
                        setShowErrors(true);
                        return;
                      }
                      setShowErrors(false);
                      setStep((s) => s + 1);
                    }}
                  >
                    {t("common.next")} →
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    variant="success"
                    disabled={loading || !online}
                  >
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

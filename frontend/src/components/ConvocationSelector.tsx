import { useTranslation } from "react-i18next";
import type { Report } from "@/types";
import { Checkbox } from "./ui/checkbox";

interface ConvocationSelectorProps {
  selected: Report;
  checkedIds: string[];
  onToggle: (id: string) => void;
}

export default function ConvocationSelector({
  selected,
  checkedIds,
  onToggle,
}: ConvocationSelectorProps) {
  const { t } = useTranslation();
  if (!selected) return null;

  const people: { id: string; role: string; fullName: string }[] = [];

  // Alerteur (si pas anonyme)
  if (!selected.isAnonymous && selected.student) {
    people.push({
      id: "alerteur",
      role:
        selected.reporter === "victime"
          ? t("admin.convocation.victimReporter")
          : t("admin.convocation.reporter"),
      fullName: `${selected.student.firstName} ${selected.student.lastName}`,
    });
  }

  // Victimes liées — exclure l'alerteur lui-même
  const extraVictims =
    selected.victims?.filter(
      (v) => v.resolvedUser && v.resolvedUser.id !== selected.student?.id,
    ) ?? [];
  extraVictims.forEach((v, i: number) => {
    people.push({
      id: `victim_${v.resolvedUser?.id ?? ""}`,
      role:
        extraVictims.length > 1
          ? `${t("admin.convocation.victim")} ${i + 1}`
          : t("admin.convocation.victim"),
      fullName: `${v.resolvedUser?.firstName ?? ""} ${v.resolvedUser?.lastName ?? ""}`,
    });
  });

  // Suspects liés uniquement — utilise s.id pour éviter les doublons
  const linkedSuspects = selected.suspects?.filter((s) => s.resolvedUser) ?? [];
  linkedSuspects.forEach((s, i: number) => {
    people.push({
      id: `suspect_${s.id}`,
      role:
        linkedSuspects.length > 1
          ? `${t("admin.convocation.suspect")} ${i + 1}`
          : t("admin.convocation.suspect"),
      fullName: `${s.resolvedUser?.firstName ?? ""} ${s.resolvedUser?.lastName ?? ""}`,
    });
  });

  if (people.length === 0) {
    return (
      <p className="text-sm text-gray-400 mb-4">
        {t("admin.convocation.noRecipient")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 mb-5">
      {people.map((p) => (
        <div key={p.id} className="flex items-center gap-2">
          <Checkbox
            id={p.id}
            checked={checkedIds.includes(p.id)}
            onCheckedChange={() => onToggle(p.id)}
          />
          <label htmlFor={p.id} className="text-sm cursor-pointer">
            <strong>{p.role}</strong> — {p.fullName}
          </label>
        </div>
      ))}
    </div>
  );
}

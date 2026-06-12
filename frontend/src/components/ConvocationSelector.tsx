import { Checkbox } from "./ui/checkbox";
interface ConvocationSelectorProps {
  selected: any;
  checkedIds: string[];
  onToggle: (id: string) => void;
}
export default function ConvocationSelector({ selected, checkedIds, onToggle }: ConvocationSelectorProps) {
  if (!selected) return null;
  const people: { id: string; role: string; fullName: string }[] = [];

  // Alerteur (si pas anonyme)
  if (!selected.isAnonymous && selected.student) {
    people.push({
      id: 'alerteur',
      role: selected.reporter === 'victime' ? 'Victime / Alerteur' : 'Alerteur',
      fullName: `${selected.student.firstName} ${selected.student.lastName}`,
    });
  }

  // Victimes liées — exclure l'alerteur lui-même
  const extraVictims = selected.victims
    ?.filter((v: any) => v.resolvedUser && v.resolvedUser.id !== selected.student?.id) ?? [];
  extraVictims.forEach((v: any, i: number) => {
    people.push({
      id: `victim_${v.resolvedUser.id}`,
      role: extraVictims.length > 1 ? `Victime ${i + 1}` : 'Victime',
      fullName: `${v.resolvedUser.firstName} ${v.resolvedUser.lastName}`,
    });
  });

  // Suspects liés uniquement — utilise l'userId comme identifiant
  const linkedSuspects = selected.suspects?.filter((s: any) => s.resolvedUser) ?? [];
  linkedSuspects.forEach((s: any, i: number) => {
    people.push({
      id: `suspect_${s.resolvedUser.id}`,
      role: linkedSuspects.length > 1 ? `Suspect ${i + 1}` : 'Suspect',
      fullName: `${s.resolvedUser.firstName} ${s.resolvedUser.lastName}`,
    });
  });

  if (people.length === 0) {
    return (
      <p className="text-sm text-gray-400 mb-4">
        Aucune personne à convoquer — liez d'abord les suspects/victimes à un élève.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3 mb-5">
      <p className="text-xs font-semibold text-gray-500 mb-1">Sélectionner les destinataires :</p>
      {people.map(p => (
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

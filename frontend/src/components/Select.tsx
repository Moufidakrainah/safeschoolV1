// ============================================================
// SELECT
//
// Champ de sélection stylisé, aligné avec les tokens du design system.
//
// Props :
//   value     : valeur contrôlée
//   onChange  : handler de changement
//   children  : éléments <option>
//   className : classes Tailwind supplémentaires (optionnel)
//
// Utilisation :
//   <Select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
//     <option value="all">Tous les statuts</option>
//     <option value="pending">En attente</option>
//   </Select>
// ============================================================

interface SelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
  disabled?: boolean;
}

export default function Select({ value, onChange, children, className = '', 'aria-label': ariaLabel, disabled }: SelectProps) {
  return (
    <select
      value={value}
      onChange={onChange}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none cursor-pointer bg-white text-gray-700 focus:border-primary transition-all ${className}`}
    >
      {children}
    </select>
  );
}

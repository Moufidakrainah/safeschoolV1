// ============================================================
// STATCARD
//
// Carte de statistique cliquable avec indicateur de filtre actif.
// Utilisé dans le tableau de bord pour afficher des compteurs.
//
// Props :
//   label    : texte affiché sous le chiffre
//   value    : nombre à afficher
//   color    : couleur hex (texte + bordure active)
//   active   : true si ce filtre est actif (bordure + scale)
//   onClick  : callback au clic (optionnel)
//
// Utilisation :
//   <StatCard
//     label="Critique"
//     value={stats.critical}
//     color={SEVERITY_COLORS.critical}
//     active={filterGrade === 'critique'}
//     onClick={() => { setFilterGrade('critique'); setCurrentPage(1); }}
//   />
// ============================================================

interface StatCardProps {
  label: string;
  value: number;
  color: string;
  active?: boolean;
  onClick?: () => void;
}

export default function StatCard({ label, value, color, active, onClick }: StatCardProps) {
  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e => (e.key === 'Enter' || e.key === ' ') && onClick()) : undefined}
      aria-label={onClick ? `${label} : ${value}` : undefined}
      aria-pressed={onClick ? active : undefined}
      style={{ borderBottom: `5px solid ${active ? color : 'transparent'}` }}
      className={`bg-gray-100 p-3 text-center transition-all ${onClick ? 'cursor-pointer' : ''} ${active ? 'scale-105' : 'scale-100'}`}
    >
      <div style={{ color }} className="text-3xl font-bold" aria-hidden="true">{value}</div>
      <div style={{ color }} className="text-sm mt-1" aria-hidden="true">{label}</div>
    </div>
  );
}

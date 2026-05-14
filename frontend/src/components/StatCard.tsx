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
//     label="Critical"
//     value={stats.critical}
//     color={SEVERITY_COLORS.critical}
//     active={filterGrade === 'critical'}
//     onClick={() => { setFilterGrade('critical'); setCurrentPage(1); }}
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
	<>
		<div
			onClick={onClick}
			role={onClick ? 'button' : undefined}
			tabIndex={onClick ? 0 : undefined}
			onKeyDown={onClick ? (e => (e.key === 'Enter' || e.key === ' ') && onClick()) : undefined}
			aria-label={onClick ? `${label} : ${value}` : undefined}
			aria-pressed={onClick ? active : undefined}
			style={{ 
				borderBottom: `5px solid 
				${active ? color : 'transparent'}`,
				backgroundColor: active ? `${color}` : '#f3f4f6', 
				color: active ? '#f3f4f6' : `${color}`
			}}
			className={`
			p-3 text-center transition-all 
			${onClick ? 'cursor-pointer' : ''} 
			${active ? 'scale-105' : 'scale-100'}
			`}
		>
		<div className={`text-3xl font-bold ${active ? 'text-white' : '' }`} aria-hidden="true">{value}</div>
		<div className={`text-sm mt-1" ${active ? 'text-white' : ''}`} aria-hidden="true">{label}</div>
		</div>
	</>
  );
}

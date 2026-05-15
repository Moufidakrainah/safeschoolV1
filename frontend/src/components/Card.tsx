// ============================================================
// CARD
//
// Conteneur blanc avec ombre légère.
// Supporte une bordure gauche colorée dynamique (gravité des signalements).
//
// Props :
//   children    : contenu du card
//   borderColor : couleur hex pour la bordure gauche (optionnel)
//   className   : classes Tailwind supplémentaires  (optionnel)
//
// Utilisation :
//   <Card>Contenu simple</Card>
//   <Card borderColor={SEVERITY_COLORS[severityFromApiGrade(report.grade)]}>
//     ...
//   </Card>
//   <Card className="mb-6">...</Card>
// ============================================================

interface CardProps {
  children: React.ReactNode;
  borderColor?: string;
  className?: string;
  title?: string;
}

export default function Card({ children, borderColor, className = '', title }: CardProps) {
  return (
    <div
      style={borderColor ? { borderLeft: `5px solid ${borderColor}` } : {}}
      className={`mb-8 bg-white p-6 shadow-sm ${className}`}
    >
		<h3 className="text-primary text-sm font-bold mb-4">{title}</h3>
		
      {children}
    </div>
  );
}

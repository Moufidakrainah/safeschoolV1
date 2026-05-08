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
}

export default function Card({ children, borderColor, className = '' }: CardProps) {
  return (
    <div
      style={borderColor ? { borderLeft: `5px solid ${borderColor}` } : {}}
      className={`bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

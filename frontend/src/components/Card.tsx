interface CardProps {
  children: React.ReactNode;
  borderColor?: string;   // pour les bordures dynamiques de gravité
  className?: string;
}

export default function Card({ children, borderColor, className = '' }: CardProps) {
  return (
    <div
      style={borderColor ? { borderLeft: `5px solid ${borderColor}` } : {}}
      className={`
        bg-white p-6 shadow-sm
        ${className}
      `}>
      {children}
    </div>
  );
}
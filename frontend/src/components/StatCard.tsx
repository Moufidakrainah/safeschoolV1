interface StatCardProps {
  label: string;
  value: number;
  color: string;
  active?: boolean;
  onClick?: () => void;
  activeTextColor?: string;
}

export default function StatCard({ label, value, color, active, onClick, activeTextColor = 'white' }: StatCardProps) {
  const borderColor = active
    ? `color-mix(in oklab, ${color} 60%, black)`
    : `color-mix(in oklab, ${color} 35%, white)`;

  const textColor = active ? activeTextColor : 'var(--foreground)';

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e => (e.key === 'Enter' || e.key === ' ') && onClick()) : undefined}
      aria-label={onClick ? `${label} : ${value}` : undefined}
      aria-pressed={onClick ? active : undefined}
      style={{
        // backgroundColor,
        backgroundColor: active ? color : '#f3f4f6',
        border: `1px solid ${color}`,
        color: textColor,
      }}
      className={`p-1 text-center transition-all ${onClick ? 'cursor-pointer' : ''} ${active ? 'scale-110 shadow-sm' : 'scale-100'}`}
    >
      <div className="pt-1 text-1xl font-bold" aria-hidden="true">{value}</div>
      <div className="text-sm mt-1" aria-hidden="true">{label}</div>
    </div>
  );
}
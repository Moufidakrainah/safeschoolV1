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
      style={{ borderBottom: `5px solid ${active ? color : 'transparent'}` }}
      className={`
        bg-gray-100 p-3 text-center cursor-pointer transition-all
        ${active ? 'scale-105' : 'scale-100'}
      `}>
      <div style={{ color }} className="text-3xl font-bold">{value}</div>
      <div style={{ color }} className="text-sm mt-1">{label}</div>
    </div>
  );
}
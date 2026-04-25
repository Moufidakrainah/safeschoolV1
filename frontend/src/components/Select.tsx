interface SelectProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  children: React.ReactNode;
  className?: string;
}

export default function Select({ value, onChange, children, className = '' }: SelectProps) {
  return (
    <select
      value={value}
      onChange={onChange}
      className={`
        px-3 py-2 border-2 border-gray-200 rounded-lg text-sm outline-none
        cursor-pointer bg-white text-gray-700
        focus:border-[#0097b2] transition-all
        ${className}
      `}>
      {children}
    </select>
  );
}
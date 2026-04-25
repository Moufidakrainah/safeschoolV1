interface InputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  className?: string;
}

export default function Input({ value, onChange, placeholder, type = 'text', className = '' }: InputProps) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`
        w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm outline-none
        focus:border-[#0097b2] transition-all
        ${className}
      `}
    />
  );
}
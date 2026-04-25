type ButtonVariant = 'primary' | 'danger' | 'success' | 'warning' | 'ghost' | 'outline';

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[#0097b2] text-white hover:opacity-90',
  danger:  'bg-[#ff3131] text-white hover:opacity-90',
  success: 'bg-[#74cc00] text-white hover:opacity-90',
  warning: 'bg-[#ffde59] text-black hover:opacity-90',
  ghost:   'bg-gray-100 text-gray-600 hover:bg-gray-200',
  outline: 'bg-transparent border border-[#0097b2] text-[#0097b2] hover:bg-[#ebfcff]',
};

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  className?: string;
}

export default function Button({ children, onClick, variant = 'primary', disabled, className = '' }: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all
        ${variantClasses[variant]}
        ${disabled ? 'opacity-40 cursor-not-allowed' : ''}
        ${className}
      `}>
      {children}
    </button>
  );
}
import { useTranslation } from 'react-i18next';

export type BadgeVariant =
   // Gravité
  | 'critical' | 'high' | 'medium' | 'low'
  // Statuts 
  | 'new' | 'in_progress' | 'pending' | 'resolved' | 'false_report';

const variantClasses: Record<BadgeVariant, string> = {
  critical:    'bg-critical text-white',
  high:        'bg-high text-gray-900',
  medium:      'bg-medium text-gray-900',
  low:         'bg-low text-gray-900',
  new:     	   'bg-sky-100 text-sky-700',
  in_progress: 'bg-amber-100 text-amber-700',
  pending:     'bg-teal-100 text-teal-700',
  resolved:    'bg-lime-100 text-lime-700',
  false_report:'bg-rose-100 text-rose-700',
};

// Clés i18n correspondant à chaque variant (vide pour 'default')
const variantI18nKeys: Record<BadgeVariant, string> = {
  critical:    'badge.critical',
  high:        'badge.high',
  medium:      'badge.medium',
  low:         'badge.low',
  new:     	   'badge.new',
  in_progress: 'badge.in_progress',
  pending:     'badge.pending',
  resolved:    'badge.resolved',
  false_report:'badge.false_report',
};

interface BadgeProps {
  variant?: BadgeVariant;
  label?: string;
  className?: string;
  onClick?: () => void;
}

export default function Badge({ variant = 'new', label, className = '', onClick }: BadgeProps) {
  const { t } = useTranslation();
  const key = variantI18nKeys[variant];
  const isClickable = Boolean(onClick);

  return (
    <span
      tabIndex={isClickable ? 0 : undefined}
      onClick={onClick}
      className={`
        px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap
        ${variantClasses[variant]}
        ${isClickable ? 'cursor-pointer hover:opacity-80' : ''}
        ${className}
      `}
    >
      {label ?? (key ? t(key) : '')}
    </span>
  );
}
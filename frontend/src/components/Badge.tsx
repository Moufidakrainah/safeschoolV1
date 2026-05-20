import { useTranslation } from 'react-i18next';

export type BadgeVariant =
   // Gravité
  | 'critical' | 'high' | 'medium' | 'low'
  // Statuts ta branche
  | 'pending' | 'in_progress' | 'closed' | 'rejected'
  // Nouveaux statuts main
  | 'new' | 'resolved' | 'false_report'
  // Neutre
  | 'default';

const variantClasses: Record<BadgeVariant, string> = {
   // Gravité
  critical:     'bg-critical text-white',
  high:         'bg-high text-gray-900',
  medium:       'bg-medium text-gray-900',
  low:          'bg-low text-gray-900',
  // Statuts ta branche
  pending:      'bg-yellow-100 text-yellow-700',
  in_progress:  'bg-blue-100 text-blue-700',
  closed:       'bg-green-100 text-green-700',
  rejected:     'bg-red-100 text-red-700',
  // Nouveaux statuts main
  new:          'bg-sky-100 text-sky-700',
  resolved:     'bg-lime-100 text-lime-700',
  false_report: 'bg-rose-100 text-rose-700',
  // Neutre
  default:      'bg-gray-100 text-gray-600',
};

// Clés i18n correspondant à chaque variant (vide pour 'default')
const variantI18nKeys: Record<BadgeVariant, string> = {
  critical:     'badge.critical',
  high:         'badge.high',
  medium:       'badge.medium',
  low:          'badge.low',
  pending:      'badge.pending',
  in_progress:  'badge.in_progress',
  closed:       'badge.closed',
  rejected:     'badge.rejected',
  new:          'badge.new',
  resolved:     'badge.resolved',
  false_report: 'badge.false_report',
  default:      '',
};

interface BadgeProps {
  variant?: BadgeVariant;
  label?: string;
  className?: string;
  onClick?: () => void;
}

export default function Badge({ variant = 'default', label, className = '', onClick }: BadgeProps) {
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
import { useTranslation } from 'react-i18next';

// ============================================================
// BADGE
//
// Affiche une étiquette colorée pour un statut ou un niveau de gravité.
//
// Variants gravité  : 'critical' | 'high' | 'medium' | 'low'
// Variants statut   : 'pending' | 'in_progress' | 'escalated' | 'closed' | 'rejected'
// Variant neutre    : 'default'
//
// Props :
//   variant   : clé de style + label i18n (optionnel, défaut: 'default')
//   label     : surcharge le texte affiché      (optionnel)
//   className : classes Tailwind supplémentaires (optionnel)
//
// Utilisation :
//   <Badge variant="pending" />
//   <Badge variant={report.status as BadgeVariant} />
//   <Badge variant="critical" label="Critique" />
// ============================================================

export type BadgeVariant =
  | 'critical' | 'high' | 'medium' | 'low'
  | 'pending' | 'in_progress' | 'escalated' | 'closed' | 'rejected'
  | 'default';

const variantClasses: Record<BadgeVariant, string> = {
  critical:    'bg-critical text-white',
  high:        'bg-high text-gray-900',
  medium:      'bg-medium text-gray-900',
  low:         'bg-low text-gray-900',
  pending:     'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  escalated:   'bg-purple-100 text-purple-700',
  closed:      'bg-green-100 text-green-700',
  rejected:    'bg-red-100 text-red-700',
  default:     'bg-gray-100 text-gray-600',
};

// Clés i18n correspondant à chaque variant (vide pour 'default')
const variantI18nKeys: Record<BadgeVariant, string> = {
  critical:    'badge.critical',
  high:        'badge.high',
  medium:      'badge.medium',
  low:         'badge.low',
  pending:     'badge.pending',
  in_progress: 'badge.in_progress',
  escalated:   'badge.escalated',
  closed:      'badge.closed',
  rejected:    'badge.rejected',
  default:     '',
};

interface BadgeProps {
  variant?: BadgeVariant;
  label?: string;
  className?: string;
}

export default function Badge({ variant = 'default', label, className = '' }: BadgeProps) {
  const { t } = useTranslation();
  const key = variantI18nKeys[variant];
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${variantClasses[variant]} ${className}`}>
      {label ?? (key ? t(key) : '')}
    </span>
  );
}

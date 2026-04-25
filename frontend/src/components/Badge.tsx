type BadgeVariant = 'critique' | 'grave' | 'moyen' | 'faible' | 'pending' | 'in_progress' | 'escalated' | 'closed' | 'rejected' | 'default';

const variantClasses: Record<BadgeVariant, string> = {
  critique:    'bg-[#ff3131] text-white',
  grave:       'bg-[#ff914d] text-white',
  moyen:       'bg-[#ffde59] text-black',
  faible:      'bg-[#74cc00] text-white',
  pending:     'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  escalated:   'bg-purple-100 text-purple-700',
  closed:      'bg-green-100 text-green-700',
  rejected:    'bg-red-100 text-red-700',
  default:     'bg-gray-100 text-gray-600',
};

const variantLabels: Record<BadgeVariant, string> = {
  critique:    '🔴 Critiqueaaa',
  grave:       '🟠 Grave',
  moyen:       '🟡 Moyen',
  faible:      '🟢 Faible',
  pending:     '⏳ En attente',
  in_progress: '🔄 En cours',
  escalated:   '🚨 Escaladé',
  closed:      '✅ Clôturé',
  rejected:    '❌ Rejeté',
  default:     '',
};

interface BadgeProps {
  variant?: BadgeVariant;
  label?: string;   // si tu veux surcharger le label par défaut
  className?: string;
}

export default function Badge({ variant = 'default', label, className = '' }: BadgeProps) {
  return (
    <span className={`
      px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap
      ${variantClasses[variant]}
      ${className}
    `}>
      {label ?? variantLabels[variant]}
    </span>
  );
}
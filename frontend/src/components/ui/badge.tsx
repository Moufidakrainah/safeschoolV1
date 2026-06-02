import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useTranslation } from 'react-i18next';

export type BadgeVariant =
  'all' | 'new' | 'in_progress' | 'pending' | 'resolved' | 'false_report';

const variantI18nKeys: Record<BadgeVariant, string> = {
  all:          'badge.all',
  new:          'badge.new',
  in_progress:  'badge.in_progress',
  pending:      'badge.pending',
  resolved:     'badge.resolved',
  false_report: 'badge.false_report',
};

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all",
  {
    variants: {
      variant: {
        all:          'bg-gray-100 text-gray-700',
        new:          'bg-sky-100 text-sky-700',
        in_progress:  'bg-amber-100 text-amber-700',
        pending:      'bg-teal-100 text-teal-700',
        resolved:     'bg-lime-100 text-lime-700',
        false_report: 'bg-rose-100 text-rose-700',
      },
    },
    defaultVariants: { variant: "new" },
  }
)

interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  label?: string;
  onClick?: () => void;
}

export function Badge({ className, variant = "new", label, onClick, ...props }: BadgeProps) {
  const { t } = useTranslation();
  const key = variantI18nKeys[variant ?? 'new'];
  return (
    <span
      className={cn(
        badgeVariants({ variant }),
        onClick ? 'cursor-pointer hover:opacity-80' : '',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {label ?? (key ? t(key) : '')}
    </span>
  );
}

// Export par défaut pour compatibilité
export default Badge;

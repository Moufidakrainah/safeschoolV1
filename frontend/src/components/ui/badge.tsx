import { mergeProps } from "@base-ui/react/merge-props"
import { useRender } from "@base-ui/react/use-render"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { useTranslation } from 'react-i18next';


export type BadgeVariant =
   // Gravité
  | 'critical' | 'high' | 'medium' | 'low'
  // Statuts 
  | 'new' | 'in_progress' | 'pending' | 'resolved' | 'false_report';

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

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-all",
  {
    variants: {
      variant: {
			critical:    'bg-critical text-white',
			high:        'bg-high text-gray-900',
			medium:      'bg-medium text-gray-900',
			low:         'bg-low text-gray-900',
			new:     	 'bg-sky-100 text-sky-700',
			in_progress: 'bg-amber-100 text-amber-700',
			pending:     'bg-teal-100 text-teal-700',
			resolved:    'bg-lime-100 text-lime-700',
			false_report:'bg-rose-100 text-rose-700',
      },
    },
    defaultVariants: {
      variant: "new",
    },
  }
)

interface BadgeProps
  extends useRender.ComponentProps<"span">,
    VariantProps<typeof badgeVariants> {
  label?: string
}

export function Badge({
  className,
  variant = "new",
  label, 
  render,
  ...props
}: Badgeprops){
	const { t } = useTranslation()
  	const key = variantI18nKeys[variant]

  return useRender({
    defaultTagName: "span",
    props: mergeProps(
      {
        className: cn(badgeVariants({ variant }), className),
		children: label ?? (key ? t(key) : ""),
      },
      props
    ),
    render,
    state: {
      slot: "badge",
      variant,
    },
  })
}

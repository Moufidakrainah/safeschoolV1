// ─── Type ────────────────────────────────────────────────────────────────────
// Déclare la forme des props acceptées par ce composant.
// Chaque champ avec ? est optionnel — React utilisera la valeur défaut si absent.
type ButtonProps =
{
  children:   React.ReactNode;         // contenu entre les balises <Button>…</Button>
  variant?:   'primary' | 'outline' | 'danger' | 'login' | 'ghost' | 'warning' | 'success';
  type?:      'button' | 'submit' | 'reset';
  onClick?:   () => void;
  disabled?:  boolean;
  fullWidth?:  boolean;
  className?: string;
  'aria-label'?: string;
};

// ─── Styles ──────────────────────────────────────────────────────────────────
// Classes Tailwind communes à toutes les variantes.
const base = 'px-6 py-3 rounded-full font-semibold text-sm cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-primary';

// Chaque variante surcharge uniquement ce qui change (couleur, bordure…).
const variants =
{
  login:   'bg-white text-primary border border-white hover:bg-surface',
  primary: 'bg-primary text-white hover:bg-primary-hover',
  outline: 'bg-transparent text-primary border border-primary hover:bg-surface',
  danger:  'bg-critical text-white hover:opacity-90',
  ghost:   'bg-transparent text-gray-600 border border-gray-200 hover:bg-gray-50',
  warning: 'bg-purple-600 text-white hover:bg-purple-700',
  success: 'bg-green-500 text-white hover:bg-green-600',
};

// ─── Composant ───────────────────────────────────────────────────────────────
// La fonction reçoit les props, applique les valeurs défaut, retourne du JSX.
export default function Button(
{
  children,
  variant   = 'primary',
  type      = 'button',
  onClick,
  disabled  = false,
  fullWidth = false,
  className = '',
  'aria-label': ariaLabel,
}: ButtonProps)
{
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
    >
      {children}
    </button>
  );
}

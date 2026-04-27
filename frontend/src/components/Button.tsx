// ============================================================
// BUTTON
//
// Props :
//   children  : contenu du bouton (texte, JSX, etc.)
//   variant   : "primary" | "outline" | "danger" | "login"
//   type      : "button" | "submit" | "reset"   (défaut: "button")
//   onClick   : fonction appelée au clic        (optionnel)
//   disabled  : désactive le bouton             (optionnel)
//   fullWidth : prend toute la largeur          (optionnel)
//
// Utilisation :
//   <Button variant="primary" type="submit">Enregistrer</Button>
//   <Button variant="danger" onClick={handleDelete}>Supprimer</Button>
// ============================================================

// ─── Type ────────────────────────────────────────────────────────────────────
// Déclare la forme des props acceptées par ce composant.
// Chaque champ avec ? est optionnel — React utilisera la valeur défaut si absent.
type ButtonProps =
{
  children:   React.ReactNode;         // contenu entre les balises <Button>…</Button>
  variant?:   'primary' | 'outline' | 'danger' | 'login';
  type?:      'button' | 'submit' | 'reset';
  onClick?:   () => void;
  disabled?:  boolean;
  fullWidth?:  boolean;
};

// ─── Styles ──────────────────────────────────────────────────────────────────
// Classes Tailwind communes à toutes les variantes.
const base = 'px-6 py-3 rounded-full font-semibold text-sm cursor-pointer transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

// Chaque variante surcharge uniquement ce qui change (couleur, bordure…).
const variants =
{
  login:   'bg-white text-primary border border-white hover:bg-surface',
  primary: 'bg-primary text-white hover:bg-primary-hover',
  outline: 'bg-transparent text-primary border border-primary hover:bg-surface',
  danger:  'bg-critical text-white hover:opacity-90',
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
}: ButtonProps)
{
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${fullWidth ? 'w-full' : ''}`}
    >
      {children}
    </button>
  );
}

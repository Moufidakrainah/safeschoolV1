// ============================================================
// NOMDUCOMPOSANT
//
// Props :
//   propA : description
//   propB : description
//   ...
//
// Utilisation :
//   <NomDuComposant propA="valeur">Contenu</NomDuComposant>
// ============================================================

// ─── Type ────────────────────────────────────────────────────────────────────
type NomDuComposantProps =
{
  // propA:   string;
  // propB?:  boolean;
};

// ─── Styles ──────────────────────────────────────────────────────────────────
// (à activer si le composant a des variantes ou des classes longues)
// const base = '...';
// const variants = { a: '...', b: '...' };

// ─── Composant ───────────────────────────────────────────────────────────────
export default function NomDuComposant(
{
  // propA,
  // propB = false,
}: NomDuComposantProps)
{
  return (
    <div>
      {/* contenu */}
    </div>
  );
}

import { useState } from 'react';
import Button from '../components/Button';
import Input  from '../components/Input';

// ─── CodeBlock ────────────────────────────────────────────────────────────────
// Composant interne : affiche un snippet repliable. Chaque instance gère son propre état ouvert/fermé via useState.
function CodeBlock({ code }: { code: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 text-xs font-mono">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between px-4 py-2.5 font-sans text-xs font-semibold text-gray-500 transition-colors hover:text-primary"
      >
        {open ? 'Masquer le code' : 'Voir le code'}
        <span>{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <pre className="overflow-x-auto whitespace-pre border-t border-gray-200 px-4 py-3 leading-6 text-gray-700">
          <code>{code}</code>
        </pre>
      )}
    </div>
  );
}

// ─── Données couleurs ─────────────────────────────────────────────────────────
type ColorToken = {
  name: string; hex: string; bg: string; text: string;
  usage: string; tailwind: string;
};

const colors: ColorToken[] = [
  { name: 'Primary',        hex: '#0097B2', bg: 'bg-primary',      text: 'text-white',    usage: 'Navigation, CTA, accents principaux',          tailwind: 'bg-primary / text-primary / border-primary' },
  { name: 'Primary Hover',  hex: '#007A91', bg: 'bg-primary-hover', text: 'text-white',   usage: 'Hover du bouton primary uniquement',           tailwind: 'hover:bg-primary-hover' },
  { name: 'Surface',        hex: '#EBFCFF', bg: 'bg-surface',      text: 'text-gray-700', usage: 'Fond application, zones de respiration',       tailwind: 'bg-surface' },
  { name: 'Critical',       hex: '#CC0000', bg: 'bg-critical',     text: 'text-white',    usage: 'Signalements critiques, actions destructives', tailwind: 'bg-critical / text-critical / border-critical' },
  { name: 'High',           hex: '#FF914D', bg: 'bg-high',         text: 'text-gray-900', usage: "Niveau d'alerte élevé",                        tailwind: 'bg-high / text-high / border-high' },
  { name: 'Medium',         hex: '#FFDE59', bg: 'bg-medium',       text: 'text-gray-900', usage: "Niveau d'alerte moyen",                        tailwind: 'bg-medium / text-medium / border-medium' },
  { name: 'Low',            hex: '#74CC00', bg: 'bg-low',          text: 'text-gray-900', usage: "Niveau d'alerte faible",                       tailwind: 'bg-low / text-low / border-low' },
];

// ─── Snippets ─────────────────────────────────────────────────────────────────
// Ce sont les blocs de code affichés dans les CodeBlock.
// Pour utiliser un composant dans une nouvelle page, copie l'import et l'usage.
const BUTTON_IMPORT = `import Button from '../components/Button';`;
const BUTTON_USAGE = `<Button variant="primary">Enregistrer</Button>
<Button variant="outline">Annuler</Button>
<Button variant="danger" onClick={handleDelete}>Supprimer</Button>
<Button variant="login" type="submit">Se connecter</Button>
<Button variant="primary" disabled>Désactivé</Button>

// Props disponibles :
// variant  : 'primary' | 'outline' | 'danger' | 'login'
// type     : 'button' | 'submit' | 'reset'   (défaut: 'button')
// onClick  : () => void   (optionnel)
// disabled : boolean      (optionnel)
// fullWidth: boolean      (optionnel)`;

const INPUT_IMPORT = `import Input from '../components/Input';`;
const INPUT_USAGE = `// Dans ton composant, déclare un état React :
const [email, setEmail] = useState('');

// Puis utilise le composant :
<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
/>

<Input
  label="Mot de passe"
  type="password"
  value={password}
  onChange={(e) => setPassword(e.target.value)}
  theme="light"    // 'dark' par défaut (label blanc sur fond coloré)
  placeholder="••••••••"
  required
/>

// Props disponibles :
// label       : string  — texte affiché au-dessus du champ
// type        : 'text' | 'email' | 'password'
// value       : string  — valeur contrôlée (état React)
// onChange    : handler React
// theme       : 'light' | 'dark'
// placeholder : string  (optionnel)
// required    : boolean (optionnel)`;

const sampleEmail = 'prof@safeschool.test';
const samplePassword = 'motdepasse';
const noop = () => undefined;

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function UiKit() {
  return (
    <main className="min-h-screen bg-surface px-5 py-5 text-gray-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">

        {/* Header */}
        <header className="rounded-2xl bg-primary px-4 py-4 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-white/90">SafeSchool</p>
          <h1 className="mt-2 text-3xl font-black">UI KIT</h1>
          <p className="mt-1 text-sm text-white/80">
            Liste des composants réutilisables : aperçu et code.
          </p>
        </header>

        {/* ── Button ── */}
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Bouton</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* Preview */}
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <p className="mb-4 text-xs font-semibold text-gray-400">Aperçu</p>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="outline">Outline</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="login">Login</Button>
                <Button variant="primary" disabled>Disabled</Button>
              </div>
            </div>

            {/* Snippets */}
            <div className="flex flex-col">
              <p className="text-xs px-2 py-2">Import en haut de la page</p>
              <CodeBlock code={`${BUTTON_IMPORT}`} />
              <p className="text-xs px-2 py-2">Utilisation dans le JSX</p>
              <CodeBlock code={`${BUTTON_USAGE}`} />
            </div>
          </div>
        </section>

        {/* ── Input ── */}
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Champ</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* Preview */}
            <div className="flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-6">
              <p className="text-xs font-semibold text-gray-400">Aperçu</p>
              <Input label="Email" type="email" value={sampleEmail} onChange={noop} />
              <div className="rounded-lg bg-primary p-4">
                <Input label="Mot de passe" type="password" value={samplePassword} onChange={noop} theme="light" />
              </div>
            </div>

            {/* Snippets */}
            <div className="flex flex-col gap-2">
              <CodeBlock code={`// 1. Import en haut de ta page\n${INPUT_IMPORT}`} />
              <CodeBlock code={`// 2. Usage dans le JSX\n${INPUT_USAGE}`} />
            </div>
          </div>
        </section>

        {/* ── Couleurs ── */}
        <section>
          <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">Couleurs</h2>
          <div className="flex flex-col gap-2">
            {colors.map((c) => (
              <div
                key={c.name}
                className="grid items-center gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3"
                style={{ gridTemplateColumns: '2.5rem 8rem 1fr' }}
              >
                {/* Swatch */}
                <div className={`h-8 w-8 rounded-lg ${c.bg}`} />
                {/* Nom + hex */}
                <div>
                  <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                  <p className="font-mono text-xs text-gray-400">{c.hex}</p>
                </div>
                {/* Usage + classes Tailwind */}
                <div>
                  <p className="text-xs text-gray-500">{c.usage}</p>
                  <p className="mt-0.5 font-mono text-xs text-primary">{c.tailwind}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </main>
  );
}
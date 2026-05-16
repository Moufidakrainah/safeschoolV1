/* ─────────────────────────────────────────────────────────────────────────────
   UI Kit — SafeSchool Design System
   Showcase des composants shadcn/ui (primitives Radix) + composants app custom.
   Voir docs/design/design-system.md pour la stratégie complète.
───────────────────────────────────────────────────────────────────────────── */

// shadcn/ui primitives
import { Button as ShadButton }   from '@/components/ui/button';
import { Badge  as ShadBadge }    from '@/components/ui/badge';
import { Input  as ShadInput }    from '@/components/ui/input';
import { Label }                  from '@/components/ui/label';
import { Separator }              from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Card as ShadCard,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select as ShadSelect,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Composants app custom
import AppBadge    from '../components/Badge';
import AppCard     from '../components/Card';
import AppInput    from '../components/Input';
import AppSelect   from '../components/Select';
import StatCard    from '../components/StatCard';
import NoteBlock   from '../components/NoteBlock';


// ─── Données statiques ────────────────────────────────────────────────────────

const colorTokens = [
  { name: 'Primary',        hex: '#006278', cls: 'bg-primary',       token: '--color-primary / bg-primary / text-primary' },
  { name: 'Primary hover',  hex: '#004f62', cls: 'bg-primary-hover',  token: '--color-primary-hover / hover:bg-primary-hover' },
  { name: 'Surface',        hex: '#EBFCFF', cls: 'bg-surface',        token: '--color-surface / bg-surface' },
  { name: 'Critical',       hex: '#CC0000', cls: 'bg-critical',       token: '--color-critical / bg-critical / text-critical' },
  { name: 'High',           hex: '#FF914D', cls: 'bg-high',           token: '--color-high / bg-high / text-high' },
  { name: 'Medium',         hex: '#FFDE59', cls: 'bg-medium',         token: '--color-medium / bg-medium / text-medium' },
  { name: 'Low',            hex: '#74CC00', cls: 'bg-low',            token: '--color-low / bg-low / text-low' },
];

const sampleNote   = { id: '1', content: 'Note administrative exemple',       type: 'note',         createdAt: new Date().toISOString(), author: { firstName: 'Admin', lastName: 'Dupont' } };
const sampleConvoc = { id: '2', content: 'Vous êtes convoqué le 5 mai à 14h', type: 'convocation',  createdAt: new Date().toISOString(), author: { firstName: 'Admin', lastName: 'Dupont' } };

// ─── Helpers de mise en page ──────────────────────────────────────────────────

function KitSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</p>
      {children}
    </div>
  );
}

function PreviewBox({ className = '', children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={`rounded-xl border border-gray-200 bg-white p-6 ${className}`}>
      {children}
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function UiKit() {
  return (
    <main className="min-h-screen bg-surface px-5 py-8 text-gray-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">

        {/* ── En-tête ── */}
        <header className="rounded-2xl bg-primary px-6 py-6 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-white/70">SafeSchool — Design System</p>
          <h1 className="mt-2 text-3xl font-black">UI Kit</h1>
          <p className="mt-1 text-sm text-white/80">
            Catalogue des composants. Primitives shadcn/ui (Radix) + composants app métier.
          </p>
        </header>

        {/* ════════════════════════════════════════════════════════════════════
            ONGLETS
        ════════════════════════════════════════════════════════════════════ */}
        <Tabs defaultValue="shadcn">
          <TabsList className="mb-2">
            <TabsTrigger value="shadcn">shadcn/ui primitives</TabsTrigger>
            <TabsTrigger value="app">Composants app</TabsTrigger>
            <TabsTrigger value="tokens">Design tokens</TabsTrigger>
          </TabsList>

          {/* ── Onglet 1 : shadcn/ui ── */}
          <TabsContent value="shadcn" className="flex flex-col gap-8">

            <KitSection label="Button">
              <PreviewBox className="flex flex-wrap gap-3">
                <ShadButton>Default</ShadButton>
                <ShadButton variant="secondary">Secondary</ShadButton>
                <ShadButton variant="outline">Outline</ShadButton>
                <ShadButton variant="ghost">Ghost</ShadButton>
                <ShadButton variant="destructive">Destructive</ShadButton>
                <ShadButton variant="link">Link</ShadButton>
                <ShadButton size="sm">Small</ShadButton>
                <ShadButton size="lg">Large</ShadButton>
                <ShadButton disabled>Disabled</ShadButton>
              </PreviewBox>
            </KitSection>

            <KitSection label="Badge">
              <PreviewBox className="flex flex-wrap gap-2">
                <ShadBadge>Default</ShadBadge>
                <ShadBadge variant="secondary">Secondary</ShadBadge>
                <ShadBadge variant="outline">Outline</ShadBadge>
                <ShadBadge variant="destructive">Destructive</ShadBadge>
              </PreviewBox>
            </KitSection>

            <KitSection label="Input + Label">
              <PreviewBox className="flex flex-col gap-4 max-w-sm">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="demo-email">Adresse e-mail</Label>
                  <ShadInput id="demo-email" type="email" placeholder="alice@safeschool.fr" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="demo-pwd">Mot de passe</Label>
                  <ShadInput id="demo-pwd" type="password" placeholder="••••••••" />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="demo-disabled">Désactivé</Label>
                  <ShadInput id="demo-disabled" disabled placeholder="Non éditable" />
                </div>
              </PreviewBox>
            </KitSection>

            <KitSection label="Select">
              <PreviewBox className="max-w-xs">
                <ShadSelect>
                  <SelectTrigger>
                    <SelectValue placeholder="Choisir un statut…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="closed">Clôturé</SelectItem>
                  </SelectContent>
                </ShadSelect>
              </PreviewBox>
            </KitSection>

            <KitSection label="Card">
              <div className="grid grid-cols-2 gap-4">
                <ShadCard>
                  <CardHeader>
                    <CardTitle>Titre de la carte</CardTitle>
                    <CardDescription>Description secondaire optionnelle</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Contenu de la carte. Peut contenir n'importe quel markup.</p>
                  </CardContent>
                </ShadCard>
                <ShadCard>
                  <CardHeader>
                    <CardTitle>Avec action</CardTitle>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <p className="text-sm text-muted-foreground">Une carte avec un bouton d'action.</p>
                    <ShadButton size="sm" className="w-fit">Voir le détail</ShadButton>
                  </CardContent>
                </ShadCard>
              </div>
            </KitSection>

            <KitSection label="Avatar">
              <PreviewBox className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src="" alt="AB" />
                  <AvatarFallback>AB</AvatarFallback>
                </Avatar>
                <Avatar>
                  <AvatarFallback className="bg-primary text-white">SA</AvatarFallback>
                </Avatar>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-medium">Alice Bernard</p>
                  <p className="text-xs text-muted-foreground">Professeure principale</p>
                </div>
              </PreviewBox>
            </KitSection>

            <KitSection label="Separator">
              <PreviewBox className="flex flex-col gap-4">
                <p className="text-sm">Section A</p>
                <Separator />
                <p className="text-sm">Section B</p>
                <div className="flex items-center gap-4">
                  <span className="text-sm">Gauche</span>
                  <Separator orientation="vertical" className="h-4" />
                  <span className="text-sm">Droite</span>
                </div>
              </PreviewBox>
            </KitSection>

          </TabsContent>

          {/* ── Onglet 2 : Composants app ── */}
          <TabsContent value="app" className="flex flex-col gap-8">

            <KitSection label="Button — variantes projet">
              <PreviewBox className="flex flex-wrap gap-3">
                <ShadButton variant="default">Default / Primary</ShadButton>
                <ShadButton variant="outline">Outline</ShadButton>
                <ShadButton variant="ghost">Ghost</ShadButton>
                <ShadButton variant="destructive">Destructive</ShadButton>
                <ShadButton variant="danger">Danger</ShadButton>
                <ShadButton variant="warning">Warning</ShadButton>
                <ShadButton variant="success">Success</ShadButton>
                <ShadButton variant="login">Login</ShadButton>
                <ShadButton variant="default" disabled>Désactivé</ShadButton>
              </PreviewBox>
            </KitSection>

            <KitSection label="AppInput">
              <PreviewBox className="flex flex-col gap-4 max-w-sm">
                <AppInput label="Avec label" type="text" value="" onChange={() => {}} />
                <AppInput type="text" value="" onChange={() => {}} placeholder="Sans label" />
                <div className="rounded-lg bg-primary p-4">
                  <AppInput label="Sur fond coloré (theme light)" type="password" value="" onChange={() => {}} theme="light" />
                </div>
              </PreviewBox>
            </KitSection>

            <KitSection label="AppSelect">
              <PreviewBox className="flex flex-col gap-3 max-w-xs">
                <AppSelect value="" onChange={() => {}}>
                  <option value="">Tous les statuts</option>
                  <option value="pending">En attente</option>
                  <option value="closed">Clôturé</option>
                </AppSelect>
                <AppSelect value="" onChange={() => {}} disabled>
                  <option>Désactivé</option>
                </AppSelect>
              </PreviewBox>
            </KitSection>

            <KitSection label="AppBadge — Sévérité">
              <PreviewBox className="flex flex-wrap gap-2">
                <AppBadge variant="critical" />
                <AppBadge variant="high" />
                <AppBadge variant="medium" />
                <AppBadge variant="low" />
              </PreviewBox>
            </KitSection>

            <KitSection label="AppBadge — Statut">
              <PreviewBox className="flex flex-wrap gap-2">
                <AppBadge variant="pending" />
                <AppBadge variant="in_progress" />
                <AppBadge variant="escalated" />
                <AppBadge variant="closed" />
                <AppBadge variant="rejected" />
                <AppBadge variant="default" />
              </PreviewBox>
            </KitSection>

            <KitSection label="AppCard">
              <div className="flex flex-col gap-3">
                <AppCard>
                  <p className="text-sm text-gray-700">Carte simple (sans bordure)</p>
                </AppCard>
                <AppCard borderColor="#CC0000">
                  <p className="text-sm text-gray-700">Bordure gauche — critique</p>
                </AppCard>
                <AppCard borderColor="#FF914D">
                  <p className="text-sm text-gray-700">Bordure gauche — grave</p>
                </AppCard>
              </div>
            </KitSection>

            <KitSection label="StatCard">
              <div className="grid grid-cols-4 gap-4">
                <StatCard label="Total"      value={42} color="#1a1a2e" />
                <StatCard label="Critique"   value={3}  color="#CC0000" active />
                <StatCard label="Grave"      value={7}  color="#FF914D" />
                <StatCard label="En attente" value={12} color="#eab308" />
              </div>
            </KitSection>

            <KitSection label="NoteBlock">
              <div className="flex flex-col gap-3">
                <NoteBlock note={sampleNote} />
                <NoteBlock note={sampleConvoc} />
              </div>
            </KitSection>

          </TabsContent>

          {/* ── Onglet 3 : Design tokens ── */}
          <TabsContent value="tokens" className="flex flex-col gap-8">

            <KitSection label="Palette de couleurs">
              <div className="flex flex-col gap-2">
                {colorTokens.map(c => (
                  <div
                    key={c.name}
                    className="grid items-center gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3"
                    style={{ gridTemplateColumns: '2.5rem 9rem 1fr' }}
                  >
                    <div className={`h-8 w-8 rounded-lg border border-black/10 ${c.cls}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                      <p className="font-mono text-xs text-gray-400">{c.hex}</p>
                    </div>
                    <p className="font-mono text-xs text-primary">{c.token}</p>
                  </div>
                ))}
              </div>
            </KitSection>

            <KitSection label="Typographie">
              <PreviewBox className="flex flex-col gap-4">
                <p className="text-4xl font-black text-gray-900">Heading XL — font-black</p>
                <p className="text-2xl font-bold text-gray-900">Heading L — font-bold</p>
                <p className="text-xl font-semibold text-gray-800">Heading M — font-semibold</p>
                <Separator />
                <p className="text-base text-gray-700">Corps de texte — text-base. Geist Variable, fallback system-ui.</p>
                <p className="text-sm text-gray-600">Texte secondaire — text-sm</p>
                <p className="text-xs text-gray-400">Légende / métadonnée — text-xs</p>
                <p className="font-mono text-sm text-gray-700">Code / token — font-mono</p>
              </PreviewBox>
            </KitSection>

            <KitSection label="Radius">
              <PreviewBox className="flex gap-4 items-end">
                {(['sm', 'md', 'lg', 'xl', '2xl', 'full'] as const).map(r => (
                  <div key={r} className="flex flex-col items-center gap-1">
                    <div className={`h-12 w-12 bg-primary/20 border-2 border-primary rounded-${r}`} />
                    <span className="text-xs text-gray-400">{r}</span>
                  </div>
                ))}
              </PreviewBox>
            </KitSection>

          </TabsContent>
        </Tabs>

      </div>
    </main>
  );
}

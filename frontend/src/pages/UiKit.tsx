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
import { Badge }              from '@/components/ui/badge';
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
// import AppBadge    from '@/components/ASupprimerBadge';
import StatCard    from '@/components/StatCard';
import NoteBlock   from '@/components/NoteBlock';

import { useTranslation } from 'react-i18next';
import { SEVERITY_COLORS } from '@/utils/severity';

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
const { t } = useTranslation();
	
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
                <ShadBadge variant="all">All</ShadBadge>
                <ShadBadge variant="new">New</ShadBadge>
                <ShadBadge variant="false_report">False report</ShadBadge>
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

            <KitSection label="Input (shadcn)">
              <PreviewBox className="flex flex-col gap-4 max-w-sm">
                <div className="flex flex-col gap-1.5">
                  <Label htmlFor="kit-text">Avec label</Label>
                  <ShadInput id="kit-text" type="text" placeholder="Texte libre" />
                </div>
                <ShadInput type="text" placeholder="Sans label" />
                <div className="rounded-lg bg-primary p-4">
                  <div className="flex flex-col gap-1.5">
                    <Label htmlFor="kit-pwd" className="text-white text-sm font-medium">Sur fond coloré</Label>
                    <ShadInput id="kit-pwd" type="password" placeholder="••••••••" className="rounded-full bg-white text-gray-800 border-none px-4 py-3 h-auto text-sm" />
                  </div>
                </div>
              </PreviewBox>
            </KitSection>

            <KitSection label="Select (shadcn)">
              <PreviewBox className="flex flex-col gap-3 max-w-xs">
                <ShadSelect>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">En attente</SelectItem>
                    <SelectItem value="closed">Clôturé</SelectItem>
                  </SelectContent>
                </ShadSelect>
                <ShadSelect disabled>
                  <SelectTrigger>
                    <SelectValue placeholder="Désactivé" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="x">Option</SelectItem>
                  </SelectContent>
                </ShadSelect>
              </PreviewBox>
            </KitSection>

            <KitSection label="Badge — Statut">
              <PreviewBox className="flex flex-wrap gap-2">
                <Badge variant="new" />
                <Badge variant="in_progress" />
                <Badge variant="pending" />
                <Badge variant="resolved" />
                <Badge variant="false_report" />
                {/* <Badge variant="default" /> */}
              </PreviewBox>
            </KitSection>

            <KitSection label="Card (shadcn)">
              <div className="flex flex-col gap-3">
                <ShadCard className="p-6 shadow-sm">
                  <p className="text-sm text-gray-700">Carte simple (sans bordure)</p>
                </ShadCard>
                <ShadCard className="p-6 shadow-sm" style={{ borderLeft: '5px solid #CC0000' }}>
                  <p className="text-sm text-gray-700">Bordure gauche — critical</p>
                </ShadCard>
                <ShadCard className="p-6 shadow-sm" style={{ borderLeft: '5px solid #FF914D' }}>
                  <p className="text-sm text-gray-700">Bordure gauche — grave</p>
                </ShadCard>
              </div>
            </KitSection>

            <KitSection label="StatCard">
              <div className="grid grid-cols-5 gap-4">
                <StatCard label={t('badge.total')}      value={42} color={SEVERITY_COLORS.all} activeTextColor="var(--foreground)" />
                <StatCard label={t('badge.critical')}   value={3}  color={SEVERITY_COLORS.critical} active />
                <StatCard label={t('badge.high')}       value={7}  color={SEVERITY_COLORS.high} />
                <StatCard label={t('badge.medium')}     value={8}  color={SEVERITY_COLORS.medium} />
                <StatCard label={t('badge.low')}        value={12} color={SEVERITY_COLORS.low} />
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

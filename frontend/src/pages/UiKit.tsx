import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import Footer from '../components/Footer';
import Input from '../components/Input';
import NoteBlock from '../components/NoteBlock';
import Pagination from '../components/Pagination';
import Select from '../components/Select';
import StatCard from '../components/StatCard';
import StepBar from '../components/StepBar';
import Autocomplete from '../components/Autocomplete';
import Header from '../components/Header';
import ReporterHeader from '../components/ReporterHeader';
import AdminHeader from '../components/layout/AdminHeader/AdminHeader';
import type { Report } from '../types';

const colors = [
  { name: 'Primaire',        hex: '#006278', bg: 'bg-primary',      tailwind: 'bg-primary / text-primary / border-primary' },
  { name: 'Primaire survol', hex: '#004f62', bg: 'bg-primary-hover', tailwind: 'hover:bg-primary-hover' },
  { name: 'Surface',         hex: '#EBFCFF', bg: 'bg-surface',      tailwind: 'bg-surface' },
  { name: 'Critique',        hex: '#CC0000', bg: 'bg-critical',     tailwind: 'bg-critical / text-critical / border-critical' },
  { name: 'Grave',           hex: '#FF914D', bg: 'bg-high',         tailwind: 'bg-high / text-high / border-high' },
  { name: 'Moyen',           hex: '#FFDE59', bg: 'bg-medium',       tailwind: 'bg-medium / text-medium / border-medium' },
  { name: 'Faible',          hex: '#74CC00', bg: 'bg-low',          tailwind: 'bg-low / text-low / border-low' },
];

const sampleNote   = { id: '1', content: 'Note administrative exemple', type: 'note',        createdAt: new Date().toISOString(), author: { firstName: 'Admin', lastName: 'Dupont' } };
const sampleConvoc = { id: '2', content: 'Vous etes convoque le 5 mai a 14h', type: 'convocation', createdAt: new Date().toISOString(), author: { firstName: 'Admin', lastName: 'Dupont' } };

const sampleUser = {
  id: '1',
  email: 'alice@safeschool.fr',
  firstName: 'Alice',
  lastName: 'Martin',
  role: 'teacher' as const,
};

const sampleAutocompleteSuggestions = [
  { id: '1', firstName: 'Alice', lastName: 'Martin', role: 'teacher' as const },
  { id: '2', firstName: 'Bob',   lastName: 'Dupont', role: 'student' as const },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">{title}</h2>
      {children}
    </section>
  );
}

function Category({
  eyebrow,
  title,
  description,
  tone = 'component',
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  tone?: 'component' | 'reference';
  children: React.ReactNode;
}) {
  const toneClasses = tone === 'component'
    ? {
        shell: 'border-primary/15 bg-white/60',
        eyebrow: 'text-primary',
        divider: 'bg-primary/10',
      }
    : {
        shell: 'border-amber-200 bg-amber-50/70',
        eyebrow: 'text-amber-700',
        divider: 'bg-amber-200',
      };

  return (
    <section className={`rounded-4xl border px-5 py-5 shadow-sm ${toneClasses.shell}`}>
      <div className="mb-8">
        <p className={`text-xs font-bold uppercase tracking-[0.25em] ${toneClasses.eyebrow}`}>{eyebrow}</p>
        <div className={`mt-3 h-px w-full ${toneClasses.divider}`} />
        <h2 className="mt-4 text-2xl font-black text-gray-900">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm text-gray-600">{description}</p>
      </div>
      <div className="flex flex-col gap-8">{children}</div>
    </section>
  );
}

export default function UiKit() {
  return (
    <main className="flex-1 bg-surface px-5 py-5 text-gray-900">
      <div className="mx-auto flex max-w-5xl flex-col gap-10">

        <header className="rounded-2xl bg-primary px-4 py-4 text-white">
          <p className="text-xs font-bold uppercase tracking-widest text-white/90">SafeSchool</p>
          <h1 className="mt-2 text-3xl font-black">UI Kit</h1>
          <p className="mt-1 text-sm text-white/80">Galerie des composants disponibles.</p>
        </header>

        <Category
          eyebrow="Niveau 1"
          title="Composants React"
          description="Les blocs ci-dessous correspondent à de vrais composants réutilisables présents dans le dossier components."
        >
          {/* Button */}
          <Section title="Button">
            <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-wrap gap-3">
              <Button variant="primary">Primaire</Button>
              <Button variant="outline">Contour</Button>
              <Button variant="ghost">Fantôme</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="warning">Avertissement</Button>
              <Button variant="success">Succès</Button>
              <Button variant="login">Connexion</Button>
              <Button variant="primary" disabled>Désactivé</Button>
            </div>
          </Section>

          {/* Input */}
          <Section title="Input">
            <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-col gap-4">
              <Input label="Avec label (theme dark)" type="text" value="" onChange={() => {}} />
              <div className="rounded-lg bg-primary p-4">
                <Input label="Label sur fond colore (theme light)" type="password" value="" onChange={() => {}} theme="light" />
              </div>
              <Input type="text" value="" onChange={() => {}} placeholder="Sans label" />
            </div>
          </Section>

          {/* Select */}
          <Section title="Select">
            <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-col gap-3">
              <Select value="" onChange={() => {}}>
                <option value="">Tous les statuts</option>
                <option value="pending">En attente</option>
                <option value="closed">Cloture</option>
              </Select>
              <Select value="" onChange={() => {}} disabled>
                <option>Désactivé</option>
              </Select>
            </div>
          </Section>

          {/* Badge */}
          <Section title="Badge">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <p className="text-xs text-gray-400 mb-3">Severite</p>
              <div className="flex flex-wrap gap-2 mb-5">
                <Badge variant="critical" />
                <Badge variant="high" />
                <Badge variant="medium" />
                <Badge variant="low" />
              </div>
              <p className="text-xs text-gray-400 mb-3">Statut</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="pending" />
                <Badge variant="in_progress" />
                <Badge variant="escalated" />
                <Badge variant="closed" />
                <Badge variant="rejected" />
                <Badge variant="default" />
              </div>
            </div>
          </Section>

          {/* Card */}
          <Section title="Card">
            <div className="flex flex-col gap-3">
              <Card>
                <p className="text-sm text-gray-700">Carte simple (sans bordure)</p>
              </Card>
              <Card borderColor="#CC0000">
                <p className="text-sm text-gray-700">Carte avec bordure gauche coloree (critique)</p>
              </Card>
              <Card borderColor="#FF914D">
                <p className="text-sm text-gray-700">Carte avec bordure gauche coloree (grave)</p>
              </Card>
            </div>
          </Section>

          {/* StatCard */}
          <Section title="StatCard">
            <div className="grid grid-cols-4 gap-4">
              <StatCard label="Total" value={42} color="#1a1a2e" />
              <StatCard label="Critique" value={3} color="#CC0000" active />
              <StatCard label="Grave" value={7} color="#FF914D" />
              <StatCard label="En attente" value={12} color="#eab308" />
            </div>
          </Section>

          {/* NoteBlock */}
          <Section title="NoteBlock">
            <div className="flex flex-col gap-3">
              <NoteBlock note={sampleNote} />
              <NoteBlock note={sampleConvoc} />
            </div>
          </Section>

          {/* Pagination */}
          <Section title="Pagination">
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <Pagination currentPage={2} totalPages={5} totalItems={25} onPageChange={() => {}} />
            </div>
          </Section>

          {/* Footer */}
          <Section title="Footer">
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
              <Footer />
            </div>
          </Section>

          {/* StepBar */}
          <Section title="StepBar">
            <div className="flex flex-col gap-4">
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <StepBar steps={['Signalement', 'Suspects', 'Récapitulatif']} currentStep={1} />
              </div>
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <StepBar steps={['Signalement', 'Suspects', 'Récapitulatif']} currentStep={2} />
              </div>
              <div className="rounded-xl border border-gray-200 bg-white overflow-hidden">
                <StepBar steps={['Signalement', 'Suspects', 'Récapitulatif']} currentStep={3} />
              </div>
            </div>
          </Section>

          {/* Autocomplete */}
          <Section title="Autocomplete">
            <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-col gap-4">
              <p className="text-xs text-gray-400">Sans suggestions</p>
              <Autocomplete
                value=""
                onChange={() => {}}
                suggestions={[]}
                onSelect={() => {}}
                placeholder="Rechercher un utilisateur..."
                label="Recherche utilisateur"
              />
              <p className="text-xs text-gray-400">Avec suggestions</p>
              <Autocomplete
                value="ali"
                onChange={() => {}}
                suggestions={sampleAutocompleteSuggestions}
                onSelect={() => {}}
                placeholder="Rechercher un utilisateur..."
                label="Recherche utilisateur"
              />
            </div>
          </Section>
        </Category>

        <Category
          eyebrow="Niveau 1 — Navigation"
          title="Headers"
          description="Composants de navigation spécifiques à chaque rôle. Non réutilisables directement, mais listés ici pour référence visuelle."
        >
          {/* Header (générique) */}
          <Section title="Header (générique)">
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <Header user={sampleUser} logoutUser={() => {}} t={(k) => k} />
            </div>
          </Section>

          {/* ReporterHeader */}
          <Section title="ReporterHeader">
            <div className="flex flex-col gap-4">
              <p className="text-xs text-gray-400">Mode normal</p>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <ReporterHeader user={sampleUser} logoutUser={() => {}} t={(k) => k} />
              </div>
              <p className="text-xs text-gray-400">Mode formulaire (showCancel)</p>
              <div className="overflow-hidden rounded-xl border border-gray-200">
                <ReporterHeader user={sampleUser} logoutUser={() => {}} showCancel onCancel={() => {}} t={(k) => k} />
              </div>
            </div>
          </Section>

          {/* AdminHeader */}
          <Section title="AdminHeader">
            <div className="overflow-hidden rounded-xl border border-gray-200">
              <AdminHeader
                user={sampleUser}
                logoutUser={() => {}}
                viewSection="reports"
                setViewSection={() => {}}
                setSelected={(_: Report | null) => {}}
                fetchUsers={() => {}}
              />
            </div>
          </Section>
        </Category>

        <Category
          eyebrow="Niveau 2"
          title="Références du design system"
          description="Ces éléments documentent le système visuel global. Ils servent de référence, mais ne sont pas des composants React autonomes."
          tone="reference"
        >
          {/* Color Tokens */}
          <Section title="Color Tokens">
            <div className="flex flex-col gap-2">
              {colors.map(c => (
                <div
                  key={c.name}
                  className="grid items-center gap-4 rounded-xl border border-gray-100 bg-white px-4 py-3"
                  style={{ gridTemplateColumns: '2.5rem 8rem 1fr' }}
                >
                  <div className={`h-8 w-8 rounded-lg ${c.bg}`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{c.name}</p>
                    <p className="font-mono text-xs text-gray-400">{c.hex}</p>
                  </div>
                  <p className="font-mono text-xs text-primary">{c.tailwind}</p>
                </div>
              ))}
            </div>
          </Section>
        </Category>

      </div>
    </main>
  );
}

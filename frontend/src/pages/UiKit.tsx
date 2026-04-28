import Badge from '../components/Badge';
import Button from '../components/Button';
import Card from '../components/Card';
import Input from '../components/Input';
import NoteBlock from '../components/NoteBlock';
import Pagination from '../components/Pagination';
import Select from '../components/Select';
import StatCard from '../components/StatCard';

const colors = [
  { name: 'Primary',       hex: '#006278', bg: 'bg-primary',      tailwind: 'bg-primary / text-primary / border-primary' },
  { name: 'Primary Hover', hex: '#004f62', bg: 'bg-primary-hover', tailwind: 'hover:bg-primary-hover' },
  { name: 'Surface',       hex: '#EBFCFF', bg: 'bg-surface',      tailwind: 'bg-surface' },
  { name: 'Critical',      hex: '#CC0000', bg: 'bg-critical',     tailwind: 'bg-critical / text-critical / border-critical' },
  { name: 'High',          hex: '#FF914D', bg: 'bg-high',         tailwind: 'bg-high / text-high / border-high' },
  { name: 'Medium',        hex: '#FFDE59', bg: 'bg-medium',       tailwind: 'bg-medium / text-medium / border-medium' },
  { name: 'Low',           hex: '#74CC00', bg: 'bg-low',          tailwind: 'bg-low / text-low / border-low' },
];

const sampleNote   = { id: '1', content: 'Note administrative exemple', type: 'note',        createdAt: new Date().toISOString(), author: { firstName: 'Admin', lastName: 'Dupont' } };
const sampleConvoc = { id: '2', content: 'Vous etes convoque le 5 mai a 14h', type: 'convocation', createdAt: new Date().toISOString(), author: { firstName: 'Admin', lastName: 'Dupont' } };

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-400">{title}</h2>
      {children}
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

        {/* Button */}
        <Section title="Bouton — Button">
          <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-wrap gap-3">
            <Button variant="primary">Primary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="warning">Warning</Button>
            <Button variant="success">Success</Button>
            <Button variant="login">Login</Button>
            <Button variant="primary" disabled>Disabled</Button>
          </div>
        </Section>

        {/* Input */}
        <Section title="Champ de texte — Input">
          <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-col gap-4">
            <Input label="Avec label (theme dark)" type="text" value="" onChange={() => {}} />
            <div className="rounded-lg bg-primary p-4">
              <Input label="Label sur fond colore (theme light)" type="password" value="" onChange={() => {}} theme="light" />
            </div>
            <Input type="text" value="" onChange={() => {}} placeholder="Sans label" />
          </div>
        </Section>

        {/* Select */}
        <Section title="Menu deroulant — Select">
          <div className="rounded-xl border border-gray-200 bg-white p-6 flex flex-col gap-3">
            <Select value="" onChange={() => {}}>
              <option value="">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="closed">Cloture</option>
            </Select>
            <Select value="" onChange={() => {}} disabled>
              <option>Disabled</option>
            </Select>
          </div>
        </Section>

        {/* Badge */}
        <Section title="Badge de statut / severite — Badge">
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
        <Section title="Carte — Card">
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
        <Section title="Carte statistique — StatCard">
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Total" value={42} color="#1a1a2e" />
            <StatCard label="Critique" value={3} color="#CC0000" active />
            <StatCard label="Grave" value={7} color="#FF914D" />
            <StatCard label="En attente" value={12} color="#eab308" />
          </div>
        </Section>

        {/* NoteBlock */}
        <Section title="Bloc de note — NoteBlock">
          <div className="flex flex-col gap-3">
            <NoteBlock note={sampleNote} />
            <NoteBlock note={sampleConvoc} />
          </div>
        </Section>

        {/* Pagination */}
        <Section title="Pagination — Pagination">
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <Pagination currentPage={2} totalPages={5} totalItems={25} onPageChange={() => {}} />
          </div>
        </Section>

        {/* Couleurs */}
        <Section title="Tokens de couleur">
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

      </div>
    </main>
  );
}

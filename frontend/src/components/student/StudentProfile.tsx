/**
 * StudentProfile — section "Mon profil" du StudentDashboard.
 *
 * Affiche deux blocs :
 *   - Informations personnelles (prénom, nom, email, classe, date de naissance)
 *   - Parents / Responsables légaux
 *
 * Ce composant est purement présentationnel : il reçoit les données en props
 * et ne fait aucun appel réseau lui-même. Le chargement est géré par le parent.
 */

import type { AuthUser } from '../../types';
import { Card } from '../ui/card';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
}

interface StudentProfileProps {
  user:           AuthUser | null;
  parents:        Parent[];
  loadingParents: boolean;
}

// ─── Composant ──────────────────────────────────────────────────────────────

export default function StudentProfile({ user, parents, loadingParents }: StudentProfileProps) {
  return (
    <main className="max-w-xl mx-auto mt-8 px-5 pb-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Mon profil</h2>

      {/* Informations personnelles */}
      <Card className="p-6 mb-4 shadow-sm">
        <h3 className="text-primary font-bold text-sm mb-4">👤 Informations personnelles</h3>
        <table className="w-full text-sm">
          <tbody>
            {[
              { label: 'Prénom',            value: user?.firstName },
              { label: 'Nom',               value: user?.lastName },
              { label: 'Email',             value: user?.email },
              { label: 'Classe',            value: user?.studentProfile?.schoolClass ?? '—' },
              { label: 'Date de naissance', value: user?.studentProfile?.dateOfBirth ?? '—' },
            ].map(row => (
              <tr key={row.label} className="border-b border-gray-100">
                <td className="py-2 text-gray-400 font-semibold w-2/5">{row.label}</td>
                <td className="py-2 text-gray-700">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Parents / Responsables légaux */}
      <Card className="p-6 shadow-sm">
        <h3 className="text-primary font-bold text-sm mb-4">👨‍👩‍👧 Parents / Responsables légaux</h3>
        {loadingParents ? (
          <p className="text-gray-400 text-sm text-center py-4">Chargement...</p>
        ) : parents.length === 0 ? (
          <p className="text-gray-400 text-sm text-center py-4">Aucun parent enregistré</p>
        ) : (
          <div className="flex flex-col gap-4">
            {parents.map((parent, i) => (
              <div key={parent.id} className="bg-gray-50 rounded-lg p-4">
                <p className="font-semibold text-gray-800 mb-2">
                  Parent {i + 1} — {parent.firstName} {parent.lastName}
                </p>
                <table className="w-full table-fixed text-sm">
                  <tbody>
                    {[
                      { label: 'Email',     value: parent.email },
                      { label: 'Téléphone', value: parent.phone ?? '—' },
                      { label: 'Adresse',   value: parent.address ?? '—' },
                    ].map(row => (
                      <tr key={row.label} className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-400 font-semibold w-2/5">{row.label}</td>
                        <td className="py-1.5 text-gray-700">{row.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ))}
          </div>
        )}
      </Card>
    </main>
  );
}

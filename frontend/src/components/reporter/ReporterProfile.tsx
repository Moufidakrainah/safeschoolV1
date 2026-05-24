import { useTranslation } from 'react-i18next';
import type { AuthUser } from '../../types';
import { Card } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';

// ─── Types ──────────────────────────────────────────────────────────────────

interface StaffClass {
  id: string;
  level: string;
  section: string;
}

interface StaffProfile {
  profession: string;
  subject?: string;
  classes?: StaffClass[];
}

interface ReporterProfileProps {
  user:           AuthUser | null;
  staffProfile:   StaffProfile | null;
  loadingProfile: boolean;
}

// ─── Composant ──────────────────────────────────────────────────────────────

export default function ReporterProfile({ user, staffProfile, loadingProfile }: ReporterProfileProps) {
  const { t } = useTranslation();

  return (
    <main className="p-8 max-w-xl mx-auto">
    <h1 className="sr-only">{t('reporter.title.myProfile')}</h1>

      <h2 className="text-2xl font-bold mb-6 text-gray-800">{t('reporter.profile.title')}</h2>


      <div className="flex justify-center mb-6">
        <Avatar className="size-28">
          <AvatarImage src={user?.avatarUrl ?? '/teacher.png'} alt={`${user?.firstName} ${user?.lastName}`} />
          <AvatarFallback>
            {user?.firstName?.[0]}{user?.lastName?.[0]}
          </AvatarFallback>
        </Avatar>
      </div>


      {/* Informations personnelles */}
      <Card className="p-6 mb-4 shadow-sm">
        <h3 className="text-primary font-bold text-sm mb-4">👤 Informations personnelles</h3>
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            {[
              { label: t('reporter.profile.firstName'), value: user?.firstName },
              { label: t('reporter.profile.lastName'),  value: user?.lastName  },
              { label: t('reporter.profile.email'),     value: user?.email     },
            ].map(row => (
              <tr key={row.label} className="border-b border-gray-100">
                <td className="py-2 text-gray-400 font-semibold w-2/5">{row.label}</td>
                <td className="py-2 text-gray-700">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </Card>

      {/* Profil professionnel */}
      <Card className="p-6 shadow-sm">
        <h3 className="text-primary font-bold text-sm mb-4">🏫 Profil professionnel</h3>

        {loadingProfile ? (
          <p className="text-gray-400 text-sm text-center py-4">Chargement...</p>
        ) : !staffProfile ? (
          <p className="text-gray-400 text-sm text-center py-4">Aucun profil professionnel enregistré</p>
        ) : (
          <>
            <div className="overflow-x-auto">
            <table className="w-full text-sm mb-4">
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="py-2 text-gray-400 font-semibold w-2/5">Profession</td>
                  <td className="py-2 text-gray-700 capitalize">{staffProfile.profession}</td>
                </tr>
                {staffProfile.subject && (
                  <tr className="border-b border-gray-100">
                    <td className="py-2 text-gray-400 font-semibold w-2/5">Matière</td>
                    <td className="py-2 text-gray-700">{staffProfile.subject}</td>
                  </tr>
                )}
              </tbody>
            </table>
            </div>

            {staffProfile.classes.length > 0 && (
              <>
                <p className="text-gray-400 font-semibold text-sm mb-2">Classes</p>
                <div className="flex flex-wrap gap-2">
                  {staffProfile.classes.map(c => (
                    <span key={c.id} className="bg-surface text-primary text-xs font-bold px-3 py-1 rounded-full">
                      {c.level} {c.section}
                    </span>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </Card>
    </main>
  );
}

import { useTranslation } from 'react-i18next';
import type { AuthUser } from '../../types';
import { Card } from '../ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { useState } from "react";
import { formatName } from "@/utils/formatName";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/config";



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


const AVATAR_BASE = `${API_BASE}/uploads/avatars/`;



// ─── Composant ──────────────────────────────────────────────────────────────

export default function ReporterProfile({ user, staffProfile, loadingProfile }: ReporterProfileProps) {
  const { t } = useTranslation();
    const { updateUser } = useAuth();
    const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("avatar", file);
      const token = localStorage.getItem("token");
      const res = await fetch(`${API_BASE}/users/${user.id}/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.avatar) {
        setAvatar(data.avatar);
        updateUser({ avatar: data.avatar }); // ← met à jour le contexte + localStorage
      } else {
        setError("Erreur lors de l'upload");
      }
    } catch {
      setError("Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="page-section">



      {/* Avatar + nom + bouton */}
      <div className="bg-surface shadow-sm rounded-sm px-6 py-8 mb-3 flex flex-col items-center gap-3">
        <div className="flex flex-col items-center gap-3">
          {avatar ? (
            <img
              src={`${AVATAR_BASE}${avatar}?t=${Date.now()}`}
              alt={`${user?.firstName} ${user?.lastName}`}
              className="w-56 h-56 rounded-full object-cover border-4 border-primary shadow"
            />
          ) : (
            <div className="w-56 h-56 rounded-full bg-gray-200 flex items-center justify-center text-6xl font-bold text-gray-400 border-4 border-gray-200">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          )}

          <div className="text-center">
            {(() => {
              const { first, last } = formatName(user?.firstName, user?.lastName);
              return <h2 className="text-xl font-bold text-gray-800">{first} {last}</h2>;
            })()}
            <span className="text-sm text-gray-700 capitalize">{user?.role}</span>
            <p className="text-sm text-gray-700 mt-1">{user?.email}</p>
          </div>

          <label className={`cursor-pointer inline-flex items-center gap-1 h-10 px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:opacity-90 transition-opacity ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
            {uploading ? 'Upload...' : 'Changer la photo'}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
          {error && <p className="text-red-500 text-xs">{error}</p>}
        </div>
      </div>





      {/* Informations personnelles */}
      <Card className="p-6 mb-4 shadow-sm">
        <h3 className="text-primary font-bold text-sm mb-4">Informations personnelles</h3>
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
        <h3 className="text-primary font-bold text-sm mb-4">Profil professionnel</h3>

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
    {/* </main> */}
    </section>
  );
}

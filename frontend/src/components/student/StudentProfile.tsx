import { useRef, useState } from 'react';
import type { AuthUser } from '../../types';

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

const AVATAR_BASE = 'http://localhost:5000/uploads/avatars/';
const API_BASE    = 'http://localhost:5000';

export default function StudentProfile({ user, parents, loadingParents }: StudentProfileProps) {
  const [avatar, setAvatar]       = useState<string | null>(user?.avatar ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const fileInputRef              = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('avatar', file);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_BASE}/users/${user.id}/avatar`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.avatar) {
        setAvatar(data.avatar);
        // Mettre à jour le localStorage
        const saved = localStorage.getItem('user');
        if (saved) {
          const u = JSON.parse(saved);
          u.avatar = data.avatar;
          localStorage.setItem('user', JSON.stringify(u));
        }
      } else {
        setError('Erreur lors de l\'upload');
      }
    } catch {
      setError('Erreur lors de l\'upload');
    } finally {
      setUploading(false);
    }
  };

  return (
    <main className="max-w-xl mx-auto mt-8 px-5 pb-10">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Mon profil</h2>

      {/* Informations personnelles */}
      <div className="bg-white shadow rounded-lg p-6 mb-4">
        <h3 className="text-primary font-bold text-sm mb-4">👤 Informations personnelles</h3>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6 gap-3">
          {avatar ? (
            <img
              src={`${AVATAR_BASE}${avatar}?t=${Date.now()}`}
              alt={`${user?.firstName} ${user?.lastName}`}
              className="w-24 h-24 rounded-full object-cover border-4 border-primary shadow"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center text-3xl font-bold text-gray-400 border-4 border-gray-200 shadow">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </div>
          )}

          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={fileInputRef}
            onChange={handleUpload}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="text-xs px-3 py-1.5 rounded-lg border border-primary text-primary hover:bg-surface transition-colors disabled:opacity-50"
          >
            {uploading ? 'Upload en cours...' : avatar ? '🔄 Changer la photo' : '📷 Ajouter une photo'}
          </button>
          {error && <p className="text-xs text-red-500">{error}</p>}
        </div>

        <table className="w-full text-sm">
          <tbody>
            {[
              { label: 'Prénom',            value: user?.firstName },
              { label: 'Nom',               value: user?.lastName },
              { label: 'Email',             value: user?.email },
              { label: 'Classe',            value: user?.studentProfile?.schoolClass ? `${user.studentProfile.schoolClass.level} ${user.studentProfile.schoolClass.section}` : '—' },
              { label: 'Date de naissance', value: user?.studentProfile?.dateOfBirth ?? '—' },
            ].map(row => (
              <tr key={row.label} className="border-b border-gray-100">
                <td className="py-2 text-gray-400 font-semibold w-2/5">{row.label}</td>
                <td className="py-2 text-gray-700">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Parents */}
      <div className="bg-white shadow rounded-lg p-6">
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
      </div>
    </main>
  );
}

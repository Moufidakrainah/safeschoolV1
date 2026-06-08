import { useState } from "react";
import type { AuthUser } from "../../types";
import { formatName } from "@/utils/formatName";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";
import { Table, TableBody, TableCell, TableRow } from "@/components/ui/table";

interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  address?: string;
}

interface StudentProfileProps {
  user: AuthUser | null;
  parents: Parent[];
  loadingParents: boolean;
}

const AVATAR_BASE = "http://localhost:5000/uploads/avatars/";
const API_BASE = "http://localhost:5000";

export default function StudentProfile({
  user,
  parents,
  loadingParents,
}: StudentProfileProps) {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calcule l'âge à partir de la date de naissance
    const calcAge = (dateOfBirth: string): number => {
      const dob = new Date(dateOfBirth);
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
      return age;
    };

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

      {/* Informations */}
      <div className="bg-surface shadow-sm rounded-sm px-6 py-4 mb-3">
        <Table className="[&_tr]:border-0 [&_tr:hover]:bg-transparent">
          <TableBody>
            {user?.studentProfile?.schoolClass && (
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground">Classe</TableCell>
                <TableCell>{user.studentProfile.schoolClass.level} {user.studentProfile.schoolClass.section}</TableCell>
              </TableRow>
            )}
            {user?.studentProfile?.dateOfBirth && (
              <TableRow>
                <TableCell className="font-semibold text-muted-foreground">Date de naissance</TableCell>
                <TableCell>
                  {new Date(user.studentProfile.dateOfBirth).toLocaleDateString("fr-FR")}
                  {" "}({calcAge(user.studentProfile.dateOfBirth)} ans)
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Parents */}
      <div className="bg-surface shadow-sm rounded-sm px-6 py-4 mb-3">
        <p className="text-sm font-semibold text-muted-foreground mb-2">Responsables légaux</p>
        {loadingParents ? (
          <p className="text-sm text-gray-400 text-center py-4">Chargement...</p>
        ) : parents.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Aucun responsable légal enregistré</p>
        ) : (
          <div className="flex flex-col gap-2">
            {parents.map((p) => {
              const { first, last } = formatName(p.firstName, p.lastName);
              return (
                <div key={p.id} className="bg-surface rounded-lg px-4 py-2">
                  <p className="font-semibold text-gray-800 mb-2">{first} {last}</p>
                  <table className="w-full table-fixed text-sm [&_tr]:border-0">
                    <tbody>
                      {[
                        { label: "Email", value: p.email },
                        { label: "Téléphone", value: p.phone ?? "—" },
                        { label: "Adresse", value: p.address ?? "—" },
                      ].map((row) => (
                        <tr key={row.label} className="border-b border-gray-100">
                          <td className="py-1.5 text-gray-400 font-semibold w-2/5">{row.label}</td>
                          <td className="py-1.5 text-gray-700">{row.value}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </section>
  );
}

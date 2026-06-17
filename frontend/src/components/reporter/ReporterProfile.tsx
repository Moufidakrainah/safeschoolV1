import { useTranslation } from "react-i18next";
import type { AuthUser } from "@/types";
import { useState } from "react";
import { formatName } from "@/utils/formatName";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableCellLeft,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/config";

interface StaffClass {
  id: string;
  level: string;
  section: string;
}
interface StaffProfile {
  profession: string;
  subject?: string | null;
  classes?: StaffClass[];
}
interface ReporterProfileProps {
  user: AuthUser | null;
  staffProfile: StaffProfile | null;
  loadingProfile: boolean;
}

const AVATAR_BASE = `${API_BASE}/uploads/avatars/`;

export default function ReporterProfile({
  user,
  staffProfile,
  loadingProfile,
}: ReporterProfileProps) {
  const { t } = useTranslation();
  const { updateUser } = useAuth();
  const [avatar, setAvatar] = useState<string | null>(user?.avatar ?? null);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
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
        updateUser({ avatar: data.avatar });
        toast.success(t("toast.avatarUpdated"));
      } else {
        toast.error(t("toast.avatarError"));
      }
    } catch {
      toast.error(t("toast.avatarError"));
    } finally {
      setUploading(false);
    }
  };

  return (
    <section className="page-section">
      {/* Avatar + nom + bouton */}
      <div className="bg-surface shadow-sm px-6 py-8 mb-3">
        <div className="flex flex-col items-center gap-3">
          {avatar ? (
            <img
              className="w-56 h-56 rounded-full object-cover border-4 border-primary"
              src={`${AVATAR_BASE}${avatar}?t=${Date.now()}`}
              alt={`${user?.firstName} ${user?.lastName}`}
            />
          ) : (
            <div className="w-56 h-56 rounded-full border-4 border-primary flex items-center justify-center text-8xl">
              {user?.firstName?.[0]}
              {user?.lastName?.[0]}
            </div>
          )}

          <div className="text-center mt-4">
            {(() => {
              const { first, last } = formatName(
                user?.firstName ?? "",
                user?.lastName ?? "",
              );
              return (
                <h2 className="text-2xl font-bold mb-4">
                  {first} {last}
                </h2>
              );
            })()}
            <span className="text-sm">{t("reporter.roles.teacher")}</span>
            <p className="text-sm mt-4">{user?.email}</p>
          </div>

          <label className="cursor-pointer inline-flex items-center gap-1 h-8 px-4 py-2 rounded-md text-sm bg-primary text-white hover:opacity-90">
            {uploading
              ? t("reporter.profile.upload")
              : t("reporter.profile.change")}
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleUpload}
            />
          </label>
        </div>
      </div>

      {/* Informations personnelles */}
      <div className="bg-surface shadow-sm px-8 py-4 mb-3">
        <Table>
          <TableBody>
            {user?.firstName && (
              <TableRow>
                <TableCellLeft>{t("reporter.profile.firstName")}</TableCellLeft>
                <TableCell>{user.firstName}</TableCell>
              </TableRow>
            )}
            {user?.lastName && (
              <TableRow>
                <TableCellLeft>{t("reporter.profile.lastName")}</TableCellLeft>
                <TableCell>{user.lastName}</TableCell>
              </TableRow>
            )}
            {user?.email && (
              <TableRow>
                <TableCellLeft>{t("reporter.profile.email")}</TableCellLeft>
                <TableCell>{user.email}</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Profil professionnel */}
      <div className="bg-surface shadow-sm px-8 py-4">
        {loadingProfile ? (
          <p className="text-m text-center py-4">
            {t("reporter.profile.loading")}
          </p>
        ) : !staffProfile ? (
          <p className="text-m text-center py-4">
            {t("reporter.profile.noProfile")}
          </p>
        ) : (
          <Table>
            <TableBody>
              <TableRow>
                <TableCellLeft>
                  {t("reporter.profile.occupation")}
                </TableCellLeft>
                <TableCell>{staffProfile.profession}</TableCell>
              </TableRow>
              {staffProfile.subject && (
                <TableRow>
                  <TableCellLeft>{t("reporter.profile.subject")}</TableCellLeft>
                  <TableCell>{staffProfile.subject}</TableCell>
                </TableRow>
              )}
              {staffProfile.classes && staffProfile.classes.length > 0 && (
                <TableRow>
                  <TableCellLeft>{t("reporter.profile.classes")}</TableCellLeft>
                  <TableCell>
                    <div className="space-y-1">
                      {staffProfile.classes.map((c) => (
                        <div key={`${c.level}-${c.section}`}>
                          {c.level} {c.section}
                        </div>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </section>
  );
}

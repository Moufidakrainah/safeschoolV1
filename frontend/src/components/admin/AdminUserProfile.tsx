import type { AdminUser } from '@/types';
import { formatName } from '@/utils/formatName';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { useState, useEffect } from 'react';
import { updateParent, createParent, deleteParent, getStudentParents, getStaffProfile } from '@/services/api';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import ParentFormItem from '@/components/admin/ParentFormItem';

interface SchoolClass { id: string; level: string; section: string; }

interface AdminUserProfileProps {
  selectedUser: AdminUser;
  filteredUsers: AdminUser[];
  avatarTimestamps: Record<string, number>;
  classes: SchoolClass[];
  userForm: any;
  errors: any;
  isFormValid: boolean;
  originReportId: string | null;
  onBack: () => void;
  onPrev: () => void;
  onNextUser: () => void;
  onHandleAvatarUpload: (userId: string, file: File) => void;
  onHandleDeleteUser: (id: string) => void;
  onSaveUser: () => void;
  renderUserForm: (isEdit: boolean) => JSX.Element;
  calcAge: (dateOfBirth: string) => number;
}

export default function AdminUserProfile({
  selectedUser, filteredUsers,
  avatarTimestamps, classes, userForm, errors,
  isFormValid, originReportId,
  onBack, onPrev, onNextUser, onHandleAvatarUpload,
  onHandleDeleteUser, onSaveUser,
  renderUserForm, calcAge,
}: AdminUserProfileProps) {
  const { t } = useTranslation();

  const [editMode, setEditMode] = useState(false);
  const [uploadingAvatarId, setUploadingAvatarId] = useState<string | null>(null);
  const [showParentForm, setShowParentForm] = useState(false);
  const [editingParent, setEditingParent] = useState<any | null>(null);
  const [parentForm, setParentForm] = useState({ firstName: '', lastName: '', email: '', phone: '', address: '' });
  const [profileParents, setProfileParents] = useState<any[]>([]);
  const [profileStaff, setProfileStaff] = useState<any | null>(null);

  useEffect(() => {
    setShowParentForm(false);
    setEditingParent(null);
    setParentForm({ firstName: '', lastName: '', email: '', phone: '', address: '' });
    if (selectedUser?.role === 'student' && selectedUser?.id) {
      getStudentParents(selectedUser.id)
        .then(setProfileParents)
        .catch(() => setProfileParents([]));
    } else {
      setProfileParents([]);
    }
    if (selectedUser?.role === 'teacher' && selectedUser?.id) {
      getStaffProfile(selectedUser.id)
        .then(setProfileStaff)
        .catch(() => setProfileStaff(null));
    } else {
      setProfileStaff(null);
    }
  }, [selectedUser?.id, selectedUser?.staffProfile]);

  const handleSaveParent = async () => {
    const studentProfileId = selectedUser?.studentProfile?.id;
    if (editingParent) {
      await updateParent(editingParent.id, parentForm);
    } else {
      if (studentProfileId) await createParent({ ...parentForm, studentIds: [studentProfileId] });
    }
    const updated = await getStudentParents(selectedUser.id);
    setProfileParents(updated);
    setShowParentForm(false);
    setEditingParent(null);
  };

  const handleDeleteParent = async (id: string) => {
    await deleteParent(id);
    const updated = await getStudentParents(selectedUser.id);
    setProfileParents(updated);
  };

  // Données staff : priorité à profileStaff (local), sinon selectedUser.staffProfile
  const staffData = profileStaff ?? selectedUser.staffProfile;

  return (
    <section className="page-section">

      {/* 1. Navigation */}
      <div className="flex justify-between items-center mb-4">
        <Button variant="ghost" onClick={onBack}>
          ← {originReportId ? 'Retour au signalement' : 'Retour à la liste'}
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost"
            disabled={filteredUsers.findIndex(u => u.id === selectedUser.id) === 0}
            onClick={onPrev}>← Précédent</Button>
          <Button variant="ghost"
            disabled={filteredUsers.findIndex(u => u.id === selectedUser.id) === filteredUsers.length - 1}
            onClick={onNextUser}>Suivant →</Button>
        </div>
      </div>

      {/* 2. Avatar + nom + boutons */}
      <div className="bg-surface shadow-sm rounded-sm px-6 py-8 mb-3 flex flex-col items-center gap-3">
        <div className="relative">
          {selectedUser.avatar
            ? <img src={`http://localhost:5000/uploads/avatars/${selectedUser.avatar}?t=${avatarTimestamps[selectedUser.id] ?? 0}`}
                alt={selectedUser.firstName}
                className="w-56 h-56 rounded-full object-cover border-4 border-primary shadow" />
            : <div className="w-56 h-56 rounded-full bg-gray-200 flex items-center justify-center text-6xl font-bold text-gray-400 border-4 border-gray-200">
                {selectedUser.firstName?.[0]}{selectedUser.lastName?.[0]}
              </div>}
        </div>
        <div className="text-center">
          {(() => { const { first, last } = formatName(selectedUser.firstName, selectedUser.lastName); return <h2 className="text-xl font-bold text-gray-800">{first} {last}</h2>; })()}
          <span className="text-sm text-gray-700 capitalize">{selectedUser.role}</span>
          <p className="text-sm text-gray-700 mt-1">{selectedUser.email}</p>
        </div>
        {!editMode && (
          <div className="flex justify-center gap-3 mt-2">
            <Button onClick={() => setEditMode(true)}>{t('admin.users.edit')}</Button>
            <label className={`cursor-pointer inline-flex items-center gap-1 h-10 px-4 py-2 rounded-md text-sm font-medium bg-primary text-white hover:opacity-90 transition-opacity ${uploadingAvatarId === selectedUser.id ? 'opacity-50 pointer-events-none' : ''}`}>
              {uploadingAvatarId === selectedUser.id ? 'Upload...' : 'Changer la photo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={async e => { const f = e.target.files?.[0]; if (f) await onHandleAvatarUpload(selectedUser.id, f); }} />
            </label>
            <Button variant="default" onClick={e => { e.stopPropagation(); onHandleDeleteUser(selectedUser.id); }}>
              {t('admin.users.delete')}
            </Button>
          </div>
        )}
      </div>

      {/* 3. Infos */}
      {!editMode && (
        <div className="bg-surface shadow-sm rounded-sm px-6 py-4 mb-3">
          <Table className="[&_tr]:border-0 [&_tr:hover]:bg-transparent"><TableBody>
            {selectedUser.studentProfile?.schoolClass && <TableRow><TableCell className="font-semibold text-muted-foreground">Classe</TableCell><TableCell>{selectedUser.studentProfile.schoolClass.level} {selectedUser.studentProfile.schoolClass.section}</TableCell></TableRow>}
            {selectedUser.studentProfile?.dateOfBirth && <TableRow><TableCell className="font-semibold text-muted-foreground">Date de naissance</TableCell><TableCell>{new Date(selectedUser.studentProfile.dateOfBirth).toLocaleDateString('fr-FR')} ({calcAge(selectedUser.studentProfile.dateOfBirth)} ans)</TableCell></TableRow>}
            {staffData?.profession && <TableRow><TableCell className="font-semibold text-muted-foreground">Profession</TableCell><TableCell>{staffData.profession}</TableCell></TableRow>}
            {staffData?.subject && <TableRow><TableCell className="font-semibold text-muted-foreground">Matière</TableCell><TableCell>{staffData.subject}</TableCell></TableRow>}
            {staffData?.classes?.length > 0 && <TableRow><TableCell className="font-semibold text-muted-foreground">Classes</TableCell><TableCell>{staffData.classes.map((c: any) => `${c.level} ${c.section}`).join(', ')}</TableCell></TableRow>}
          </TableBody></Table>
        </div>
      )}

      {/* 4. Responsables légaux — uniquement pour les élèves */}
      {!editMode && selectedUser.role === 'student' && (
        <div className="bg-surface shadow-sm rounded-sm px-6 py-4 mb-3">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-muted-foreground">Responsables légaux</p>
            {profileParents.length < 2 && !showParentForm && (
              <Button size="sm" variant="default" onClick={() => {
                setShowParentForm(true);
                setEditingParent(null);
                setParentForm({ firstName: '', lastName: '', email: '', phone: '', address: '' });
              }}>+ Ajouter</Button>
            )}
          </div>
          {showParentForm && (
            <ParentFormItem
              key={editingParent?.id ?? 'new'}
              parent={parentForm}
              idx={editingParent ? profileParents.findIndex(p => p.id === editingParent.id) : profileParents.length}
              dark={false}
              onChange={(updated) => setParentForm(updated)}
              onRemove={() => {
                setShowParentForm(false);
                setEditingParent(null);
              }}
            />
          )}
          {showParentForm && (
            <div className="flex gap-2 justify-end mt-1">
              <Button size="sm" onClick={handleSaveParent}>Enregistrer</Button>
              <Button size="sm" variant="ghost" onClick={() => {
                setShowParentForm(false);
                setEditingParent(null);
              }}>Annuler</Button>
            </div>
          )}
          <div className="flex flex-col gap-2">
            {profileParents.map((p: any) => {
              const { first, last } = formatName(p.firstName, p.lastName);
              return (
                <div key={p.id} className="bg-surface rounded-lg px-4 py-2">
                  <div className="flex justify-between items-center mb-2">
                    <p className="font-semibold text-gray-800">{first} {last}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="default" onClick={() => {
                        setEditingParent(p);
                        setParentForm({ firstName: p.firstName, lastName: p.lastName, email: p.email, phone: p.phone ?? '', address: p.address ?? '' });
                        setShowParentForm(true);
                      }}>Modifier</Button>
                      <Button size="sm" variant="default" onClick={() => handleDeleteParent(p.id)}>Supprimer</Button>
                    </div>
                  </div>
                  <table className="w-full table-fixed text-sm [&_tr]:border-0"><tbody>
                    {[{ label: 'Email', value: p.email }, { label: 'Téléphone', value: p.phone ?? '—' }, { label: 'Adresse', value: p.address ?? '—' }].map(row => (
                      <tr key={row.label} className="border-b border-gray-100">
                        <td className="py-1.5 text-gray-400 font-semibold w-2/5">{row.label}</td>
                        <td className="py-1.5 text-gray-700">{row.value}</td>
                      </tr>
                    ))}
                  </tbody></table>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. Formulaire modification */}
      {editMode && (
        <>
          {renderUserForm(true)}
          <div className="flex gap-3 justify-end mt-4">
            {isFormValid ? (
              <AlertDialog>
                <AlertDialogTrigger className="group/button inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity">
                  {t('admin.users.save')}
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Confirmer les modifications</AlertDialogTitle>
                    <AlertDialogDescription>
                      <span className="text-sm text-gray-700 space-y-1 mt-2 flex flex-col gap-1">
                        <span><strong>Prénom :</strong> {userForm.firstName}</span>
                        <span><strong>Nom :</strong> {userForm.lastName}</span>
                        <span><strong>Email :</strong> {userForm.email}</span>
                        <span><strong>Rôle :</strong> {userForm.role}</span>
                        {userForm.role === 'student' && userForm.classId && <span><strong>Classe :</strong> {classes.find((c: SchoolClass) => c.id === userForm.classId)?.level} {classes.find((c: SchoolClass) => c.id === userForm.classId)?.section}</span>}
                        {userForm.role === 'teacher' && userForm.subject && <span><strong>Matière :</strong> {userForm.subject}</span>}
                        {userForm.password && <span><strong>Mot de passe :</strong> modifié</span>}
                      </span>
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                    <AlertDialogAction onClick={async () => { await onSaveUser(); setEditMode(false); }}>Confirmer</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            ) : (
              <Button disabled>{t('admin.users.save')}</Button>
            )}
            <Button variant="ghost" onClick={() => setEditMode(false)}>{t('common.cancel')}</Button>
          </div>
        </>
      )}

    </section>
  );
}
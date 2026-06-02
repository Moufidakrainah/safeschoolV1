import type { AdminUser } from '@/types';
import { formatName } from '@/utils/formatName';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface SchoolClass { id: string; level: string; section: string; }

interface AdminUserProfileProps {
  selectedUser: AdminUser;
  filteredUsers: AdminUser[];
  profileParents: any[];
  profileStaff: any | null;
  avatarTimestamps: Record<string, number>;
  classes: SchoolClass[];
  userForm: any;
  errors: any;
  editMode: boolean;
  showParentForm: boolean;
  editingParent: any | null;
  parentForm: any;
  uploadingAvatarId: string | null;
  isFormValid: boolean;
  originReportId: string | null;
  onBack: () => void;
  onPrev: () => void;
  onNextUser: () => void;
  onSetEditMode: (v: boolean) => void;
  onHandleAvatarUpload: (userId: string, file: File) => void;
  onHandleDeleteUser: (id: string) => void;
  onSetShowParentForm: (v: boolean) => void;
  onSetEditingParent: (p: any | null) => void;
  onSetParentForm: (f: any) => void;
  onSaveParent: () => void;
  onDeleteParent: (id: string) => void;
  onSaveUser: () => void;
  renderUserForm: (isEdit: boolean) => JSX.Element;
  calcAge: (dateOfBirth: string) => number;
}

export default function AdminUserProfile({
  selectedUser, filteredUsers, profileParents, profileStaff,
  avatarTimestamps, classes, userForm, errors, editMode,
  showParentForm, editingParent, parentForm, uploadingAvatarId,
  isFormValid, originReportId,
  onBack, onPrev, onNextUser, onSetEditMode, onHandleAvatarUpload,
  onHandleDeleteUser, onSetShowParentForm, onSetEditingParent,
  onSetParentForm, onSaveParent, onDeleteParent, onSaveUser,
  renderUserForm, calcAge,
}: AdminUserProfileProps) {
  const { t } = useTranslation();

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
            <Button onClick={() => onSetEditMode(true)}>{t('admin.users.edit')}</Button>
            <Button className={`cursor-pointer flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-white hover:opacity-90 ${uploadingAvatarId === selectedUser.id ? 'opacity-50' : ''}`}>
              {uploadingAvatarId === selectedUser.id ? 'Upload...' : 'Changer la photo'}
              <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden"
                onChange={async e => { const f = e.target.files?.[0]; if (f) await onHandleAvatarUpload(selectedUser.id, f); }} />
            </Button>
            <Button variant="default" onClick={e => { e.stopPropagation(); onHandleDeleteUser(selectedUser.id); }}>
              {t('admin.users.delete')}
            </Button>
          </div>
        )}
      </div>

      {/* 3. Infos */}
      {!editMode && (
        <div className="bg-surface shadow-sm rounded-sm px-6 py-4 mb-3">
          <Table  className="[&_tr]:border-0 [&_tr:hover]:bg-transparent"><TableBody>
            {selectedUser.studentProfile?.schoolClass && <TableRow><TableCell className="font-semibold text-muted-foreground">Classe</TableCell><TableCell>{selectedUser.studentProfile.schoolClass.level} {selectedUser.studentProfile.schoolClass.section}</TableCell></TableRow>}
            {selectedUser.studentProfile?.dateOfBirth && <TableRow><TableCell className="font-semibold text-muted-foreground">Date de naissance</TableCell><TableCell>{new Date(selectedUser.studentProfile.dateOfBirth).toLocaleDateString('fr-FR')} ({calcAge(selectedUser.studentProfile.dateOfBirth)} ans)</TableCell></TableRow>}
            {(selectedUser.staffProfile?.profession || profileStaff?.profession) && <TableRow><TableCell className="font-semibold text-muted-foreground">Profession</TableCell><TableCell>{profileStaff?.profession ?? selectedUser.staffProfile?.profession}</TableCell></TableRow>}
            {profileStaff?.subject && <TableRow><TableCell className="font-semibold text-muted-foreground">Matière</TableCell><TableCell>{profileStaff.subject}</TableCell></TableRow>}
            {profileStaff?.classes?.length > 0 && <TableRow><TableCell className="font-semibold text-muted-foreground">Classes</TableCell><TableCell>{profileStaff.classes.map((c: any) => `${c.level} ${c.section}`).join(', ')}</TableCell></TableRow>}
          </TableBody></Table>
        </div>
      )}

      {/* 4. Responsables légaux */}
      {!editMode && (
        <div className="bg-surface shadow-sm rounded-sm px-6 py-4 mb-3">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold text-muted-foreground">Responsables légaux</p>
            {profileParents.length < 2 && !showParentForm && (
              <Button size="sm" variant="default" onClick={() => {
                onSetShowParentForm(true);
                onSetEditingParent(null);
                onSetParentForm({ firstName: '', lastName: '', email: '', phone: '', address: '' });
              }}>+ Ajouter</Button>
            )}
          </div>
          {showParentForm && (
            <div className="bg-gray-50 rounded-lg p-3 mb-3 flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Prénom</Label>
                  <Input value={parentForm.firstName} onChange={e => {
                    const val = e.target.value.replace(/[^a-zA-ZÀ-ÿ'\-]/g, '');
                    onSetParentForm({ ...parentForm, firstName: val.charAt(0).toUpperCase() + val.slice(1).toLowerCase() });
                  }} maxLength={20} className="mt-1" /></div>
                <div><Label className="text-xs">Nom</Label>
                  <Input value={parentForm.lastName} onChange={e => {
                    const val = e.target.value.replace(/[^a-zA-ZÀ-ÿ'\-]/g, '');
                    onSetParentForm({ ...parentForm, lastName: val.toUpperCase() });
                  }} maxLength={20} className="mt-1" /></div>
              </div>
              <div><Label className="text-xs">Email</Label>
                <Input type="email" value={parentForm.email} onChange={e => onSetParentForm({ ...parentForm, email: e.target.value })} maxLength={50} className="mt-1" /></div>
              <div><Label className="text-xs">Téléphone</Label>
                <Input value={parentForm.phone} onChange={e => onSetParentForm({ ...parentForm, phone: e.target.value.replace(/[^0-9+\s]/g, '') })} maxLength={15} className="mt-1" /></div>
              <div><Label className="text-xs">Adresse</Label>
                <Input value={parentForm.address} onChange={e => onSetParentForm({ ...parentForm, address: e.target.value })} className="mt-1" /></div>
              <div className="flex gap-2 justify-end mt-1">
                <Button size="sm" disabled={
                  !parentForm.firstName || parentForm.firstName.length < 2 ||
                  !parentForm.lastName || parentForm.lastName.length < 2 ||
                  !parentForm.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(parentForm.email)
                } onClick={onSaveParent}>Enregistrer</Button>
                <Button size="sm" variant="ghost" onClick={() => { onSetShowParentForm(false); onSetEditingParent(null); }}>Annuler</Button>
              </div>
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
                        onSetEditingParent(p);
                        onSetParentForm({ firstName: p.firstName, lastName: p.lastName, email: p.email, phone: p.phone ?? '', address: p.address ?? '' });
                        onSetShowParentForm(true);
                      }}>Modifier</Button>
                      <Button size="sm" variant="default" onClick={() => onDeleteParent(p.id)}>Supprimer</Button>
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
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button disabled={!isFormValid}>{t('admin.users.save')}</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmer les modifications</AlertDialogTitle>
                  <AlertDialogDescription asChild>
                    <div className="text-sm text-gray-700 space-y-1 mt-2">
                      <p><strong>Prénom :</strong> {userForm.firstName}</p>
                      <p><strong>Nom :</strong> {userForm.lastName}</p>
                      <p><strong>Email :</strong> {userForm.email}</p>
                      <p><strong>Rôle :</strong> {userForm.role}</p>
                      {userForm.role === 'student' && userForm.classId && <p><strong>Classe :</strong> {classes.find((c: SchoolClass) => c.id === userForm.classId)?.level} {classes.find((c: SchoolClass) => c.id === userForm.classId)?.section}</p>}
                      {userForm.role === 'teacher' && userForm.subject && <p><strong>Matière :</strong> {userForm.subject}</p>}
                      {userForm.password && <p><strong>Mot de passe :</strong> modifié</p>}
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                  <AlertDialogAction onClick={onSaveUser}>Confirmer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="ghost" onClick={() => onSetEditMode(false)}>{t('common.cancel')}</Button>
          </div>
        </>
      )}

    </section>
  );
}
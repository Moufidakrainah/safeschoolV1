import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
getAllUsers, updateUser, createUser, deleteUser, checkCanDeleteUser,
searchUsers, getClasses, getStaffProfile, createStaffProfile, updateStaffProfile,
createParent,
} from '@/services/api';
import type { AdminUser } from '@/types';

interface SchoolClass { id: string; level: string; section: string; }

// Type pour un parent dans le formulaire
interface ParentForm {
firstName: string;
lastName: string;
email: string;
phone: string;
address: string;
}

export interface UseUsersReturn {
// ── État liste ──
users: AdminUser[];
allUsers: AdminUser[];
loadingUsers: boolean;
usersPage: number;
setUsersPage: React.Dispatch<React.SetStateAction<number>>;
usersTotalPages: number;
usersTotal: number;
usersSearch: string;
setUsersSearch: React.Dispatch<React.SetStateAction<string>>;
usersSort: 'asc' | 'desc' | 'date';
setUsersSort: React.Dispatch<React.SetStateAction<'asc' | 'desc' | 'date'>>;
usersRoleFilter: string[];
setUsersRoleFilter: React.Dispatch<React.SetStateAction<string[]>>;
editingUser: AdminUser | null;
setEditingUser: React.Dispatch<React.SetStateAction<AdminUser | null>>;
showUserForm: boolean;
setShowUserForm: React.Dispatch<React.SetStateAction<boolean>>;
avatarTimestamps: Record<string, number>;
classes: SchoolClass[];
selectedUser: AdminUser | null;
setSelectedUser: React.Dispatch<React.SetStateAction<AdminUser | null>>;

// ── Formulaire ──
userForm: any;
setUserForm: React.Dispatch<React.SetStateAction<any>>;
errors: { firstName: string; lastName: string; email: string; password: string };
isFormValid: boolean;

// ── Suppression ──
deleteTarget: string | null;
setDeleteTarget: React.Dispatch<React.SetStateAction<string | null>>;
isDeleting: boolean;
isBlocked: boolean;
deleteError: string;

// ── Valeurs calculées ──
filteredUsers: AdminUser[];

// ── Fonctions ──
fetchUsers: (page?: number, search?: string) => Promise<void>;
fetchClassesList: () => Promise<void>;
handleSaveUser: () => Promise<void>;
handleDeleteUser: (id: string) => Promise<void>;
confirmDelete: () => Promise<void>;
handleAvatarUpload: (userId: string, file: File) => Promise<void>;
validateField: (field: string, value: string) => void;
  validateAll: () => boolean;
updateField: (field: string, value: string) => void;
toggleClassId: (id: string) => void;
navigateToUser: (u: AdminUser) => void;
calcAge: (dateOfBirth: string) => number;
}

export function useUsers(): UseUsersReturn {
const navigate = useNavigate();
const { t } = useTranslation();

// ── État liste ──
const [users, setUsers]               = useState<AdminUser[]>([]);
const [allUsers, setAllUsers]         = useState<AdminUser[]>([]);
const [loadingUsers, setLoadingUsers] = useState(false);
const [usersPage, setUsersPage]       = useState(1);
const [usersTotalPages, setUsersTotalPages] = useState(1);
const [usersTotal, setUsersTotal]     = useState(0);
const [usersSearch, setUsersSearch]   = useState('');
const [usersSort, setUsersSort]       = useState<'asc' | 'desc' | 'date'>('asc');
const [usersRoleFilter, setUsersRoleFilter] = useState<string[]>([]);
const [editingUser, setEditingUser]   = useState<AdminUser | null>(null);
const [showUserForm, setShowUserForm] = useState(false);
const [avatarTimestamps, setAvatarTimestamps] = useState<Record<string, number>>({});
const [classes, setClasses]           = useState<SchoolClass[]>([]);
const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

// ── Formulaire ──
const [userForm, setUserForm] = useState({
  firstName: '', lastName: '', email: '', password: '', role: '',
  classId: '', subject: '', classIds: [] as string[],
  parents: [] as ParentForm[], // liste des parents (max 2) pour la création d'un élève
  dateOfBirth: '',
});
const [errors, setErrors] = useState({ firstName: '', lastName: '', email: '', password: '' });

// ── Suppression ──
const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
const [isDeleting, setIsDeleting]     = useState(false);
const [deleteError, setDeleteError]   = useState('');
const [isBlocked, setIsBlocked]       = useState(false);

// ── Chargement classes ──
const fetchClassesList = useCallback(async () => {
  try { setClasses(await getClasses()); } catch {}
}, []);

// ── Chargement utilisateurs ──
const fetchUsers = useCallback(async (page?: number, search?: string) => {
  const p = page ?? usersPage;
  const q = search !== undefined ? search : usersSearch;
  setLoadingUsers(true);
  try {
    if (q.trim().length >= 2) {
      const results = await searchUsers(q);
      const arr = Array.isArray(results) ? results : [];
      setAllUsers(arr); setUsers(arr); setUsersTotalPages(1);
      setUsersTotal(arr.length ?? 0); setUsersPage(1);
    } else {
      const data = await getAllUsers(1, 1000);
      const arr = Array.isArray(data.data) ? data.data : [];
      setAllUsers(arr);
      setUsers(arr.slice((p-1)*5, p*5));
      setUsersTotalPages(Math.ceil(arr.length / 7) || 1);
      setUsersTotal(arr.length ?? 0);
    }
  } catch { setAllUsers([]); setUsers([]); }
  finally { setLoadingUsers(false); }
}, [usersPage, usersSearch]);

// ── Avatar upload ──
const handleAvatarUpload = useCallback(async (userId: string, file: File) => {
  try {
    const formData = new FormData();
    formData.append('avatar', file);
    const res = await fetch(`http://localhost:5000/users/${userId}/avatar`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      body: formData,
    });
    const data = await res.json();
    if (data.avatar) {
      setAvatarTimestamps(prev => ({ ...prev, [userId]: Date.now() }));
      await fetchUsers();
      setSelectedUser(prev => prev && prev.id === userId ? { ...prev, avatar: data.avatar } : prev);
    }
  } catch {}
}, [fetchUsers]);

// ── Sauvegarde utilisateur ──
const handleSaveUser = useCallback(async () => {
  try {
    if (editingUser) {
      // Modification d'un utilisateur existant
      await updateUser(editingUser.id, { firstName: userForm.firstName, lastName: userForm.lastName, email: userForm.email, ...(userForm.password && { password: userForm.password }), role: userForm.role, ...(userForm.role === 'student' && { classId: userForm.classId, dateOfBirth: userForm.dateOfBirth || undefined }) });
      if (userForm.role === 'teacher') {
        try { const e = await getStaffProfile(editingUser.id); await updateStaffProfile(e.id, { subject: userForm.subject, classIds: userForm.classIds }); }
        catch { await createStaffProfile({ userId: editingUser.id, profession: 'teacher', subject: userForm.subject, classIds: userForm.classIds }); }
      }
    } else {
      // Création d'un nouvel utilisateur
      const created = await createUser({ firstName: userForm.firstName, lastName: userForm.lastName, email: userForm.email, password: userForm.password, role: userForm.role, ...(userForm.role === 'student' && { classId: userForm.classId, dateOfBirth: userForm.dateOfBirth || undefined }) });
      if (userForm.role === 'teacher') {
        await createStaffProfile({ userId: created.id, profession: 'teacher', subject: userForm.subject, classIds: userForm.classIds });
      }
      // Créer les parents si c'est un élève et qu'il y a des parents dans le formulaire
      if (userForm.role === 'student' && userForm.parents.length > 0) {
        for (const parent of userForm.parents) {
          // On crée le parent seulement si prénom, nom et email sont renseignés
          if (parent.firstName && parent.lastName && parent.email) {
            await createParent({
              ...parent,
              studentIds: [created.studentProfile?.id ?? created.id],
            });
          }
        }
      }
    }
    await fetchUsers();
    setShowUserForm(false); setEditingUser(null);
    setUserForm({ firstName: '', lastName: '', email: '', password: '', role: 'student', classId: '', subject: '', classIds: [], parents: [], dateOfBirth: '' });
  } catch {}
}, [editingUser, userForm, fetchUsers]);

// ── Suppression utilisateur ──
const handleDeleteUser = useCallback(async (id: string) => {
  const { deletable } = await checkCanDeleteUser(id);
  setDeleteTarget(id); setIsBlocked(!deletable); setDeleteError('');
}, []);

const confirmDelete = useCallback(async () => {
  if (!deleteTarget) return;
  setIsDeleting(true); setDeleteError(''); setIsBlocked(false);
  try {
    await deleteUser(deleteTarget);
    await fetchUsers();
    setDeleteTarget(null);
    setSelectedUser(null);
    navigate('/dashboard?section=users', { replace: true });
  } catch (err: any) {
    const msg = err?.response?.data?.message ?? err?.message ?? '';
    if (msg === 'USER_HAS_REPORTS') setIsBlocked(true);
    else setDeleteError(t('admin.users.deleteError'));
  } finally { setIsDeleting(false); }
}, [deleteTarget, fetchUsers, navigate, t]);

// ── Validation formulaire ──
const validateField = useCallback((field: string, value: string) => {
  let message = '';
  const nameRegex = /^[a-zA-ZÀ-ÿ\-]{2,20}$/;
  if (field === 'firstName' || field === 'lastName') {
    if (!value.trim()) message = t('admin.users.errorRequired');
    else if (!nameRegex.test(value)) message = t('admin.users.name');
  } else if (field === 'email') {
    if (!value.trim()) message = t('admin.users.errorRequired');
    else if (value.length > 50) message = t('admin.users.tooLong');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) message = t('admin.users.errorEmailFormat');
  } else if (field === 'password' && value.length > 0) {
    if (value.length < 12) message = t('admin.users.atLeast');
    else if (value.length > 20) message = t('admin.users.tooLong');
    else if (!/[0-9]/.test(value)) message = t('admin.users.atLeastOneNumber');
    else if (!/[a-z]/.test(value)) message = t('admin.users.atLeastOneMinus');
    else if (!/[A-Z]/.test(value)) message = t('admin.users.atLeastOneMajor');
    else if (!/[^a-zA-Z0-9]/.test(value)) message = t('admin.users.atLeastOneSpecial');
    else if (userForm.firstName && value.toLowerCase().includes(userForm.firstName.toLowerCase())) message = t('admin.users.noFirstName');
    else if (userForm.lastName && value.toLowerCase().includes(userForm.lastName.toLowerCase())) message = t('admin.users.noLastName');
  }
  setErrors(prev => ({ ...prev, [field]: message }));
}, [t, userForm.firstName, userForm.lastName]);

const validateAll = () => {
  const fields = ['firstName', 'lastName', 'email'];
  let hasError = false;
  fields.forEach(field => {
    const value = userForm[field as keyof typeof userForm] as string;
    let message = '';
    const nameRegex = /^[a-zA-ZÀ-ÿ\-]{2,20}$/;
    if (field === 'firstName' || field === 'lastName') {
      if (!value.trim()) { message = t('admin.users.errorRequired'); hasError = true; }
      else if (!nameRegex.test(value)) { message = t('admin.users.name'); hasError = true; }
    } else if (field === 'email') {
      if (!value.trim()) { message = t('admin.users.errorRequired'); hasError = true; }
      else if (value.length > 50) { message = t('admin.users.tooLong'); hasError = true; }
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) { message = t('admin.users.errorEmailFormat'); hasError = true; }
    }
    setErrors(prev => ({ ...prev, [field]: message }));
  });
  return !hasError;
};
const updateField = useCallback((field: string, value: string) => {
  let normalized = value;
  if (field === 'firstName') normalized = value.replace(/[^a-zA-ZÀ-ÿ'\-]/g, '').split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join('-');
  if (field === 'lastName') normalized = value.replace(/[^a-zA-ZÀ-ÿ'\-]/g, '').toUpperCase();
  setUserForm(prev => ({ ...prev, [field]: normalized }));
  validateField(field, normalized);
}, [validateField]);

const toggleClassId = useCallback((id: string) => {
  setUserForm(prev => ({ ...prev, classIds: prev.classIds.includes(id) ? prev.classIds.filter((x: string) => x !== id) : [...prev.classIds, id] }));
}, []);

// ── Helpers ──
const calcAge = useCallback((dateOfBirth: string) => {
  const dob = new Date(dateOfBirth);
  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();
  const m = today.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
  return age;
}, []);

const navigateToUser = useCallback((u: AdminUser) => {
  setSelectedUser(u);
  navigate(`/dashboard?section=users&userId=${u.id}`, { replace: true });
  setUserForm({ firstName: u.firstName, lastName: u.lastName, email: u.email, password: '', role: u.role, classId: u.studentProfile?.schoolClass?.id || '', subject: u.staffProfile?.subject || '', classIds: u.staffProfile?.classes?.map((c: any) => c.id) || [], parents: [], dateOfBirth: u.studentProfile?.dateOfBirth ?? '' });
}, [navigate]);

// ── Valeurs calculées ──
const isDateOfBirthValid = userForm.role !== 'student' || !userForm.dateOfBirth || (() => {
  const dob = new Date(userForm.dateOfBirth);
  const today = new Date();
  const age = today.getFullYear() - dob.getFullYear();
  return age >= 9 && age <= 16;
})();

const isFormValid = !!(
  userForm.firstName.trim() && 
  userForm.lastName.trim() && 
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(userForm.email) && 
  userForm.role &&
  isDateOfBirthValid &&
  !errors.firstName && !errors.lastName && !errors.email && !errors.password
);

const filteredUsers = useMemo(() => {
  return [...allUsers]
    .filter(u => usersRoleFilter.length === 0 || usersRoleFilter.includes(u.role))
    .sort((a, b) => {
      if (usersSort === 'asc') return `${a.lastName} ${a.firstName}`.localeCompare(`${b.lastName} ${b.firstName}`);
      if (usersSort === 'desc') return `${b.lastName} ${b.firstName}`.localeCompare(`${a.lastName} ${a.firstName}`);
      if (usersSort === 'date') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return 0;
    });
}, [allUsers, usersRoleFilter, usersSort]);

return {
  users, allUsers, loadingUsers,
  usersPage, setUsersPage, usersTotalPages, usersTotal,
  usersSearch, setUsersSearch,
  usersSort, setUsersSort,
  usersRoleFilter, setUsersRoleFilter,
  editingUser, setEditingUser,
  showUserForm, setShowUserForm,
  avatarTimestamps, classes, selectedUser, setSelectedUser,
  userForm, setUserForm, errors, isFormValid,
  deleteTarget, setDeleteTarget, isDeleting, isBlocked, deleteError,
  filteredUsers,
  fetchUsers, fetchClassesList,
  handleSaveUser, handleDeleteUser, confirmDelete,
  handleAvatarUpload, validateField, validateAll, updateField, toggleClassId,
  navigateToUser, calcAge,
};
}
import type { AdminUser } from '@/types';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { getUserById } from '@/services/api';
import { API_BASE } from '@/config';
import { formatName } from '@/utils/formatName';
import { Pagination as PaginationShadcn, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination';
import { Input } from '@/components/ui/input';

interface AdminUsersListProps {
    filteredUsers: AdminUser[];
    usersPage: number;
    usersSearch: string;
    usersSort: 'asc' | 'desc' | 'date';
    usersRoleFilter: string[];
    loadingUsers: boolean;
    avatarTimestamps: Record<string, number>;
    usersTotalPages: number;
    showUserForm: boolean;
    isFormValid: boolean;
    onSetUsersSearch: (s: string) => void;
    onSetUsersSort: (s: 'asc' | 'desc' | 'date') => void;
    onSetUsersRoleFilter: (f: string[]) => void;
    onSetUsersPage: (p: number) => void;
    onFetchUsers: (page?: number, search?: string) => void;
    onNavigateToUser: (u: AdminUser) => void;
    onSetShowUserForm: (v: boolean) => void;
    onSaveUser: () => void;
    onValidateAll: () => boolean;
    renderUserForm: (isEdit: boolean) => JSX.Element;
}

export default function AdminUserList({
  filteredUsers,
  usersPage,
  usersSearch,
  usersSort,
  usersRoleFilter,
  loadingUsers,
  avatarTimestamps,
  usersTotalPages,
  showUserForm,
  isFormValid,
  onSetUsersSearch,
  onSetUsersSort,
  onSetUsersRoleFilter,
  onSetUsersPage,
  onFetchUsers,
  onNavigateToUser,
  onSetShowUserForm,
  onSaveUser,
  onValidateAll,
  renderUserForm,
}: AdminUsersListProps) {
    const { t } = useTranslation();
    return (
        <section>
            {/* 1. Barre de recherche */}
            <div className="flex gap-2 mb-3">
                <Input type="search" placeholder={t('admin.users.searchPlaceholder')} value={usersSearch} maxLength={120}
                    onChange={e => { onSetUsersSearch(e.target.value); onSetUsersPage(1); onFetchUsers(1, e.target.value); }}
                    className="flex-1" />
                <Button variant="outline" onClick={() => { onSetUsersSearch(''); onSetUsersRoleFilter([]); onSetUsersPage(1); onFetchUsers(1, ''); }}>
                    {t('common.reset')}
                </Button>
            </div>
            {/* 2. Filtres roles + tri + bouton ajouter */}
            <div className="flex gap-4 mb-4 flex-wrap justify-between items-center">
                <div className="flex gap-10">
                {([
                  { key: 'student', label: t('admin.users.roleStudent') },
                  { key: 'teacher', label: t('admin.users.roleTeacher') },
                  { key: 'admin',   label: t('admin.users.roleAdmin') },
                ]).map(r => (
                    <label key={r.key} className="flex items-center gap-2 cursor-pointer text-sm font-medium text-gray-700">
                    <Checkbox
                        checked={usersRoleFilter.includes(r.key)}
                        onCheckedChange={checked => {
                        const newFilter = checked
                            ? [...usersRoleFilter, r.key]
                            : usersRoleFilter.filter(x => x !== r.key);
                        onSetUsersRoleFilter(newFilter);
                        onSetUsersPage(1);
                        setTimeout(() => onFetchUsers(1), 0);
                        }} />
                    {r.label}
                    </label>
                ))}
                </div>
                <div className="flex items-center gap-2">
                    <select value={usersSort} onChange={e => onSetUsersSort(e.target.value as 'asc' | 'desc' | 'date')}
                    className="text-sm border rounded-lg px-3 py-1.5 text-gray-600 focus:outline-none focus:border-primary">
                    <option value="asc">A → Z</option>
                    <option value="desc">Z → A</option>
                    <option value="date">{t('admin.users.sortDate')}</option>
                    </select>
                    <Button onClick={() => onSetShowUserForm(true)}>{t('admin.users.add')}</Button>
                </div>
            </div>
            {/* Formulaire ajout */}
                {showUserForm && (
                <div className="bg-surface shadow-sm rounded-sm px-6 py-5 mb-3">
                    <h3 className="font-bold mb-4">{t('admin.users.formAdd')} {t('admin.users.formTitle')}</h3>
                    {renderUserForm(false)}
                    <div className="flex gap-3 justify-end mt-4">
                    <Button onClick={() => { if (onValidateAll()) onSaveUser(); }}>{t('admin.users.save')}</Button>
                    <Button variant="ghost" onClick={() => onSetShowUserForm(false)}>{t('common.cancel')}</Button>
                    </div>
                </div>
                )}
            {/* 4. Liste utilisateurs */}
            {loadingUsers ? (
                <p className="text-center py-10 text-gray-400">{t('admin.loading')}</p>
                ) : (
                <ul className="flex flex-col gap-3 mt-4">
                    {filteredUsers.slice((usersPage - 1) * 7, usersPage * 7).map(u => {
                    const { first, last } = formatName(u.firstName, u.lastName);
                    return (
                        <li key={u.id}>
                        <div className="card-list-item h-[100px]"
                            onClick={async () => {
                            const freshU = await getUserById(u.id);
                            if (freshU) onNavigateToUser(freshU);
                            }}>
                            <div className="flex h-full">
                              <div className="w-[100px] h-full shrink-0">
                                {u.avatar
                                ? <img src={`${API_BASE}/uploads/avatars/${u.avatar}?t=${avatarTimestamps[u.id] ?? 0}`}
                                    alt={u.firstName} className="w-full h-full object-cover block"/>
                                : <div className="w-full h-full bg-gray-200 flex items-center justify-center font-bold text-gray-400">
                                    {u.firstName?.[0]}{u.lastName?.[0]}
                                    </div>}
                            </div>
                            <div className="flex-1 px-5 py-5" style={{ minHeight: '80px' }}>
                                <div className="flex items-center gap-2">
                                <span className="card-title">{first} {last}</span>
                                <span className="bg-gray-100 px-2 py-0.5 rounded text-xs text-gray-500">{u.role}</span>
                                </div>
                                <p className="card-meta mt-0.5">{u.email}</p>
                                {u.studentProfile?.schoolClass && (
                                    <span className="text-xs text-gray-400">
                                        {u.studentProfile.schoolClass.level} {u.studentProfile.schoolClass.section}
                                    </span>
                                    )}
                                    {u.role === 'teacher' && (
                                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-gray-400">
                                        {u.staffProfile?.subject && <span>{u.staffProfile.subject}</span>}
                                        {u.staffProfile?.classes?.map((c: SchoolClass) => (
                                        <span key={c.id}>{c.level} {c.section}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            </div>
                        </div>
                        </li>
                    );
                    })}
                </ul>
            )}
            {/* 5. Pagination */}
            {Math.ceil(filteredUsers.length / 7) > 1 && (
                <PaginationShadcn className="mt-4">
                    <PaginationContent>
                    <PaginationItem>
                        <PaginationPrevious
                        onClick={() => { if (usersPage > 1) { onSetUsersPage(usersPage - 1); onFetchUsers(usersPage - 1); } }}
                        className={usersPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                    </PaginationItem>
                    {Array.from({ length: Math.ceil(filteredUsers.length / 7) }, (_, i) => i + 1).map(p => (
                        <PaginationItem key={p}>
                        <PaginationLink
                            isActive={p === usersPage}
                            onClick={() => { onSetUsersPage(p); onFetchUsers(p); }}
                            className="cursor-pointer">{p}</PaginationLink>
                        </PaginationItem>
                    ))}
                    <PaginationItem>
                        <PaginationNext
                        onClick={() => { if (usersPage < usersTotalPages) { onSetUsersPage(usersPage + 1); onFetchUsers(usersPage + 1); } }}
                        className={usersPage === Math.ceil(filteredUsers.length / 7) ? 'pointer-events-none opacity-50' : 'cursor-pointer'} />
                    </PaginationItem>
                    </PaginationContent>
                </PaginationShadcn>
            )}
        </section>
    )
}
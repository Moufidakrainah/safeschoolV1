import { memo } from 'react';
import AdminHeader from '@/components/layout/AdminHeader/AdminHeader';
import StudentHeader from '@/components/layout/StudentHeader/StudentHeader';
import ReporterHeader from '@/components/layout/ReporterHeader/ReporterHeader';

interface RoleHeaderProps {
  user: any;
  logoutUser: () => void;
  adminViewSection?: 'reports' | 'users' | 'stats' | 'classes';
  adminSetViewSection?: (s: 'reports' | 'users' | 'stats' | 'classes') => void;
  adminFetchUsers?: () => void;
  adminSetSelected?: (r: any) => void;
  adminSetView?: (v: 'list' | 'detail') => void;
  studentViewSection?: 'profile' | 'report' | 'quiz' | 'cases';
  studentSetViewSection?: (s: 'profile' | 'report' | 'quiz' | 'cases') => void;
  studentNotifRefreshKey?: number;
  studentOnNotifRefresh?: () => void;
  reporterViewSection?: 'profile' | 'report' | 'quiz';
  reporterSetViewSection?: (s: 'profile' | 'report' | 'quiz') => void;
}

function RoleHeader({
  user, logoutUser,
  adminViewSection, adminSetViewSection, adminFetchUsers, adminSetSelected, adminSetView,
  studentViewSection, studentSetViewSection, studentNotifRefreshKey, studentOnNotifRefresh,
  reporterViewSection, reporterSetViewSection,
}: RoleHeaderProps) {
  if (!user) return null;
  switch (user.role) {
    case 'admin':
    case 'director':
      return (
        <AdminHeader
          user={user} logoutUser={logoutUser}
          viewSection={adminViewSection!} setViewSection={adminSetViewSection!}
          fetchUsers={adminFetchUsers!}
          setSelected={adminSetSelected ?? (() => {})}
          setView={adminSetView ?? (() => {})}
        />
      );
    case 'student':
      return (
        <StudentHeader
          user={user} logoutUser={logoutUser}
          viewSection={studentViewSection!} setViewSection={studentSetViewSection!}
          notifRefreshKey={studentNotifRefreshKey}
          onNotifRefresh={studentOnNotifRefresh}
        />
      );
    case 'teacher':
      return (
        <ReporterHeader
          user={user} logoutUser={logoutUser}
          viewSection={reporterViewSection!} setViewSection={reporterSetViewSection!}
        />
      );
    default:
      return null;
  }
}

export default memo(RoleHeader);
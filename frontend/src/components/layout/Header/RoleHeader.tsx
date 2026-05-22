import { useAuth } from '@/context/AuthContext';
import AdminHeader from '@/components/layout/AdminHeader/AdminHeader';
import StudentHeader from '@/components/layout/StudentHeader/StudentHeader';
import ReporterHeader from '@/components/layout/ReporterHeader/ReporterHeader';

interface RoleHeaderProps {
  user: AuthUser | null;
  logoutUser: () => void;

  // Admin props
  adminViewSection?: 'reports' | 'users' | 'stats';
  adminSetViewSection?: (s: 'reports' | 'users' | 'stats') => void;
  adminFetchUsers?: () => void;
  adminSetSelected?: (r: any) => void;
  adminSetView?: (v: 'list' | 'detail') => void;

  // Student props
  studentViewSection?: 'profile' | 'report' | 'notifications' | 'quiz';
  studentSetViewSection?: (s: 'profile' | 'report' | 'notifications' | 'quiz') => void;
  studentNotifRefreshKey?: number;

  reporterViewSection: 'profile' | 'report' | 'quiz';
  reporterSetViewSection: (s: 'profile' | 'report' | 'quiz') => void;
}

export default function RoleHeader({
  user,
  logoutUser,

  adminViewSection,
  adminSetViewSection,
  adminFetchUsers,
  adminSetSelected,
  adminSetView,

  studentViewSection,
  studentSetViewSection,
  studentNotifRefreshKey,

  reporterViewSection,
  reporterSetViewSection

}: RoleHeaderProps) {
	
  if (!user) return null;

  switch (user.role) {
    case 'admin':
      return (
        <AdminHeader
          user={user}
          logoutUser={logoutUser}
          viewSection={adminViewSection!}
          setViewSection={adminSetViewSection!}
          fetchUsers={adminFetchUsers!}
          setSelected={adminSetSelected ?? (() => {})}
          setView={adminSetView ?? (() => {})}
        />
      );
    case 'student':
      return (
        <StudentHeader
          user={user}
          logoutUser={logoutUser}
          viewSection={studentViewSection!}
          setViewSection={studentSetViewSection!}
          notifRefreshKey={studentNotifRefreshKey}
        />
      );
    case 'teacher':
      return (
	  <ReporterHeader
          user={user}
          logoutUser={logoutUser}
          viewSection={reporterViewSection!}
          setViewSection={reporterSetViewSection!}
        />
	);
    default:
      return null;
  }
}

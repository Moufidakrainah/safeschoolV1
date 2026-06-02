/*Routes : redirige selon le role */
import type { ReactElement } from 'react';
import { Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Login from '@/pages/Login';
import StudentDashboard from '@/pages/StudentDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import ReporterDashboard from '@/pages/ReporterDashboard';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import { Footer } from '@/components/layout/Footer/Footer';
import UiKit from '@/pages/UiKit';
import Quiz from '@/pages/Quiz';

function ProtectedRoute({ children, roles }: { children: ReactElement; roles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  // In dev mode (VITE_DEVBAR=true), skip role check to allow DevBar navigation across all pages
  if (import.meta.env.VITE_DEVBAR !== 'true' && roles && user && !roles.includes(user.role)) 
	return <Navigate to="/login" />;
  return children;
}

function HomeRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role === 'student') return <Navigate to="/student" />;
  if (user?.role === 'admin' || user?.role === 'director') return <Navigate to="/dashboard" />;
  if (user?.role === 'teacher') return <Navigate to="/reporter" />;
  return <Navigate to="/login" />;
}

// DevBar — navigation rapide + simulation de rôle (VITE_DEVBAR=true uniquement)
// La simulation appelle loginUser() : réécrit localStorage + re-render toute l'app,
function DevBar() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { user, token, loginUser } = useAuth();
  if (import.meta.env.VITE_DEVBAR !== 'true') return null;

  const pages = [
    { to: '/ui-kit', label: 'UIkit' },
    { to: '/login',  label: 'login'  },
  ];

  type SimRole = 'admin' | 'director' | 'student' | 'teacher';
  const roles: { role: SimRole; page: string }[] = [
    { role: 'admin',    page: '/dashboard' },
    { role: 'director', page: '/dashboard' },
    { role: 'student',  page: '/student'   },
    { role: 'teacher',  page: '/reporter'  },
  ];

  function simulateRole(role: SimRole, page: string) {
    if (!user || !token) return;
    loginUser(token, { ...user, role });
    navigate(page);
  }

  const itemStyle = (active: boolean): React.CSSProperties => ({
    color: active ? 'var(--secondary)' : 'var(--muted-foreground)',
    textDecoration: 'none',
    padding: '2px 6px',
    borderRadius: '4px',
    background: active ? 'var(--primary)' : 'transparent',
    fontWeight: active ? 700 : 400,
    cursor: 'pointer',
    border: 'none',
    fontSize: '11px',
    fontFamily: 'monospace',
  });

  return (
    <div style={{
      position: 'fixed', bottom: '72px', right: '16px', zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end',
      background: 'var(--card-foreground)', borderRadius: '12px', padding: '8px 12px',
    }}>
	  <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {pages.map(({ to, label }) => (
          <Link key={to} to={to} style={itemStyle(location.pathname === to)}>{label}</Link>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
        {roles.map(({ role, page }) => (
          <button key={role} onClick={() => simulateRole(role, page)} style={itemStyle(user?.role === role)}>
            {role}
          </button>
        ))}
      </div>

    </div>
  );
}

export default function App() {
  const location = useLocation();

  return (
    <div className="flex flex-col min-h-screen">
      <DevBar />
      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/ui-kit" element={<UiKit />} />
          <Route path="/reporter" element={
            <ProtectedRoute roles={['teacher']}>
              <ReporterDashboard />
            </ProtectedRoute>
          } />
          <Route path="/student" element={
            <ProtectedRoute roles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          } />
          <Route path="/dashboard" element={
            <ProtectedRoute roles={['admin', 'director']}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="/quiz" element={
            <ProtectedRoute roles={['student', 'teacher']}>
              <Quiz />
            </ProtectedRoute>
          } />
          <Route path="/" element={<HomeRedirect />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
      {location.pathname !== '/ui-kit' && <Footer />}
    </div>
  );
}

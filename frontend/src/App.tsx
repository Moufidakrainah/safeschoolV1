import type { ReactElement } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ReporterDashboard from './pages/ReporterDashboard';
import StatsDashboard from './pages/StatsDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Footer from './components/Footer';
import UiKit from './pages/UiKit';

// FIX: utiliser element react car config TS actuelle expose pas JSX.Element pendant le build.
function ProtectedRoute({ children, roles }: { children: ReactElement; roles?: string[] })
{
  // Bypass désactivé automatiquement quand VITE_DEVBAR !== 'true' (toggle-devbar.sh)
  if (import.meta.env.VITE_DEVBAR === 'true') return children;
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated)
    return <Navigate to="/login" />;
  if (roles && user && !roles.includes(user.role))
      return <Navigate to="/login" />;
  return children;
}

// DevBar — visible uniquement quand VITE_DEVBAR=true (toggle via frontend/toggle-devbar.sh)
function DevBar() {
  const location = useLocation();
  if (import.meta.env.VITE_DEVBAR !== 'true') return null;
  return (
    <div style={{
      position: 'fixed', bottom: '72px', right: '16px', zIndex: 9999,
      display: 'flex', gap: '8px', alignItems: 'center',
      background: '#1a1a2e', borderRadius: '12px', padding: '8px 12px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.4)', fontSize: '12px', fontFamily: 'monospace',
    }}>
      <span style={{ color: '#fff', marginRight: '4px' }}>devbar</span>
      {[
        { to: '/ui-kit', label: '🎨 UI kit' },
        { to: '/login', label: '🔑 login' },
        { to: '/student', label: '🎒 student' },
        { to: '/reporter', label: '📋 reporter' },
        { to: '/dashboard', label: '🛡️ admin' },
        { to: '/stats', label: '📊 stats' },
      ].map(({ to, label }) => (
        <Link key={to} to={to} style={{
          color: location.pathname === to ? '#0097b2' : '#aaa',
          textDecoration: 'none', padding: '4px 8px', borderRadius: '6px',
          background: location.pathname === to ? 'rgba(0,151,178,0.15)' : 'transparent',
          fontWeight: location.pathname === to ? 700 : 400,
        }}>{label}</Link>
      ))}
    </div>
  );
}

export default function App()
{
  return (
    <div className="flex flex-col min-h-screen">

      {/* DevBar flottante (position: fixed) — ne prend pas de place dans le flux */}
      <DevBar />

      {/* Zone de contenu principale : flex-1 = grandit pour remplir tout l'espace entre le haut et le Footer
          flex flex-col = nécessaire pour que <main> à l'intérieur puisse lui-même utiliser flex-1 */}
      <div className="flex-1 flex flex-col">
        <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/ui-kit" element={<UiKit />} />
        <Route path="/stats" element={<StatsDashboard reports={[]} />} />
        <Route path="/reporter" element={
          <ProtectedRoute roles={['teacher', 'staff']}>
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
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
      </div>

      {/* Footer : toujours en bas grâce au flex-col du parent — ne scroll pas, reste visible */}
      <Footer />

    </div>
  );
}

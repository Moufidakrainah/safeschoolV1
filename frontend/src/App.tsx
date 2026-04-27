import type { ReactElement } from 'react';
import { useState, useEffect } from 'react'; // LIVRAISON: retirer useState+useEffect si DevBar supprimée
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom'; // LIVRAISON: retirer Link, useLocation si DevBar supprimée
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ReporterDashboard from './pages/ReporterDashboard';
import UiKit from './pages/UiKit';
import StatsDashboard from './pages/StatsDashboard';

// FIX: utiliser element react car config TS actuelle expose pas JSX.Element pendant le build.
function ProtectedRoute({ children, roles }: { children: ReactElement; roles?: string[] })
{
  // LIVRAISON: supprimer les 2 lignes suivantes — elles court-circuitent toute la protection par rôle
  // DEV : bypass complet pour naviguer librement via la DevBar.
  if (import.meta.env.DEV) return children;
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated)
    return <Navigate to="/login" />;
  if (roles && user && !roles.includes(user.role))
      return <Navigate to="/login" />;
  return children;
}

// LIVRAISON: supprimer tout le bloc DevBar ci-dessous (fonction + import StatsDashboard
// + import UiKit si /ui-kit non conservé + useState devBarVisible + useEffect toggle)
function DevBar() {
  const location = useLocation();
  if (import.meta.env.PROD) return null;
  return (
    <div style={{
      position: 'fixed', bottom: '16px', right: '16px', zIndex: 9999,
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
  const [devBarVisible, setDevBarVisible] = useState(true); // LIVRAISON: supprimer

  // LIVRAISON: supprimer ce useEffect (toggle Ctrl+Shift+D pour masquer/afficher la DevBar)
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        setDevBarVisible(v => !v);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <>
      {devBarVisible && <DevBar />} {/* LIVRAISON: supprimer cette ligne */}
      <Routes>
      <Route path="/login" element={<Login />} />
      {/* LIVRAISON: supprimer route ui-kit et stats (dev uniquement) */}
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
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
    </>
  );
}

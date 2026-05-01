import type { ReactElement } from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ReporterDashboard from './pages/ReporterDashboard';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Footer from './components/Footer';
import UiKit from './pages/UiKit';

function ProtectedRoute({ children, roles }: { children: ReactElement; roles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/login" />;
  return children;
}

function HomeRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role === 'student') return <Navigate to="/student" />;
  if (user?.role === 'admin' || user?.role === 'director') return <Navigate to="/dashboard" />;
  if (user?.role === 'teacher' || user?.role === 'staff') return <Navigate to="/reporter" />;
  return <Navigate to="/login" />;
}

// DevBar — visible uniquement quand VITE_DEVBAR=true
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
        { to: '/ui-kit',    label: '🎨 UI kit' },
        { to: '/login',     label: '🔑 login' },
        { to: '/dashboard', label: '🛡️ admin' },
        { to: '/student',   label: '🎒 student' },
        { to: '/reporter',  label: '📋 reporter' },
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

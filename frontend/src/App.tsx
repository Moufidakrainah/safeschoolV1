import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';

function ProtectedRoute({ children, roles }: { children: JSX.Element, roles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/login" />;
  return children;
}

function DashboardPage() {
  const { user, logoutUser } = useAuth();
  return (
    <div style={{ padding: '40px', fontFamily: 'Segoe UI, sans-serif' }}>
      <h1>Dashboard {user?.role} 🛡️</h1>
      <p>Bienvenue {user?.firstName}</p>
      <button onClick={logoutUser} style={{
        padding: '10px 20px', background: '#1a1a2e', color: 'white',
        border: 'none', borderRadius: '8px', cursor: 'pointer'
      }}>
        Se déconnecter
      </button>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/student" element={
        <ProtectedRoute roles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute roles={['admin', 'director']}>
          <DashboardPage />
        </ProtectedRoute>
      } />
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
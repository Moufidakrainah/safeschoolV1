import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';
import StudentDashboard from './pages/StudentDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ReporterDashboard from './pages/ReporterDashboard';

function ProtectedRoute({ children, roles }: { children: JSX.Element, roles?: string[] }) {
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/student" element={
        <ProtectedRoute roles={['student']}>
          <StudentDashboard />
        </ProtectedRoute>
      } />
      <Route path="/reporter" element={
        <ProtectedRoute roles={['teacher', 'staff']}>
          <ReporterDashboard />
        </ProtectedRoute>
      } />
      <Route path="/dashboard" element={
        <ProtectedRoute roles={['admin', 'director']}>
          <AdminDashboard />
        </ProtectedRoute>
      } />
      <Route path="/" element={<HomeRedirect />} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
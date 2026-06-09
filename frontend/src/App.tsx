/* Point d'entrée de l'application — définit le routage et la structure globale */

import type { ReactElement } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import Login from '@/pages/Login';
import StudentDashboard from '@/pages/StudentDashboard';
import AdminDashboard from '@/pages/AdminDashboard';
import ReporterDashboard from '@/pages/ReporterDashboard';
import PrivacyPolicy from '@/pages/PrivacyPolicy';
import TermsOfService from '@/pages/TermsOfService';
import { Footer } from '@/components/layout/Footer/Footer';
import { OfflineBanner } from '@/components/layout/OfflineBanner/OfflineBanner';
import UiKit from '@/pages/UiKit';
import Quiz from '@/pages/Quiz';

// Garde de route — redirige vers /login si non authentifié ou rôle non autorisé
function ProtectedRoute({ children, roles }: { children: ReactElement; roles?: string[] }) {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (roles && user && !roles.includes(user.role)) return <Navigate to="/login" />;
  return children;
}

// Redirection post-login — oriente l'utilisateur selon son rôle
function HomeRedirect() {
  const { isAuthenticated, user } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  if (user?.role === 'student') return <Navigate to="/student" />;
  if (user?.role === 'admin' || user?.role === 'director') return <Navigate to="/dashboard" />;
  if (user?.role === 'teacher') return <Navigate to="/reporter" />;
  return <Navigate to="/login" />;
}

// Composant racine — structure de page et table des routes
export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <OfflineBanner />
      <div className="flex-1 flex flex-col">
        <Routes>
          {/* Routes publiques */}
          <Route path="/login" element={<Login />} />
          <Route path="/ui-kit" element={<UiKit />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />

          {/* Routes protégées par rôle */}
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

          {/* Redirection home et fallback */}
          <Route path="/" element={<HomeRedirect />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}
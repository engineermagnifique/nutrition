import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

export function ProtectedRoute() {
  const { isAuthenticated, isProfileComplete, isEmailVerified, role, loading } = useAuth();

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isProfileComplete) return <Navigate to="/onboarding" replace />;
  if (!isEmailVerified) return <Navigate to="/verify-email" replace />;

  return <Outlet />;
}

export function ElderlyRoute() {
  const { role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (role !== 'elderly') return <Navigate to="/institution" replace />;
  return <Outlet />;
}

export function InstitutionRoute() {
  const { role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (role !== 'institution') return <Navigate to="/user" replace />;
  return <Outlet />;
}

export function GuestRoute() {
  const { isAuthenticated, isProfileComplete, isEmailVerified, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Spinner size="lg" /></div>;
  if (isAuthenticated && isProfileComplete && isEmailVerified) {
    return <Navigate to={role === 'institution' ? '/institution' : '/user'} replace />;
  }
  return <Outlet />;
}

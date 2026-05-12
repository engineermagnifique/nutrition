import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Spinner from '../components/ui/Spinner';

function AuthSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

// Full protection: must be logged in. Email verification only enforced post-registration.
export function ProtectedRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <AuthSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Auth only — logged in but email not required to be verified.
// Used for the /verify-email page itself so it doesn't create a redirect loop.
export function AuthRoute() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <AuthSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export function ElderlyRoute() {
  const { role, loading } = useAuth();
  if (loading) return <AuthSpinner />;
  if (role === 'institution') return <Navigate to="/institution" replace />;
  return <Outlet />;
}

export function InstitutionRoute() {
  const { role, loading } = useAuth();
  if (loading) return <AuthSpinner />;
  if (role === 'elderly') return <Navigate to="/user" replace />;
  return <Outlet />;
}

// Redirects logged-in users away from login/register.
export function GuestRoute() {
  const { isAuthenticated, role, loading } = useAuth();
  if (loading) return <AuthSpinner />;
  if (isAuthenticated) {
    return <Navigate to={role === 'institution' ? '/institution' : '/user'} replace />;
  }
  return <Outlet />;
}

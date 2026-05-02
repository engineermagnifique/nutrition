import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, ElderlyRoute, InstitutionRoute, GuestRoute } from './router/index';
import DashboardLayout from './components/layout/DashboardLayout';

// Landing
import Landing from './pages/landing/Landing';

// Auth
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';

// Onboarding
import Onboarding from './pages/onboarding/Onboarding';

// User (Elderly) pages
import UserDashboard from './pages/user/UserDashboard';
import HealthRecords from './pages/user/HealthRecords';
import MealLog from './pages/user/MealLog';
import Recommendations from './pages/user/Recommendations';
import Predictions from './pages/user/Predictions';
import UserAlerts from './pages/user/UserAlerts';

// Institution pages
import InstitutionDashboard from './pages/institution/InstitutionDashboard';
import UserList from './pages/institution/UserList';
import UserDetail from './pages/institution/UserDetail';
import InstitutionAlerts from './pages/institution/InstitutionAlerts';

import {
  LayoutDashboard, Scale, UtensilsCrossed, Sparkles, TrendingUp, Bell, Users, Building2,
} from 'lucide-react';

const qc = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
});

const userNavLinks = [
  { to: '/user', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/user/health', label: 'Health Records', icon: Scale },
  { to: '/user/meals', label: 'Meal Log', icon: UtensilsCrossed },
  { to: '/user/recommendations', label: 'Recommendations', icon: Sparkles },
  { to: '/user/predictions', label: 'Predictions', icon: TrendingUp },
  { to: '/user/alerts', label: 'Alerts', icon: Bell },
];

const institutionNavLinks = [
  { to: '/institution', label: 'Overview', icon: Building2 },
  { to: '/institution/users', label: 'Members', icon: Users },
  { to: '/institution/alerts', label: 'Alerts', icon: Bell },
];

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />

            {/* Guest-only routes (redirect authenticated users) */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Semi-auth routes */}
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/verify-email" element={<VerifyEmail />} />

            {/* Elderly user dashboard */}
            <Route element={<ProtectedRoute />}>
              <Route element={<ElderlyRoute />}>
                <Route element={<DashboardLayout navLinks={userNavLinks} />}>
                  <Route path="/user" element={<UserDashboard />} />
                  <Route path="/user/health" element={<HealthRecords />} />
                  <Route path="/user/meals" element={<MealLog />} />
                  <Route path="/user/recommendations" element={<Recommendations />} />
                  <Route path="/user/predictions" element={<Predictions />} />
                  <Route path="/user/alerts" element={<UserAlerts />} />
                </Route>
              </Route>
            </Route>

            {/* Institution dashboard */}
            <Route element={<ProtectedRoute />}>
              <Route element={<InstitutionRoute />}>
                <Route element={<DashboardLayout navLinks={institutionNavLinks} />}>
                  <Route path="/institution" element={<InstitutionDashboard />} />
                  <Route path="/institution/users" element={<UserList />} />
                  <Route path="/institution/users/:id" element={<UserDetail />} />
                  <Route path="/institution/alerts" element={<InstitutionAlerts />} />
                </Route>
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

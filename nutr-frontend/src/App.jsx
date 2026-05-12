import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute, AuthRoute, ElderlyRoute, InstitutionRoute, GuestRoute } from './router/index';
import UserLayout from './components/layout/UserLayout';
import InstitutionLayout from './components/layout/InstitutionLayout';

import Landing from './pages/landing/Landing';

import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import VerifyEmail from './pages/auth/VerifyEmail';

import UserDashboard from './pages/user/UserDashboard';
import HealthRecords from './pages/user/HealthRecords';
import MealLog from './pages/user/MealLog';
import Recommendations from './pages/user/Recommendations';
import Predictions from './pages/user/Predictions';
import UserAlerts from './pages/user/UserAlerts';
import Medications from './pages/user/Medications';
import WeeklyReport from './pages/user/WeeklyReport';

import InstitutionDashboard from './pages/institution/InstitutionDashboard';
import UserList from './pages/institution/UserList';
import UserDetail from './pages/institution/UserDetail';
import InstitutionAlerts from './pages/institution/InstitutionAlerts';
import InstitutionRecommendations from './pages/institution/InstitutionRecommendations';

const qc = new QueryClient({
  defaultOptions: { queries: { retry: 1, staleTime: 30_000 } },
});

export default function App() {
  return (
    <QueryClientProvider client={qc}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />

            {/* Guest only (logged-in users are redirected to their dashboard) */}
            <Route element={<GuestRoute />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
            </Route>

            {/* Requires authentication but NOT email verification (avoid redirect loop) */}
            <Route element={<AuthRoute />}>
              <Route path="/verify-email" element={<VerifyEmail />} />
            </Route>

            {/* Fully protected: requires auth */}
            <Route element={<ProtectedRoute />}>
              <Route element={<ElderlyRoute />}>
                <Route element={<UserLayout />}>
                  <Route path="/user" element={<UserDashboard />} />
                  <Route path="/user/health" element={<HealthRecords />} />
                  <Route path="/user/meals" element={<MealLog />} />
                  <Route path="/user/recommendations" element={<Recommendations />} />
                  <Route path="/user/predictions" element={<Predictions />} />
                  <Route path="/user/alerts" element={<UserAlerts />} />
                  <Route path="/user/medications" element={<Medications />} />
                  <Route path="/user/weekly-report" element={<WeeklyReport />} />
                </Route>
              </Route>
            </Route>

            <Route element={<ProtectedRoute />}>
              <Route element={<InstitutionRoute />}>
                <Route element={<InstitutionLayout />}>
                  <Route path="/institution" element={<InstitutionDashboard />} />
                  <Route path="/institution/users" element={<UserList />} />
                  <Route path="/institution/users/:id" element={<UserDetail />} />
                  <Route path="/institution/alerts" element={<InstitutionAlerts />} />
                  <Route path="/institution/recommendations" element={<InstitutionRecommendations />} />
                </Route>
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}

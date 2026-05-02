import api from './api';

export const authService = {
  registerInstitution: (data) => api.post('/auth/institution/register/', data),
  registerUser: (data) => api.post('/auth/user/register/', data),
  verifyEmail: (data) => api.post('/auth/verify-email/', data),
  resendVerification: (email) => api.post('/auth/resend-verification/', { email }),
  getProfile: () => api.get('/auth/profile/'),
  updateProfile: (data) => api.patch('/auth/profile/', data),
  getInstitutionProfile: () => api.get('/auth/institution/profile/'),
  updateInstitutionProfile: (data) => api.patch('/auth/institution/profile/', data),
  getInstitutionUsers: (params) => api.get('/auth/institution/users/', { params }),
  getDashboard: () => api.get('/auth/dashboard/'),
};

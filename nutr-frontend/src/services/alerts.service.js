import api from './api';

export const alertsService = {
  getAlerts: (params) => api.get('/alerts/', { params }),
  createAlert: (data) => api.post('/alerts/create/', data),
  getAlert: (id) => api.get(`/alerts/${id}/`),
  markRead: (id) => api.patch(`/alerts/${id}/mark-read/`),
  markAllRead: () => api.post('/alerts/mark-all-read/'),
};

import api from './api';

export const healthService = {
  getRecords: (params) => api.get('/health/records/', { params }),
  createRecord: (data) => api.post('/health/records/', data),
  getRecord: (id) => api.get(`/health/records/${id}/`),
  getConditions: (params) => api.get('/health/conditions/', { params }),
  createCondition: (data) => api.post('/health/conditions/', data),
  updateCondition: (id, data) => api.patch(`/health/conditions/${id}/`, data),
  deleteCondition: (id) => api.delete(`/health/conditions/${id}/`),
  getGoals: (params) => api.get('/health/goals/', { params }),
  createGoal: (data) => api.post('/health/goals/', data),
  updateGoal: (id, data) => api.patch(`/health/goals/${id}/`, data),
  deleteGoal: (id) => api.delete(`/health/goals/${id}/`),
  getSummary: (userId) => userId ? api.get(`/health/summary/${userId}/`) : api.get('/health/summary/'),
};

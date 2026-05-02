import api from './api';

export const progressService = {
  getLogs: (params) => api.get('/progress/logs/', { params }),
  createLog: (data) => api.post('/progress/logs/', data),
  getLog: (id) => api.get(`/progress/logs/${id}/`),
  deleteLog: (id) => api.delete(`/progress/logs/${id}/`),
  getCaregiverNotes: (params) => api.get('/progress/caregiver-notes/', { params }),
  createCaregiverNote: (data) => api.post('/progress/caregiver-notes/', data),
  updateCaregiverNote: (id, data) => api.patch(`/progress/caregiver-notes/${id}/`, data),
  deleteCaregiverNote: (id) => api.delete(`/progress/caregiver-notes/${id}/`),
};

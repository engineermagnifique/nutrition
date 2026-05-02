import api from './api';

export const aiService = {
  generateRecommendation: (params) => api.post('/ai/recommendations/generate/', {}, { params }),
  getRecommendations: (params) => api.get('/ai/recommendations/', { params }),
  getRecommendation: (id) => api.get(`/ai/recommendations/${id}/`),
  getPredictions: (params) => api.get('/ai/predictions/', { params }),
  getPrediction: (id) => api.get(`/ai/predictions/${id}/`),
};

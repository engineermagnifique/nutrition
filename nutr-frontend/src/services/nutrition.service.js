import api from './api';

export const nutritionService = {
  getFoodItems: (params) => api.get('/nutrition/food-items/', { params }),
  getMeals: (params) => api.get('/nutrition/meals/', { params }),
  createMeal: (data) => api.post('/nutrition/meals/', data),
  getMeal: (id) => api.get(`/nutrition/meals/${id}/`),
  updateMeal: (id, data) => api.patch(`/nutrition/meals/${id}/`, data),
  deleteMeal: (id) => api.delete(`/nutrition/meals/${id}/`),
  addMealItem: (mealId, data) => api.post(`/nutrition/meals/${mealId}/items/`, data),
  removeMealItem: (mealId, itemId) => api.delete(`/nutrition/meals/${mealId}/items/${itemId}/`),
  getDailySummary: (params) => api.get('/nutrition/daily-summary/', { params }),
};

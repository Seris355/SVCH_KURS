import api from './api';

export const analyticsService = {
  getDashboard: async (params = {}) => {
    const response = await api.get('/admin/analytics/dashboard', { params });
    return response.data;
  },
};

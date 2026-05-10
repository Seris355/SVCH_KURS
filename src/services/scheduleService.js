import api from './api';

export const scheduleService = {
  
  getAll: async (params = {}) => {
    const response = await api.get('/schedules', { params });
    return response.data;
  },

  
  getById: async (id) => {
    const response = await api.get(`/schedules/${id}`);
    return response.data;
  },
};

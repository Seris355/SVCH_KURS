import api from './api';

export const locationService = {
  getAll: async (params = {}) => {
    const response = await api.get('/locations', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/locations/${id}`);
    return response.data;
  },
};

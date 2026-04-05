import api from './api';

export const instructorService = {
  getAll: async (params = {}) => {
    const response = await api.get('/instructors', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/instructors/${id}`);
    return response.data;
  },

  checkExists: async (id) => {
    const response = await api.get(`/instructors/${id}/exists`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/instructors', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/instructors/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/instructors/${id}`);
    return response.data;
  },
};

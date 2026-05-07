import api from './api';

export const testService = {
  getAll: async (params = {}) => {
    const response = await api.get('/tests', { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/tests/${id}`);
    return response.data;
  },

  getForTaking: async (id) => {
    const response = await api.get(`/tests/${id}/take`);
    return response.data;
  },

  submit: async (id, answers) => {
    const response = await api.post(`/tests/${id}/submit`, { answers });
    return response.data;
  },

  create: async (data) => {
    const response = await api.post('/tests', data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/tests/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/tests/${id}`);
    return response.data;
  },
};

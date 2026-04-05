import api from './api';

export const participantService = {
  
  getAll: async (params = {}) => {
    const response = await api.get('/participants', { params });
    return response.data;
  },

  
  getById: async (id) => {
    const response = await api.get(`/participants/${id}`);
    return response.data;
  },

  
  checkExists: async (id) => {
    const response = await api.get(`/participants/${id}/exists`);
    return response.data;
  },

  
  create: async (data) => {
    const response = await api.post('/participants', data);
    return response.data;
  },

  
  update: async (id, data) => {
    const response = await api.put(`/participants/${id}`, data);
    return response.data;
  },

  
  delete: async (id) => {
    const response = await api.delete(`/participants/${id}`);
    return response.data;
  },

  changePassword: async (id, password) => {
    const response = await api.put(`/participants/${id}/password`, { password });
    return response.data;
  },
};

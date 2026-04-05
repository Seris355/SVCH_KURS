import api from './api';

export const masterClassService = {
  
  getAll: async (params = {}) => {
    const response = await api.get('/masterclasses', { params });
    return response.data;
  },

  
  getById: async (id) => {
    const response = await api.get(`/masterclasses/${id}`);
    return response.data;
  },

  
  checkExists: async (id) => {
    const response = await api.get(`/masterclasses/${id}/exists`);
    return response.data;
  },

  
  create: async (data) => {
    const response = await api.post('/masterclasses', data);
    return response.data;
  },

  
  update: async (id, data) => {
    const response = await api.put(`/masterclasses/${id}`, data);
    return response.data;
  },

  
  delete: async (id) => {
    const response = await api.delete(`/masterclasses/${id}`);
    return response.data;
  },

  enroll: async (id) => {
    const response = await api.post(`/masterclasses/${id}/enroll`);
    return response.data;
  },

  getMyClasses: async () => {
    const response = await api.get('/masterclasses/my-classes');
    return response.data;
  },
};

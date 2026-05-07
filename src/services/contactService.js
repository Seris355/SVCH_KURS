import api from './api';

export const contactService = {
  submit: async (payload) => {
    const response = await api.post('/contact', payload);
    return response.data;
  },

  getAll: async (params = {}) => {
    const response = await api.get('/contact', { params });
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.put(`/contact/${id}/read`);
    return response.data;
  },
};

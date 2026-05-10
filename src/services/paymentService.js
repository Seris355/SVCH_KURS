import api from './api';

export const paymentService = {
  
  getAll: async (params = {}) => {
    const response = await api.get('/payments', { params });
    return response.data;
  },

  
  getMy: async () => {
    const response = await api.get('/payments/my');
    return response.data;
  },

  
  markPaid: async (id) => {
    const response = await api.put(`/payments/${id}/paid`);
    return response.data;
  },
};

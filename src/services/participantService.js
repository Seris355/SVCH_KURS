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

  exportParticipantsPdf: async (params = {}) => {
    const response = await api.get('/participants/export/pdf', {
      params,
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'uchastniki.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

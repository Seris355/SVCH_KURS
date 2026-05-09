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

  enroll: async (id, payload = {}) => {
    const response = await api.post(`/masterclasses/${id}/enroll`, payload);
    return response.data;
  },

  getMyClasses: async () => {
    const response = await api.get('/masterclasses/my-classes');
    return response.data;
  },

  exportMyClassesPdf: async () => {
    const response = await api.get('/masterclasses/my-classes/export-pdf', {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'moi-master-klassy.pdf');
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  },
};

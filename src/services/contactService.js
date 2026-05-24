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

  getMyThread: async () => {
    const response = await api.get('/contact/my');
    return response.data;
  },

  sendMyMessage: async (message) => {
    const response = await api.post('/contact/my/messages', { message });
    return response.data;
  },

  getThreads: async (params = {}) => {
    const response = await api.get('/contact/threads', { params });
    return response.data;
  },

  getThread: async (threadId) => {
    const response = await api.get(`/contact/threads/${threadId}`);
    return response.data;
  },

  sendAdminMessage: async (threadId, message) => {
    const response = await api.post(`/contact/threads/${threadId}/messages`, { message });
    return response.data;
  },

  startThread: async (payload) => {
    const response = await api.post('/contact/threads/start', payload);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/contact/threads/unread-count');
    return response.data;
  },
};

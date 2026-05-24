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

  
  publish: async (id) => {
    const response = await api.post(`/tests/${id}/publish`);
    return response.data;
  },

  unpublish: async (id) => {
    const response = await api.post(`/tests/${id}/unpublish`);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/tests/${id}`);
    return response.data;
  },

  
  createQuestion: async (testId, data) => {
    const response = await api.post(`/tests/${testId}/questions`, data);
    return response.data;
  },

  
  updateQuestion: async (questionId, data) => {
    const response = await api.put(`/tests/questions/${questionId}`, data);
    return response.data;
  },

  
  deleteQuestion: async (questionId) => {
    const response = await api.delete(`/tests/questions/${questionId}`);
    return response.data;
  },

  
  createAnswer: async (questionId, data) => {
    const response = await api.post(`/tests/questions/${questionId}/answers`, data);
    return response.data;
  },

  
  updateAnswer: async (answerId, data) => {
    const response = await api.put(`/tests/answers/${answerId}`, data);
    return response.data;
  },

  
  deleteAnswer: async (answerId) => {
    const response = await api.delete(`/tests/answers/${answerId}`);
    return response.data;
  },
};

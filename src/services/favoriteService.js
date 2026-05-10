import api from './api';

export const favoriteService = {
  
  getMy: async () => {
    const response = await api.get('/favorites');
    return response.data;
  },

  
  add: async (masterClassId) => {
    const response = await api.post(`/favorites/${masterClassId}`);
    return response.data;
  },

  
  remove: async (masterClassId) => {
    const response = await api.delete(`/favorites/${masterClassId}`);
    return response.data;
  },
};

import api from './api';

export const reviewService = {
  create: async ({ masterClassId, rating, comment }) => {
    const response = await api.post('/reviews', {
      masterClassId,
      rating,
      comment,
    });
    return response.data;
  },
};

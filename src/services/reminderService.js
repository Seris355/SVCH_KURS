import api from './api';

export const reminderService = {
  getUpcoming: async () => {
    const response = await api.get('/reminders/upcoming');
    return response.data;
  },
};

import api from './api';

export const reminderService = {
  getStatus: async () => {
    const response = await api.get('/admin/reminders/status');
    return response.data;
  },

  runSessionReminders: async () => {
    const response = await api.post('/admin/reminders/run-session-reminders');
    return response.data;
  },
};

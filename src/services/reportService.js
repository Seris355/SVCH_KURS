import api from './api';

export const reportService = {
  scheduleParticipants: async (scheduleId) => {
    const response = await api.get(
      `/admin/reports/schedules/${scheduleId}/participants`
    );
    return response.data;
  },
};

import api from './api';

export const scheduleGroupService = {
  
  getGroup: async (scheduleId) => {
    const response = await api.get(`/schedules/${scheduleId}/group`);
    return response.data;
  },

  
  addParticipant: async (scheduleId, participantId) => {
    const response = await api.post(`/schedules/${scheduleId}/participants`, {
      participantId,
    });
    return response.data;
  },

  
  removeParticipant: async (scheduleId, participantId) => {
    const response = await api.delete(
      `/schedules/${scheduleId}/participants/${participantId}`
    );
    return response.data;
  },
};

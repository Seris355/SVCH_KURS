import api from './api';

const downloadPdfBlob = (blob, filename) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};

export const reportService = {
  scheduleParticipants: async (scheduleId) => {
    const response = await api.get(
      `/admin/reports/schedules/${scheduleId}/participants`
    );
    return response.data;
  },

  paymentsPeriod: async (params = {}) => {
    const response = await api.get('/admin/reports/payments/period', {
      params,
    });
    return response.data;
  },

  exportScheduleParticipantsPdf: async (scheduleId) => {
    const response = await api.get(
      `/admin/reports/schedules/${scheduleId}/participants/pdf`,
      { responseType: 'blob' }
    );
    downloadPdfBlob(
      new Blob([response.data], { type: 'application/pdf' }),
      `otchet-seans-${scheduleId}.pdf`
    );
  },

  exportPaymentsPeriodPdf: async (params = {}) => {
    const response = await api.get('/admin/reports/payments/period/pdf', {
      params,
      responseType: 'blob',
    });
    downloadPdfBlob(
      new Blob([response.data], { type: 'application/pdf' }),
      'finansovyy-otchet.pdf'
    );
  },
};

// Утилиты для работы с аутентификацией
export const authUtils = {
  // Получение токена
  getToken: () => localStorage.getItem('access_token'),

  // Очистка данных аутентификации
  clearAuth: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },
};
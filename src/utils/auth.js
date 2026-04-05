// Утилиты для работы с аутентификацией
export const authUtils = {
  // Получение токена
  getToken: () => localStorage.getItem('access_token'),

  // Получение пользователя
  getUser: () => {
    try {
      return JSON.parse(localStorage.getItem('user') || '{}');
    } catch {
      return {};
    }
  },

  // Проверка авторизации
  isLoggedIn: () => !!localStorage.getItem('access_token'),

  // Выход из системы
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
  },

  // Сохранение данных авторизации
  setAuthData: (accessToken, refreshToken, user) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
  },
};
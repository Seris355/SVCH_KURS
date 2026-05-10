import axios from 'axios';
import { authUtils } from '../utils/auth';

export function attachApiAuthInterceptors(apiInstance, apiBaseUrl) {
  apiInstance.interceptors.request.use((config) => {
    const token = authUtils.getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  apiInstance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const refreshToken = localStorage.getItem('refresh_token');
          if (refreshToken) {
            const { data } = await axios.post(`${apiBaseUrl}/auth/refresh`, {
              refresh_token: refreshToken,
            });
            const { access_token: accessToken } = data;
            localStorage.setItem('access_token', accessToken);
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return apiInstance(originalRequest);
          }
        } catch (refreshErr) {
          authUtils.logout();
          window.location.href = '/login';
          return Promise.reject(refreshErr);
        }
      }

      return Promise.reject(error);
    }
  );
}

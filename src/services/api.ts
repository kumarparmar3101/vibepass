import axios from 'axios';
import { useStore } from '../store/useStore';

const api = axios.create({
  baseURL: 'https://api.vibepass.example.com', // Placeholder URL
  timeout: 10000,
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    const token = useStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // If the error is a 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = useStore.getState().refreshToken;
        
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Attempt to refresh the token
        // In a real app, this would be a call to your backend
        // const response = await axios.post('https://api.vibepass.example.com/auth/refresh', { refreshToken });
        // const { token: newToken, refreshToken: newRefreshToken } = response.data;
        
        // Mocking the refresh response
        const newToken = 'mock_new_jwt_token_' + Date.now();
        const newRefreshToken = 'mock_new_refresh_token_' + Date.now();

        // Update the store with the new tokens
        useStore.getState().setTokens(newToken, newRefreshToken);

        // Update the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log the user out
        useStore.getState().logout();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;

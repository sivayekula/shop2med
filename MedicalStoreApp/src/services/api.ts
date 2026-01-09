import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = 'http://192.168.1.14:8000/api'; // Change for production

const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - add auth token
api.interceptors.request.use(
  async (config) => {
    console.log('API Request interceptor - making request to:', config.url);
    const token = await AsyncStorage.getItem('accessToken');
    console.log('API Request interceptor - retrieved token:', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('API Request interceptor - added Authorization header:', config.headers.Authorization);
    } else {
      console.log('API Request interceptor - No token found in AsyncStorage');
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => {
    console.log('API Response interceptor - success:', response.status, response.config.url);
    return response;
  },
  async (error) => {
    console.log('API Response interceptor - error:', error.response?.status, error.config?.url);
    console.log('API Response interceptor - error data:', error.response?.data);
    
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('API Response interceptor - 401 detected, attempting token refresh');
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem('refreshToken');
        console.log('API Response interceptor - retrieved refresh token:', !!refreshToken);
        
        if (!refreshToken) {
          console.log('API Response interceptor - no refresh token, clearing storage');
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
          return Promise.reject(error);
        }

        const response = await axios.post(`${API_URL}/auth/refresh`, { 
          refreshToken 
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;
        console.log('API Response interceptor - new tokens received:', !!accessToken);
        
        await AsyncStorage.setItem('accessToken', accessToken);
        await AsyncStorage.setItem('refreshToken', newRefreshToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.log('API Response interceptor - refresh failed, clearing storage');
        await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'user']);
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
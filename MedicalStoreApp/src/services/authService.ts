import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone: string;
  role: string;
}

class AuthService {
  async login(credentials: LoginCredentials) {
    try {
      console.log('AuthService: Login attempt for:', credentials.email);
      const response = await api.post('/auth/login', credentials);
      console.log('AuthService: Login response:', response.data);
      const { accessToken, refreshToken, user } = response.data;
      
      console.log('AuthService: Storing accessToken:', accessToken);
      console.log('AuthService: Storing refreshToken:', refreshToken);
      
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // Verify tokens were stored
      const storedAccessToken = await AsyncStorage.getItem('accessToken');
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      console.log('AuthService: Verification - stored accessToken:', storedAccessToken);
      console.log('AuthService: Verification - stored refreshToken:', storedRefreshToken);
      
      return { success: true, user, accessToken, refreshToken };
    } catch (error: any) {
      console.error('AuthService: Login error:', error);
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  }

  async register(data: RegisterData) {
    try {
      console.log('AuthService: Register attempt for:', data.email);
      const response = await api.post('/auth/register', data);
      console.log('AuthService: Register response:', response.data);
      const { accessToken, refreshToken, user } = response.data;
      
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      return { success: true, user, accessToken, refreshToken };
    } catch (error: any) {
      console.error('AuthService: Register error:', error);
      return { success: false, error: error.response?.data?.message || 'Registration failed' };
    }
  }

  async logout() {
    try {
      console.log('AuthService: Logout attempt');
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      console.log('AuthService: Logout successful');
      return { success: true };
    } catch (error) {
      console.error('AuthService: Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  async getCurrentUser() {
    try {
      const userString = await AsyncStorage.getItem('user');
      console.log('AuthService: Retrieved user from storage:', userString);
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('AuthService: Get user error:', error);
      return null;
    }
  }

  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      console.log('AuthService: isAuthenticated check - token exists:', !!token);
      console.log('AuthService: isAuthenticated check - token value:', token);
      return !!token;
    } catch (error) {
      console.error('AuthService: Check auth error:', error);
      return false;
    }
  }
}

export default new AuthService();
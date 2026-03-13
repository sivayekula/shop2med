import AsyncStorage from '@react-native-async-storage/async-storage';
import api from './api';
import biometricService from './biometricService';

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
      const response = await api.post('/auth/login', credentials);
      
      const { accessToken, refreshToken, user } = response.data;
      
      if (!accessToken || !refreshToken || !user) {
        throw new Error('Invalid response from server');
      }
      
      await AsyncStorage.setItem('accessToken', accessToken);
      await AsyncStorage.setItem('refreshToken', refreshToken);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // Check if device supports biometrics and store credentials if needed
      const isSupported = await biometricService.isSupported();
      const hasEnrolled = await biometricService.hasEnrolledBiometrics();
      const isBiometricEnabled = await biometricService.isBiometricEnabled();
      
      // Always store credentials if device supports biometrics (user can enable later)
      if (isSupported && hasEnrolled) {
        await biometricService.storeCredentials(credentials.email, credentials.password);
      }
      
      // Verify tokens were stored
      const storedAccessToken = await AsyncStorage.getItem('accessToken');
      const storedRefreshToken = await AsyncStorage.getItem('refreshToken');
      const storedUser = await AsyncStorage.getItem('user');
      
      return { success: true, user, accessToken, refreshToken };
    } catch (error: any) {
      console.error('AuthService: Login error:', error);
      return { success: false, error: error.response?.data?.message || 'Login failed' };
    }
  }

  async register(data: RegisterData) {
    try {
      const response = await api.post('/auth/register', data);
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
      // Check if biometric is enabled before clearing credentials
      const isBiometricEnabled = await biometricService.isBiometricEnabled();
      
      // Only clear biometric credentials if biometric is disabled
      if (!isBiometricEnabled) {
        await biometricService.clearCredentials();
      }
      
      // Clear auth tokens and user data
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      await AsyncStorage.removeItem('user');
      
      return { success: true };
    } catch (error) {
      console.error('AuthService: Logout error:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  // Biometric login method
  async biometricLogin() {
    try {
      // Authenticate with biometrics
      const biometricResult = await biometricService.authenticateForLogin();
      
      if (!biometricResult.success) {
        return { success: false, error: biometricResult.error || 'Biometric authentication failed' };
      }
      
      // Get stored credentials
      const userEmail = await AsyncStorage.getItem('userEmail');
      const userPassword = await AsyncStorage.getItem('userPassword');
      
      if (!userEmail || !userPassword) {
        return { success: false, error: 'No stored credentials found' };
      }
      
      // Login with stored credentials
      const loginResult = await this.login({ email: userEmail, password: userPassword });
      
      return loginResult;
    } catch (error: any) {
      console.error('AuthService: Biometric login error:', error);
      return { success: false, error: error.message || 'Biometric login failed' };
    }
  }

  async getCurrentUser() {
    try {
      const userString = await AsyncStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('AuthService: Get user error:', error);
      return null;
    }
  }

  async isAuthenticated() {
    try {
      const token = await AsyncStorage.getItem('accessToken');
      return !!token;
    } catch (error) {
      console.error('AuthService: Check auth error:', error);
      return false;
    }
  }
}

export default new AuthService();
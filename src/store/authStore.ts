import { create } from 'zustand';
import authService from '../services/authService';
import biometricService from '../services/biometricService';

interface User {
  id: string;
  email: string;
  name: string;
  shopName: string;
  role: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  loadUser: () => Promise<void>;
  biometricLogin: () => Promise<void>;
  enableBiometric: () => Promise<boolean>;
  disableBiometric: () => Promise<void>;
  isBiometricEnabled: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authService.login({ email, password });
      
      if (response.success) {
        set({ user: response.user, isAuthenticated: true, isLoading: false });
      } else {
        set({ error: response.error, isLoading: false });
        throw new Error(response.error);
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.message || error.message || 'Login failed';
      
      set({ 
        error: errorMessage, 
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(data);
      if (response.success) {
        set({ user: response.user, isAuthenticated: true, isLoading: false });
      } else {
        set({ error: response.error, isLoading: false });
        throw new Error(response.error);
      }
    } catch (error: any) {
      set({ 
        error: error.response?.data?.message || error.message || 'Registration failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  loadUser: async () => {
    const isAuth = await authService.isAuthenticated();
    if (isAuth) {
      try {
        const user = await authService.getCurrentUser();
        if (user) {
          set({ user, isAuthenticated: true });
        } else {
          set({ user: null, isAuthenticated: false });
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        console.error('Load user error:', error);
        set({ user: null, isAuthenticated: false });
      }
    } else {
      set({ user: null, isAuthenticated: false });
    }
  },

  // Biometric login
  biometricLogin: async () => {
    set({ isLoading: true, error: null });
    
    try {
      const response = await authService.biometricLogin();
      
      if (response.success) {
        set({ user: response.user, isAuthenticated: true, isLoading: false });
      } else {
        set({ error: response.error, isLoading: false });
        throw new Error(response.error);
      }
    } catch (error: any) {
      set({ 
        error: error.message || 'Biometric login failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  // Enable biometric authentication
  enableBiometric: async () => {
    try {
      const result = await biometricService.enableBiometric();
      
      if (result.success) {
        return true;
      } else {
        throw new Error(result.error || 'Failed to enable biometric authentication');
      }
    } catch (error: any) {
      throw error;
    }
  },

  // Disable biometric authentication
  disableBiometric: async () => {
    try {
      await biometricService.disableBiometric();
    } catch (error: any) {
      throw error;
    }
  },

  // Check if biometric is enabled
  isBiometricEnabled: async () => {
    try {
      const enabled = await biometricService.isBiometricEnabled();
      return enabled;
    } catch (error: any) {
      return false;
    }
  },
}));
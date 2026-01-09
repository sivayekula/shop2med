import { create } from 'zustand';
import authService from '../services/authService';

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
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    console.log('Login attempt:', { email, password: '***' });
    set({ isLoading: true, error: null });
    try {
      const response = await authService.login({ email, password });
      console.log('Login response:', response);
      if (response.success) {
        set({ user: response.user, isAuthenticated: true, isLoading: false });
      } else {
        set({ error: response.error, isLoading: false });
        throw new Error(response.error);
      }
    } catch (error: any) {
      console.error('Login error:', error);
      set({ 
        error: error.response?.data?.message || error.message || 'Login failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  register: async (data) => {
    console.log('Register attempt:', { email: data.email, name: data.name });
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register(data);
      console.log('Register response:', response);
      if (response.success) {
        set({ user: response.user, isAuthenticated: true, isLoading: false });
      } else {
        set({ error: response.error, isLoading: false });
        throw new Error(response.error);
      }
    } catch (error: any) {
      console.error('Register error:', error);
      set({ 
        error: error.response?.data?.message || error.message || 'Registration failed', 
        isLoading: false 
      });
      throw error;
    }
  },

  logout: async () => {
    console.log('Logout attempt');
    try {
      const response = await authService.logout();
      console.log('Logout response:', response);
      set({ user: null, isAuthenticated: false });
    } catch (error) {
      console.error('Logout error:', error);
    }
  },

  loadUser: async () => {
    console.log('Loading user from storage');
    const isAuth = await authService.isAuthenticated();
    console.log('Is authenticated:', isAuth);
    if (isAuth) {
      try {
        const user = await authService.getCurrentUser();
        console.log('Loaded user:', user);
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
}));
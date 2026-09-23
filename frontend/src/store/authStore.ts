import { create } from 'zustand';
import { authApi } from '@/lib/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, fullName: string, password: string, role: 'ADMIN' | 'ANALYST' | 'VIEWER') => Promise<void>;
  logout: () => void;
  fetchMe: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  isLoading: false,
  error: null,

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(email, password);
      const token = res.data.access_token;
      localStorage.setItem('token', token);
      const meRes = await authApi.me();
      set({ token, user: meRes.data, isLoading: false });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Login failed';
      set({ error: message, isLoading: false });
    }
  },

  register: async (email, fullName, password, role) => {
    set({ isLoading: true, error: null });
    try {
      await authApi.register(email, fullName, password, role);
      // Auto-login after register
      const res = await authApi.login(email, password);
      const token = res.data.access_token;
      localStorage.setItem('token', token);
      const meRes = await authApi.me();
      set({ token, user: meRes.data, isLoading: false });
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Registration failed';
      set({ error: message, isLoading: false });
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },

  fetchMe: async () => {
    set({ isLoading: true });
    try {
      const res = await authApi.me();
      set({ user: res.data, isLoading: false });
    } catch {
      set({ user: null, token: null, isLoading: false });
      localStorage.removeItem('token');
    }
  },
}));

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../lib/api';

interface User {
  id: string;
  email: string;
  nombre: string;
  role: 'admin' | 'employee';
}

interface AuthState {
  user: User | null;
  token: string | null;
  tokenExpiry: number | null;
  setAuth: (user: User, token: string, expiresIn: number) => void;
  logout: () => Promise<void>;
  isTokenExpired: () => boolean;
  checkAndRefreshToken: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      tokenExpiry: null,
      
      setAuth: (user, token, expiresIn) => {
        const expiryTime = Date.now() + expiresIn * 1000;
        set({ user, token, tokenExpiry: expiryTime });
        
        // Configurar auto-logout antes de expiración
        const timeUntilExpiry = expiresIn * 1000 - 60000; // 1 minuto antes
        setTimeout(() => {
          const state = get();
          if (state.isTokenExpired()) {
            state.logout();
          }
        }, timeUntilExpiry);
      },
      
      logout: async () => {
        const { token } = get();
        if (token) {
          try {
            await api.post('/auth/logout');
          } catch (error) {
            console.error('Error al cerrar sesión:', error);
          }
        }
        set({ user: null, token: null, tokenExpiry: null });
      },
      
      isTokenExpired: () => {
        const { tokenExpiry } = get();
        if (!tokenExpiry) return true;
        return Date.now() >= tokenExpiry;
      },
      
      checkAndRefreshToken: () => {
        const state = get();
        if (state.isTokenExpired()) {
          state.logout();
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

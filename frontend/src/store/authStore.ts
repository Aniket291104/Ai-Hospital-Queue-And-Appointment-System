import { create } from 'zustand';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'Patient' | 'Doctor' | 'Receptionist' | 'Admin' | 'SuperAdmin';
  avatar?: string;
  isEmailVerified: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  setAuth: (user: User | null, token: string | null) => void;
  updateUser: (fields: Partial<User>) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  setAuth: (user, token) => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
    set({ user, token });
  },
  updateUser: (fields) => {
    set((state) => ({
      user: state.user ? { ...state.user, ...fields } : null,
    }));
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  },
}));

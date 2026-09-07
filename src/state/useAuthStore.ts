import { create } from 'zustand';
import { UserRole } from '../core/rbac/permissions';

interface AuthState {
  role: UserRole;
  userName: string;
  userEmail: string;
  organization: string;
  isAuthenticated: boolean;
  setRole: (role: UserRole) => void;
  signIn: (email?: string) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
  role: 'submitter',
  userName: 'Shaikh Azhar',
  userEmail: 'ops@sample-tpa.in',
  organization: 'Sunrise Multispecialty',
  isAuthenticated: true,
  setRole: role => set({ role }),
  signIn: (email = 'ops@sample-tpa.in') => set({ isAuthenticated: true, userEmail: email }),
  signOut: () => set({ isAuthenticated: false }),
}));

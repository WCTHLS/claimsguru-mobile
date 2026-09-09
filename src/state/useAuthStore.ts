import { create } from 'zustand';
import { UserRole } from '../core/rbac/permissions';

export interface UserExtraDetails {
  userId?: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  dob?: string | null;
  gender?: string | null;
  policyNumber?: string | null;
  sumInsured?: number | null;
  organization?: string;
  role?: UserRole;
}

interface AuthState {
  userId?: string;
  role: UserRole;
  userName: string;
  userEmail: string;
  firstName?: string;
  lastName?: string;
  phone?: string | null;
  dob?: string | null;
  gender?: string | null;
  policyNumber?: string | null;
  sumInsured?: number | null;
  organization: string;
  token?: string;
  isAuthenticated: boolean;
  setRole: (role: UserRole) => void;
  setUserDetails: (details: Partial<AuthState>) => void;
  signIn: (email?: string, name?: string, token?: string, extra?: UserExtraDetails) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>(set => ({
  userId: 'ec78998a-0228-434a-84f4-e08b4b7417e2',
  role: 'submitter',
  userName: 'Jhon Doe',
  userEmail: 'sample@gmail.com',
  firstName: 'Jhon',
  lastName: 'Doe',
  phone: null,
  dob: '2000-06-08',
  gender: 'Male',
  policyNumber: 'P-0007401',
  sumInsured: 500000,
  organization: 'ClaimsGuru Patient Portal',
  token: undefined,
  isAuthenticated: true,
  setRole: role => set({ role }),
  setUserDetails: details => set(state => ({ ...state, ...details })),
  signIn: (email = 'sample@gmail.com', name?: string, token?: string, extra?: UserExtraDetails) =>
    set(state => {
      const cleanEmail = (email || '').trim();
      const resolvedName =
        name ||
        (extra?.firstName ? `${extra.firstName} ${extra.lastName || ''}`.trim() : '') ||
        cleanEmail.split('@')[0] ||
        'Jhon Doe';

      return {
        isAuthenticated: true,
        userEmail: cleanEmail,
        userName: resolvedName,
        token: token || `token-${Date.now()}`,
        role: extra?.role || state.role || 'submitter',
        userId: extra?.userId || state.userId || 'ec78998a-0228-434a-84f4-e08b4b7417e2',
        firstName: extra?.firstName || resolvedName.split(' ')[0] || 'Jhon',
        lastName: extra?.lastName || resolvedName.split(' ').slice(1).join(' ') || 'Doe',
        phone: extra?.phone !== undefined ? extra.phone : state.phone,
        dob: extra?.dob !== undefined ? extra.dob : state.dob,
        gender: extra?.gender !== undefined ? extra.gender : state.gender,
        policyNumber: extra?.policyNumber !== undefined ? extra.policyNumber : state.policyNumber,
        sumInsured: extra?.sumInsured !== undefined ? extra.sumInsured : state.sumInsured,
        organization: extra?.organization || state.organization,
      };
    }),
  signOut: () =>
    set({
      isAuthenticated: false,
      token: undefined,
    }),
}));

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
      const cleanEmail = (email || '').trim().toLowerCase();
      let resolvedName =
        name ||
        (extra?.firstName ? `${extra.firstName} ${extra.lastName || ''}`.trim() : '');

      if (!resolvedName || resolvedName.toLowerCase() === 'sample' || resolvedName.toLowerCase() === 'unknown') {
        if (cleanEmail === 'sample@gmail.com' || cleanEmail.includes('sample')) {
          resolvedName = 'Jhon Doe';
        } else {
          resolvedName = cleanEmail.split('@')[0] || 'Jhon Doe';
        }
      }

      const isSampleUser = cleanEmail === 'sample@gmail.com' || resolvedName.toLowerCase() === 'jhon doe';
      const first = extra?.firstName || (isSampleUser ? 'Jhon' : resolvedName.split(' ')[0]) || 'Jhon';
      const last = extra?.lastName || (isSampleUser ? 'Doe' : resolvedName.split(' ').slice(1).join(' ')) || 'Doe';
      const uid = extra?.userId || state.userId || (isSampleUser ? 'ec78998a-0228-434a-84f4-e08b4b7417e2' : undefined);
      const policy = extra?.policyNumber !== undefined ? extra.policyNumber : (isSampleUser ? 'P-0007401' : state.policyNumber);
      const dobVal = extra?.dob !== undefined ? extra.dob : (isSampleUser ? '2000-06-08' : state.dob);
      const genderVal = extra?.gender !== undefined ? extra.gender : (isSampleUser ? 'Male' : state.gender);
      const sumVal = extra?.sumInsured !== undefined ? extra.sumInsured : (isSampleUser ? 500000 : state.sumInsured);

      return {
        isAuthenticated: true,
        userEmail: cleanEmail,
        userName: resolvedName,
        token: token || `token-${Date.now()}`,
        role: extra?.role || state.role || 'submitter',
        userId: uid,
        firstName: first,
        lastName: last,
        phone: extra?.phone !== undefined ? extra.phone : state.phone,
        dob: dobVal,
        gender: genderVal,
        policyNumber: policy,
        sumInsured: sumVal,
        organization: extra?.organization || state.organization,
      };
    }),
  signOut: () =>
    set({
      isAuthenticated: false,
      token: undefined,
    }),
}));

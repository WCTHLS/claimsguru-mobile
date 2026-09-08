import { create } from 'zustand';
import { ClaimItem, INITIAL_CLAIMS } from '../mocks/claims.mock';
import { claimsApi } from '../features/claims/services/claimsApi';

interface ClaimsState {
  claims: ClaimItem[];
  selectedClaimId: string;
  filter: string;
  loading: boolean;
  refreshing: boolean;
  backendConnected: boolean;
  error: string | null;

  setFilter: (filter: string) => void;
  selectClaim: (id: string) => void;
  loadClaims: (refresh?: boolean) => Promise<void>;
  indexClaim: (id: string) => Promise<void>;
  deleteClaim: (id: string) => Promise<void>;
  addOrUpdateClaim: (claim: Partial<ClaimItem> & { id: string }) => void;
  getClaim: (id: string) => ClaimItem | undefined;
}

export const useClaimsStore = create<ClaimsState>((set, get) => ({
  claims: INITIAL_CLAIMS,
  selectedClaimId: INITIAL_CLAIMS[0].id,
  filter: 'All',
  loading: false,
  refreshing: false,
  backendConnected: false,
  error: null,

  setFilter: filter => set({ filter }),
  selectClaim: id => set({ selectedClaimId: id }),

  loadClaims: async (refresh = false) => {
    if (refresh) {
      set({ refreshing: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const res = await claimsApi.getClaims(0, 100);
      const backendClaims = res.claims || [];

      if (backendClaims.length > 0) {
        const backendIds = new Set(backendClaims.map(c => c.id));
        const nonDuplicateMock = INITIAL_CLAIMS.filter(c => !backendIds.has(c.id));
        set({
          claims: [...backendClaims, ...nonDuplicateMock],
          backendConnected: true,
          loading: false,
          refreshing: false,
        });
      } else {
        set({
          backendConnected: true,
          loading: false,
          refreshing: false,
        });
      }
    } catch (err: any) {
      console.warn('[useClaimsStore] Could not fetch claims from backend:', err?.message || err);
      set({
        backendConnected: false,
        error: err?.message || 'Backend unreachable',
        loading: false,
        refreshing: false,
      });
    }
  },

  indexClaim: async id => {
    set(state => ({
      claims: state.claims.map(c => (c.id === id ? { ...c, indexed: true } : c)),
    }));

    try {
      await claimsApi.indexClaim(id);
    } catch (err) {
      console.warn(`[useClaimsStore] Failed to index claim ${id} in backend:`, err);
    }
  },

  deleteClaim: async id => {
    set(state => {
      const remaining = state.claims.filter(c => c.id !== id);
      return {
        claims: remaining,
        selectedClaimId: remaining.length > 0 ? remaining[0].id : '',
      };
    });

    try {
      await claimsApi.deleteClaim(id);
    } catch (err) {
      console.warn(`[useClaimsStore] Failed to delete claim ${id} in backend:`, err);
    }
  },

  addOrUpdateClaim: updated =>
    set(state => {
      const exists = state.claims.some(c => c.id === updated.id);
      if (exists) {
        return {
          claims: state.claims.map(c => (c.id === updated.id ? { ...c, ...updated } : c)),
          selectedClaimId: updated.id,
        };
      }
      return {
        claims: [updated as ClaimItem, ...state.claims],
        selectedClaimId: updated.id,
      };
    }),

  getClaim: id => get().claims.find(c => c.id === id) || get().claims[0],
}));

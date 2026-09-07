import { create } from 'zustand';
import { ClaimItem, INITIAL_CLAIMS } from '../mocks/claims.mock';

interface ClaimsState {
  claims: ClaimItem[];
  selectedClaimId: string;
  filter: string;
  setFilter: (filter: string) => void;
  selectClaim: (id: string) => void;
  indexClaim: (id: string) => void;
  deleteClaim: (id: string) => void;
  addOrUpdateClaim: (claim: Partial<ClaimItem> & { id: string }) => void;
  getClaim: (id: string) => ClaimItem | undefined;
}

export const useClaimsStore = create<ClaimsState>((set, get) => ({
  claims: INITIAL_CLAIMS,
  selectedClaimId: INITIAL_CLAIMS[0].id,
  filter: 'All',
  setFilter: filter => set({ filter }),
  selectClaim: id => set({ selectedClaimId: id }),
  indexClaim: id =>
    set(state => ({
      claims: state.claims.map(c => (c.id === id ? { ...c, indexed: true } : c)),
    })),
  deleteClaim: id =>
    set(state => {
      const remaining = state.claims.filter(c => c.id !== id);
      return {
        claims: remaining,
        selectedClaimId: remaining.length > 0 ? remaining[0].id : '',
      };
    }),
  addOrUpdateClaim: updated =>
    set(state => {
      const exists = state.claims.some(c => c.id === updated.id);
      if (exists) {
        return {
          claims: state.claims.map(c => (c.id === updated.id ? { ...c, ...updated } : c)),
        };
      }
      return {
        claims: [updated as ClaimItem, ...state.claims],
        selectedClaimId: updated.id,
      };
    }),
  getClaim: id => get().claims.find(c => c.id === id) || get().claims[0],
}));

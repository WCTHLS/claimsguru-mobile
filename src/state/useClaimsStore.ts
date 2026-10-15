import { create } from 'zustand';
import { ClaimItem } from '../mocks/claims.mock';
import { claimsApi, BackendClaimPreview } from '../features/claims/services/claimsApi';
import { useAuthStore } from './useAuthStore';

interface ClaimsState {
  claims: ClaimItem[];
  selectedClaimId: string;
  filter: string;
  loading: boolean;
  refreshing: boolean;
  backendConnected: boolean;
  error: string | null;
  claimPreviews: Record<string, BackendClaimPreview>;

  setFilter: (filter: string) => void;
  selectClaim: (id: string) => void;
  loadClaims: (refresh?: boolean, patientIdOverride?: string) => Promise<void>;
  indexClaim: (id: string) => Promise<void>;
  deleteClaim: (id: string) => Promise<void>;
  removeDuplicateClaims: (oldClaimId?: string | null, documentNames?: string[]) => void;
  addOrUpdateClaim: (claim: Partial<ClaimItem> & { id: string }) => void;
  getClaim: (id: string) => ClaimItem | undefined;
  setClaimPreview: (id: string, preview: BackendClaimPreview) => void;
  fetchClaimPreview: (id: string) => Promise<BackendClaimPreview | null>;
  clearClaims: () => void;
}

export const useClaimsStore = create<ClaimsState>((set, get) => ({
  claims: [],
  selectedClaimId: '',
  filter: 'All',
  loading: false,
  refreshing: false,
  backendConnected: false,
  error: null,
  claimPreviews: {},

  clearClaims: () =>
    set({
      claims: [],
      selectedClaimId: '',
      claimPreviews: {},
      error: null,
    }),

  setFilter: filter => set({ filter }),
  selectClaim: id => set({ selectedClaimId: id }),

  setClaimPreview: (id, preview) =>
    set(state => ({
      claimPreviews: { ...state.claimPreviews, [id]: preview },
    })),

  fetchClaimPreview: async id => {
    try {
      const preview = await claimsApi.getClaimPreview(id);
      if (preview) {
        set(state => ({
          claimPreviews: { ...state.claimPreviews, [id]: preview },
        }));
        return preview;
      }
      return null;
    } catch (err) {
      console.warn(`[useClaimsStore] Failed to fetch preview for claim ${id}:`, err);
      return null;
    }
  },

  loadClaims: async (refresh = false, patientIdOverride?: string) => {
    if (refresh) {
      set({ refreshing: true, error: null });
    } else {
      set({ loading: true, error: null });
    }

    try {
      const auth = useAuthStore.getState();
      const patientId = patientIdOverride || auth.userId || undefined;
      const res = await claimsApi.getClaims(0, 100, patientId);
      let backendClaims = res.claims || [];

      // If no claims found with current userId, but user email is known, try refreshing user profile from backend
      // This self-heals any mismatched or cross-environment user IDs (e.g. Preprod vs Local DB)
      if (backendClaims.length === 0 && auth.userEmail) {
        try {
          const { fetchUserProfile } = require('../core/api/authApi');
          const profile = await fetchUserProfile(auth.userEmail);
          if (profile && profile.user_id && profile.user_id !== auth.userId) {
            const retryRes = await claimsApi.getClaims(0, 100, profile.user_id);
            if (retryRes.claims && retryRes.claims.length > 0) {
              backendClaims = retryRes.claims;
            }
          }
        } catch {}
      }

      // Reconcile with actively running pipeline to guarantee live status is never overwritten by stale DB read
      let finalClaims = backendClaims;
      try {
        const { usePipelineStore } = require('./usePipelineStore');
        const pipeline = usePipelineStore.getState();
        if (pipeline.running && pipeline.claimId) {
          const stepMap: ('ocr' | 'parse' | 'code' | 'predict' | 'validate')[] = ['ocr', 'parse', 'code', 'predict', 'validate'];
          const activeStep = stepMap[pipeline.currentStepIndex] || 'code';
          const hasRunningInBackend = backendClaims.some(
            c => c.id === pipeline.claimId || c.id.startsWith(pipeline.claimId.slice(0, 8))
          );
          if (hasRunningInBackend) {
            finalClaims = backendClaims.map(c => {
              const isTarget = c.id === pipeline.claimId || c.id.startsWith(pipeline.claimId.slice(0, 8));
              if (isTarget) {
                return {
                  ...c,
                  status: 'running' as const,
                  step: activeStep,
                };
              }
              return c;
            });
          } else {
            const localRunning = get().claims.find(
              c => c.id === pipeline.claimId || c.id.startsWith(pipeline.claimId.slice(0, 8))
            );
            if (localRunning) {
              finalClaims = [{ ...localRunning, status: 'running', step: activeStep }, ...backendClaims];
            }
          }
        }
      } catch {}

      set({
        claims: finalClaims,
        selectedClaimId: finalClaims[0]?.id || '',
        backendConnected: true,
        loading: false,
        refreshing: false,
      });
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
      const remaining = state.claims.filter(c => c.id !== id && !c.id.startsWith(id.slice(0, 8)) && !id.startsWith(c.id.slice(0, 8)));
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

  removeDuplicateClaims: (oldClaimId?: string | null, documentNames?: string[]) => {
    const names = (documentNames || []).map(n => n.trim().toLowerCase()).filter(Boolean);
    const targetOldId = oldClaimId ? oldClaimId.toLowerCase() : null;

    set(state => {
      const remaining = state.claims.filter(c => {
        const cId = (c.id || '').toLowerCase();
        if (
          targetOldId &&
          (cId === targetOldId ||
            cId.startsWith(targetOldId.slice(0, 8)) ||
            targetOldId.startsWith(cId.slice(0, 8)))
        ) {
          return false;
        }
        if (names.length > 0 && c.documents && Array.isArray(c.documents)) {
          const hasMatchingDoc = c.documents.some(d => {
            const dName = (d.file_name || (d as any).original_filename || (d as any).name || '').trim().toLowerCase();
            return dName && names.includes(dName);
          });
          if (hasMatchingDoc) return false;
        }
        return true;
      });

      return {
        claims: remaining,
        selectedClaimId: remaining.length > 0
          ? (remaining.some(c => c.id === state.selectedClaimId) ? state.selectedClaimId : remaining[0].id)
          : '',
      };
    });

    if (oldClaimId) {
      claimsApi.deleteClaim(oldClaimId).catch(err => {
        console.warn(`[useClaimsStore] removeDuplicateClaims backend delete error:`, err);
      });
    }
  },

  addOrUpdateClaim: updated =>
    set(state => {
      const isMatch = (cId: string, uId: string) =>
        cId === uId ||
        (cId && uId && cId.length >= 8 && uId.length >= 8 && (cId.startsWith(uId.slice(0, 8)) || uId.startsWith(cId.slice(0, 8))));

      const exists = state.claims.some(c => isMatch(c.id, updated.id));
      if (exists) {
        return {
          claims: state.claims.map(c => (isMatch(c.id, updated.id) ? { ...c, ...updated } : c)),
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

import { Platform } from 'react-native';
import { useAuthStore } from '../../state/useAuthStore';
import { appStorage } from '../storage/appStorage';

const HARD_REFRESH_FLAG = 'cg_hard_refresh_trigger';
const CACHE_NAME = 'cg_cache_marker_v1';
const CACHE_MARKER_URL = '/__cg_hard_refresh_marker';

let isShiftDown = false;
let isInitialized = false;

export const performHardRefreshLogout = () => {
  try {
    if (typeof window !== 'undefined') {
      window.sessionStorage?.removeItem('cg_had_auth');
      window.sessionStorage?.removeItem(HARD_REFRESH_FLAG);
      window.localStorage?.removeItem('cg_nav_state');
    }
    appStorage.removeItem('cg_nav_state');
  } catch {}

  try {
    useAuthStore.getState().signOut();
  } catch {}

  try {
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState(null, '', '/signin');
    }
  } catch {}
};

export const initHardRefreshDetection = () => {
  if (isInitialized || Platform.OS !== 'web' || typeof window === 'undefined') {
    return;
  }
  isInitialized = true;

  // 1. Check if the previous unload was triggered by a hard refresh shortcut
  try {
    const wasHardRefresh = window.sessionStorage?.getItem(HARD_REFRESH_FLAG) === 'true';
    if (wasHardRefresh) {
      window.sessionStorage?.removeItem(HARD_REFRESH_FLAG);
      performHardRefreshLogout();
      return;
    }
  } catch {}

  // 2. DevTools "Empty Cache and Hard Reload" detection via CacheStorage
  if ('caches' in window) {
    window.caches
      .open(CACHE_NAME)
      .then(async (cache) => {
        const match = await cache.match(CACHE_MARKER_URL);
        const hadAuth = window.sessionStorage?.getItem('cg_had_auth') === 'true';

        // If session previously had authentication, but the cache was wiped completely:
        if (hadAuth && !match) {
          performHardRefreshLogout();
          return;
        }

        const isAuth = useAuthStore.getState().isAuthenticated;
        if (isAuth) {
          window.sessionStorage?.setItem('cg_had_auth', 'true');
          await cache.put(CACHE_MARKER_URL, new Response('active'));
        }
      })
      .catch(() => {});
  }

  // 3. Listen for keyboard hard-refresh combinations
  // - Ctrl + Shift + R / Cmd + Shift + R
  // - Ctrl + F5
  // - Shift + F5
  // - Shift + Reload
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      isShiftDown = true;
    }

    const isCtrlOrMeta = e.ctrlKey || e.metaKey;
    const isShift = e.shiftKey;
    const isR = e.key === 'r' || e.key === 'R' || e.keyCode === 82;
    const isF5 = e.key === 'F5' || e.keyCode === 116;

    if ((isCtrlOrMeta && isShift && isR) || ((isCtrlOrMeta || isShift) && isF5)) {
      try {
        window.sessionStorage?.setItem(HARD_REFRESH_FLAG, 'true');
      } catch {}
      performHardRefreshLogout();
    }
  };

  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      isShiftDown = false;
    }
  };

  // 4. Listen for beforeunload: if user clicks browser reload icon while holding Shift
  const handleBeforeUnload = () => {
    if (isShiftDown) {
      try {
        window.sessionStorage?.setItem(HARD_REFRESH_FLAG, 'true');
      } catch {}
      performHardRefreshLogout();
    }
  };

  window.addEventListener('keydown', handleKeyDown, true);
  window.addEventListener('keyup', handleKeyUp, true);
  window.addEventListener('beforeunload', handleBeforeUnload);
};

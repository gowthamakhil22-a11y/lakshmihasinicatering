import { useCallback, useEffect, useRef, useState } from 'react';
import { appConfig } from '../config/appConfig.js';
import { fetchMenu, isDemoMode, readCachedMenu } from '../services/menuService.js';

/**
 * Menu state machine: loading → ready | error.
 * Shows a cached copy straight away (stale while revalidate).
 */
export function useMenu() {
  const cached = useRef(readCachedMenu()).current;
  const [state, setState] = useState(() =>
    cached
      ? { status: 'ready', menu: cached.menu, error: null, refreshing: true }
      : { status: 'loading', menu: null, error: null, refreshing: false },
  );
  const requestId = useRef(0);

  const load = useCallback(async ({ silent = false } = {}) => {
    const id = ++requestId.current;
    if (!silent) setState((s) => ({ ...s, status: s.menu ? 'ready' : 'loading', error: null, refreshing: true }));
    try {
      const menu = await fetchMenu();
      if (id !== requestId.current) return;
      setState({ status: 'ready', menu, error: null, refreshing: false });
    } catch (error) {
      if (id !== requestId.current) return;
      setState((s) =>
        s.menu
          ? { ...s, refreshing: false } // keep showing the cached menu
          : { status: 'error', menu: null, error: error?.message || 'Something went wrong.', refreshing: false },
      );
    }
  }, []);

  useEffect(() => {
    // Always revalidate on page load so menu edits in the sheet show up quickly.
    load({ silent: Boolean(cached) });
    if (isDemoMode() && import.meta.env.DEV) {
      console.info('[menu] No VITE_MENU_API_URL configured. Showing the bundled demo menu.');
    }
  }, [load, cached]);

  // Refresh when a visitor returns to a tab that has been open a while.
  useEffect(() => {
    let hiddenAt = 0;
    const onVisibility = () => {
      if (document.hidden) hiddenAt = Date.now();
      else if (hiddenAt && Date.now() - hiddenAt > appConfig.menuCacheMaxAgeMs) load({ silent: true });
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [load]);

  return { ...state, retry: () => load() };
}

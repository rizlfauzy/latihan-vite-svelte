import { createStore as createZustandStore, type StoreApi } from 'zustand/vanilla';
import { svelteApps, type AppItem } from '../data/apps';

const STORAGE_KEY = 'svelte_hub_apps';

function loadInitialApps(): AppItem[] {
  if (typeof window === 'undefined') return svelteApps;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.error('Failed to load apps from localStorage', err);
  }
  return svelteApps;
}

export interface AppStoreState {
  apps: AppItem[];
  addApp: (newApp: AppItem) => void;
  resetApps: () => void;
}

const rawStore: StoreApi<AppStoreState> = createZustandStore<AppStoreState>((set, get) => ({
  apps: loadInitialApps(),
  addApp: (newApp: AppItem) => {
    const updated = [newApp, ...get().apps];
    set({ apps: updated });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to persist apps to localStorage', err);
      }
    }
  },
  resetApps: () => {
    set({ apps: svelteApps });
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.error('Failed to clear apps in localStorage', err);
      }
    }
  },
}));

// Provide Svelte store contract `subscribe` and direct helper methods
export const appStore = {
  ...rawStore,
  addApp: (newApp: AppItem) => rawStore.getState().addApp(newApp),
  resetApps: () => rawStore.getState().resetApps(),
  subscribe(run: (state: AppStoreState) => void) {
    run(rawStore.getState());
    return rawStore.subscribe((state) => run(state));
  },
};

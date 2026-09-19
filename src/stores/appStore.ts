import { createStore as createZustandStore, type StoreApi } from 'zustand/vanilla';
import { svelteApps, type AppItem } from '../data/apps';
import { env } from '../lib/env';

export interface AppStoreState {
  apps: AppItem[];
  addApp: (newApp: AppItem) => Promise<void>;
  deleteApp: (id: string) => Promise<void>;
  resetApps: () => Promise<void>;
}

const rawStore: StoreApi<AppStoreState> = createZustandStore<AppStoreState>((set, get) => ({
  apps: [...svelteApps],

  addApp: async (newApp: AppItem) => {
    // Optimistically update Zustand store & UI
    const updated = [newApp, ...get().apps.filter((a) => a.id !== newApp.id)];
    set({ apps: updated });

    // Write directly to apps.ts via dev server API
    if (typeof window !== 'undefined' && env.enableDebug) {
      try {
        await fetch('/api/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newApp),
        });
      } catch (err) {
        console.error('[appStore] Failed to write new app to apps.ts via /api/apps', err);
      }
    }
  },

  deleteApp: async (id: string) => {
    // Optimistically update Zustand store & UI
    const updated = get().apps.filter((a) => a.id !== id);
    set({ apps: updated });

    // Delete directly from apps.ts via dev server API
    if (typeof window !== 'undefined' && env.enableDebug) {
      try {
        await fetch(`/api/apps/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('[appStore] Failed to delete app from apps.ts via /api/apps', err);
      }
    }
  },

  resetApps: async () => {
    set({ apps: [...svelteApps] });

    if (typeof window !== 'undefined') {
      try {
        await fetch('/api/apps/reset', { method: 'POST' });
      } catch (err) {
        console.error('[appStore] Failed to reset apps.ts', err);
      }
    }
  },
}));

// Provide Svelte store contract `subscribe` and direct helper methods
export const appStore = {
  ...rawStore,
  addApp: (newApp: AppItem) => rawStore.getState().addApp(newApp),
  deleteApp: (id: string) => rawStore.getState().deleteApp(id),
  resetApps: () => rawStore.getState().resetApps(),
  subscribe(run: (state: AppStoreState) => void) {
    run(rawStore.getState());
    return rawStore.subscribe((state) => run(state));
  },
};

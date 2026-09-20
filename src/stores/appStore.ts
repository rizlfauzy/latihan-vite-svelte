import { createStore as createZustandStore, type StoreApi } from 'zustand/vanilla';
import { svelteApps, type AppItem } from '@/data/apps';
import { env } from '@/lib/env';
import { alertStore } from '@/stores/alertStore';

export interface AppStoreState {
  apps: AppItem[];
  addApp: (newApp: AppItem) => Promise<boolean>;
  editApp: (updatedApp: AppItem) => Promise<boolean>;
  deleteApp: (id: string) => Promise<boolean>;
  resetApps: () => Promise<void>;
}

const rawStore: StoreApi<AppStoreState> = createZustandStore<AppStoreState>((set, get) => ({
  apps: [...svelteApps],

  addApp: async (newApp: AppItem) => {
    // Optimistically update Zustand store & UI
    const updated = [newApp, ...get().apps.filter((a) => a.id !== newApp.id)];
    set({ apps: updated });

    if (typeof window !== 'undefined' && env.enableDebug) {
      try {
        const res = await fetch('/api/apps', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newApp),
        });
        if (!res.ok) throw new Error('Server returned error status');
        alertStore.showSuccess(`Aplikasi "${newApp.name}" berhasil ditambahkan!`);
        return true;
      } catch (err) {
        console.error('[appStore] Failed to write new app to apps.ts via /api/apps', err);
        alertStore.showError(`Gagal menambahkan aplikasi "${newApp.name}"!`);
        return false;
      }
    } else {
      alertStore.showSuccess(`Aplikasi "${newApp.name}" berhasil ditambahkan!`);
      return true;
    }
  },

  editApp: async (updatedApp: AppItem) => {
    // Optimistically update Zustand store & UI
    const updated = get().apps.map((a) => (a.id === updatedApp.id ? { ...a, ...updatedApp } : a));
    set({ apps: updated });

    if (typeof window !== 'undefined' && env.enableDebug) {
      try {
        const res = await fetch(`/api/apps/${encodeURIComponent(updatedApp.id)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(updatedApp),
        });
        if (!res.ok) throw new Error('Server returned error status');
        alertStore.showSuccess(`Aplikasi "${updatedApp.name}" berhasil diperbarui!`);
        return true;
      } catch (err) {
        console.error('[appStore] Failed to update app in apps.ts via /api/apps', err);
        alertStore.showError(`Gagal memperbarui aplikasi "${updatedApp.name}"!`);
        return false;
      }
    } else {
      alertStore.showSuccess(`Aplikasi "${updatedApp.name}" berhasil diperbarui!`);
      return true;
    }
  },

  deleteApp: async (id: string) => {
    const target = get().apps.find((a) => a.id !== id);
    const targetApp = get().apps.find((a) => a.id === id);
    const targetName = targetApp?.name || 'Aplikasi';

    // Optimistically update Zustand store & UI
    const updated = get().apps.filter((a) => a.id !== id);
    set({ apps: updated });

    if (typeof window !== 'undefined' && env.enableDebug) {
      try {
        const res = await fetch(`/api/apps/${encodeURIComponent(id)}`, {
          method: 'DELETE',
        });
        if (!res.ok) throw new Error('Server returned error status');
        alertStore.showSuccess(`${targetName} berhasil dihapus!`);
        return true;
      } catch (err) {
        console.error('[appStore] Failed to delete app from apps.ts via /api/apps', err);
        alertStore.showError(`Gagal menghapus ${targetName}!`);
        return false;
      }
    } else {
      alertStore.showSuccess(`${targetName} berhasil dihapus!`);
      return true;
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
  editApp: (updatedApp: AppItem) => rawStore.getState().editApp(updatedApp),
  deleteApp: (id: string) => rawStore.getState().deleteApp(id),
  resetApps: () => rawStore.getState().resetApps(),
  subscribe(run: (state: AppStoreState) => void) {
    run(rawStore.getState());
    return rawStore.subscribe((state) => run(state));
  },
};

import { createStore as createZustandStore, type StoreApi } from 'zustand/vanilla';
import { svelteApps, type AppItem } from '@/data/apps';
import { env } from '@/lib/env';
import { alertStore } from '@/stores/alertStore';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';

export interface AppStoreState {
  apps: AppItem[];
  isLoading: boolean;
  addApp: (newApp: AppItem) => Promise<boolean>;
  editApp: (updatedApp: AppItem) => Promise<boolean>;
  deleteApp: (id: string) => Promise<boolean>;
  resetApps: () => Promise<void>;
  fetchApps: () => Promise<void>;
}

function mapRowToApp(row: any): AppItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    url: row.url,
    icon: row.icon || '⚡',
    category: row.category || 'General',
    color: row.color || 'var(--color-nb-yellow)',
    picName: row.pic_name || row.picName || 'Admin PIC',
    picWhatsapp: row.pic_whatsapp || row.picWhatsapp || '6281234567890',
  };
}

function mapAppToRow(app: AppItem) {
  return {
    id: app.id,
    name: app.name,
    description: app.description,
    url: app.url,
    icon: app.icon,
    category: app.category,
    color: app.color,
    pic_name: app.picName,
    pic_whatsapp: app.picWhatsapp,
  };
}

const rawStore: StoreApi<AppStoreState> = createZustandStore<AppStoreState>((set, get) => ({
  apps: [...svelteApps],
  isLoading: false,

  fetchApps: async () => {
    if (!isSupabaseEnabled || !supabase) return;
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('apps')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        const mapped = data.map(mapRowToApp);
        const currentApps = get().apps;
        const newLocal = currentApps.filter((ca) => !mapped.some((m) => m.id === ca.id));
        set({ apps: [...newLocal, ...mapped] });
      }
    } catch (err) {
      console.warn('[appStore] Failed to fetch from Supabase, using local apps', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addApp: async (newApp: AppItem) => {
    // Optimistically update Zustand store & UI
    const updated = [newApp, ...get().apps.filter((a) => a.id !== newApp.id)];
    set({ apps: updated, isLoading: false });

    let supabaseSuccess = true;
    if (isSupabaseEnabled && supabase) {
      try {
        const { error } = await supabase.from('apps').insert([mapAppToRow(newApp)]);
        if (error) throw error;
      } catch (err) {
        console.error('[appStore] Failed to insert app into Supabase', err);
        supabaseSuccess = false;
      }
    }

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
        if (!supabaseSuccess) {
          alertStore.showError(`Gagal menambahkan aplikasi "${newApp.name}"!`);
          return false;
        }
      }
    }

    alertStore.showSuccess(`Aplikasi "${newApp.name}" berhasil ditambahkan!`);
    return true;
  },

  editApp: async (updatedApp: AppItem) => {
    // Optimistically update Zustand store & UI
    const updated = get().apps.map((a) => (a.id === updatedApp.id ? { ...a, ...updatedApp } : a));
    set({ apps: updated });

    let supabaseSuccess = true;
    if (isSupabaseEnabled && supabase) {
      try {
        const { error } = await supabase
          .from('apps')
          .update(mapAppToRow(updatedApp))
          .eq('id', updatedApp.id);
        if (error) throw error;
      } catch (err) {
        console.error('[appStore] Failed to update app in Supabase', err);
        supabaseSuccess = false;
      }
    }

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
        if (!supabaseSuccess) {
          alertStore.showError(`Gagal memperbarui aplikasi "${updatedApp.name}"!`);
          return false;
        }
      }
    }

    alertStore.showSuccess(`Aplikasi "${updatedApp.name}" berhasil diperbarui!`);
    return true;
  },

  deleteApp: async (id: string) => {
    const targetApp = get().apps.find((a) => a.id === id);
    const targetName = targetApp?.name || 'Aplikasi';

    // Optimistically update Zustand store & UI
    const updated = get().apps.filter((a) => a.id !== id);
    set({ apps: updated });

    let supabaseSuccess = true;
    if (isSupabaseEnabled && supabase) {
      try {
        const { error } = await supabase.from('apps').delete().eq('id', id);
        if (error) throw error;
      } catch (err) {
        console.error('[appStore] Failed to delete app in Supabase', err);
        supabaseSuccess = false;
      }
    }

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
        if (!supabaseSuccess) {
          alertStore.showError(`Gagal menghapus ${targetName}!`);
          return false;
        }
      }
    }

    alertStore.showSuccess(`${targetName} berhasil dihapus!`);
    return true;
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

// If Supabase is configured and in browser, trigger initial fetch
if (typeof window !== 'undefined' && isSupabaseEnabled) {
  rawStore.getState().fetchApps();
}

// Provide Svelte store contract `subscribe` and direct helper methods
export const appStore = {
  ...rawStore,
  addApp: (newApp: AppItem) => rawStore.getState().addApp(newApp),
  editApp: (updatedApp: AppItem) => rawStore.getState().editApp(updatedApp),
  deleteApp: (id: string) => rawStore.getState().deleteApp(id),
  resetApps: () => rawStore.getState().resetApps(),
  fetchApps: () => rawStore.getState().fetchApps(),
  subscribe(run: (state: AppStoreState) => void) {
    run(rawStore.getState());
    return rawStore.subscribe((state) => run(state));
  },
};

if (typeof window !== 'undefined') {
  (window as any).__appStore = appStore;
}

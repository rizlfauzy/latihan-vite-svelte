import { createStore as createZustandStore, type StoreApi } from 'zustand/vanilla';
import { svelteApps, type AppItem } from '@/data/apps';
import { alertStore } from '@/stores/alertStore';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';

export type { AppItem };

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

// Default baseline applications for resetting Supabase state
const defaultBaselineApps: AppItem[] = [
  {
    id: 'portfolio',
    name: 'Personal Portfolio',
    description: 'Portofolio interaktif dan showcase karya berbasis Svelte.',
    url: 'https://github.com/rizlfauzy',
    icon: '💼',
    category: 'Portfolio',
    color: 'var(--color-nb-yellow)',
    picName: 'Rizal Fauzi',
    picWhatsapp: '6281234567890',
  },
  {
    id: 'todo-svelte',
    name: 'Todo & Task Master',
    description: 'Aplikasi manajemen tugas harian dengan reaktivitas Svelte 5.',
    url: 'https://svelte.dev',
    icon: '✅',
    category: 'Productivity',
    color: 'var(--color-nb-green)',
    picName: 'Rizal (Core Dev)',
    picWhatsapp: '6281234567890',
  },
  {
    id: 'weather-app',
    name: 'Weather Radar',
    description: 'Dashboard prakiraan cuaca real-time dengan visualisasi grafis.',
    url: 'https://vite.dev',
    icon: '🌤️',
    category: 'Utility',
    color: 'var(--color-nb-blue)',
    picName: 'Rizal (Maintainer)',
    picWhatsapp: '6281234567890',
  },
  {
    id: 'markdown-editor',
    name: 'Neo Note Editor',
    description: 'Markdown editor minimalis dengan live preview instan.',
    url: 'https://github.com',
    icon: '📝',
    category: 'Writing',
    color: 'var(--color-nb-pink)',
    picName: 'Rizal Fauzi',
    picWhatsapp: '6281234567890',
  },
  {
    id: 'finance-tracker',
    name: 'Pocket Budget',
    description: 'Pencatat keuangan harian dengan kalkulasi otomatis.',
    url: 'https://svelte.dev/docs/svelte/overview',
    icon: '💰',
    category: 'Finance',
    color: 'var(--color-nb-purple)',
    picName: 'Rizal (Finance Lead)',
    picWhatsapp: '6281234567890',
  },
  {
    id: 'code-snippets',
    name: 'Snippet Vault',
    description: 'Koleksi snippet kode favorit siap copy-paste.',
    url: 'https://vitejs.dev',
    icon: '⚡',
    category: 'DevTools',
    color: 'var(--color-nb-orange)',
    picName: 'Rizal Fauzi',
    picWhatsapp: '6281234567890',
  },
];

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
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (data) {
        set({ apps: data.map(mapRowToApp) });
      }
    } catch (err) {
      console.warn('[appStore] Failed to fetch apps from Supabase', err);
    } finally {
      set({ isLoading: false });
    }
  },

  addApp: async (newApp: AppItem) => {
    // Optimistically update Zustand store & UI
    const updated = [newApp, ...get().apps.filter((a) => a.id !== newApp.id)];
    set({ apps: updated, isLoading: false });

    if (isSupabaseEnabled && supabase) {
      try {
        const { error } = await supabase.from('apps').insert([mapAppToRow(newApp)]);
        if (error) throw error;
        alertStore.showSuccess(`Aplikasi "${newApp.name}" berhasil ditambahkan!`);
        return true;
      } catch (err) {
        console.error('[appStore] Failed to insert app into Supabase', err);
        alertStore.showError(`Gagal menambahkan aplikasi "${newApp.name}"!`);
        return false;
      }
    }

    alertStore.showSuccess(`Aplikasi "${newApp.name}" berhasil ditambahkan!`);
    return true;
  },

  editApp: async (updatedApp: AppItem) => {
    // Optimistically update Zustand store & UI
    const updated = get().apps.map((a) => (a.id === updatedApp.id ? { ...a, ...updatedApp } : a));
    set({ apps: updated });

    if (isSupabaseEnabled && supabase) {
      try {
        const { error } = await supabase
          .from('apps')
          .update(mapAppToRow(updatedApp))
          .eq('id', updatedApp.id);
        if (error) throw error;
        alertStore.showSuccess(`Aplikasi "${updatedApp.name}" berhasil diperbarui!`);
        return true;
      } catch (err) {
        console.error('[appStore] Failed to update app in Supabase', err);
        alertStore.showError(`Gagal memperbarui aplikasi "${updatedApp.name}"!`);
        return false;
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

    if (isSupabaseEnabled && supabase) {
      try {
        const { error } = await supabase.from('apps').delete().eq('id', id);
        if (error) throw error;
        alertStore.showSuccess(`${targetName} berhasil dihapus!`);
        return true;
      } catch (err) {
        console.error('[appStore] Failed to delete app from Supabase', err);
        alertStore.showError(`Gagal menghapus ${targetName}!`);
        return false;
      }
    }

    alertStore.showSuccess(`${targetName} berhasil dihapus!`);
    return true;
  },

  resetApps: async () => {
    if (isSupabaseEnabled && supabase) {
      try {
        // Clear apps and re-seed baseline apps in Supabase
        await supabase.from('apps').delete().neq('id', '');
        const rows = defaultBaselineApps.map(mapAppToRow);
        await supabase.from('apps').insert(rows);
      } catch (err) {
        console.error('[appStore] Failed to reset Supabase apps', err);
      }
    }
    await get().fetchApps();
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

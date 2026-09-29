import { createStore as createZustandStore, type StoreApi } from 'zustand/vanilla';
import { svelteApps, type AppItem } from '@/data/apps';
import { alertStore } from '@/stores/alertStore';
import { todoStore } from '@/stores/todoStore';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { i18nStore } from '@/stores/i18nStore';
import { authStore } from '@/stores/authStore';
import { env } from '@/lib/env';

export type { AppItem };

const { t } = i18nStore;

export function extractAppStoragePath(imageUrl: string, bucketName: string = 'app-images'): string | null {
  if (!imageUrl) return null;
  const marker = `/${bucketName}/`;
  const index = imageUrl.indexOf(marker);
  if (index !== -1) {
    return decodeURIComponent(imageUrl.substring(index + marker.length).split('?')[0]);
  }
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  return null;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export interface AppStoreState {
  apps: AppItem[];
  isLoading: boolean;
  addApp: (newApp: AppItem) => Promise<boolean>;
  editApp: (updatedApp: AppItem) => Promise<boolean>;
  deleteApp: (id: string) => Promise<boolean>;
  deleteApps: (ids: string[]) => Promise<boolean>;
  resetApps: () => Promise<void>;
  fetchApps: () => Promise<void>;
  uploadAppImage: (file: File) => Promise<string>;
  deleteAppImage: (imageUrl: string) => Promise<void>;
}

function mapRowToApp(row: any): AppItem {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    url: row.url,
    icon: row.icon || 'app-window',
    category: row.category || 'General',
    color: row.color || 'var(--color-nb-yellow)',
    picName: row.pic_name || row.picName || 'Admin PIC',
    picWhatsapp: row.pic_whatsapp || row.picWhatsapp || '6281234567890',
    imageUrl: row.image_url || row.imageUrl || null,
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
    image_url: app.imageUrl || null,
  };
}

// Default baseline applications for resetting Supabase state
const defaultBaselineApps: AppItem[] = [];

const rawStore: StoreApi<AppStoreState> = createZustandStore<AppStoreState>((set, get) => ({
  apps: [...svelteApps],
  isLoading: isSupabaseEnabled,

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

  uploadAppImage: async (file: File): Promise<string> => {
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'svg'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      throw new Error(t('imageModal.errFormat', 'Ekstensi file tidak didukung! Hanya .jpg, .jpeg, .png, dan .svg yang diperbolehkan.'));
    }

    const maxMb = env.maxImageSizeMb || 5;
    const MAX_SIZE = maxMb * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error(t('imageModal.errSize', `Ukuran file melebihi batas maksimal ${maxMb} MB!`));
    }

    if (isSupabaseEnabled && supabase) {
      try {
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const filePath = `apps/${fileName}`;
        const { error } = await supabase.storage
          .from('app-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (error) {
          console.warn('[appStore] Storage upload failed, fallback to Data URL', error);
          return await fileToDataUrl(file);
        }

        const { data: urlData } = supabase.storage
          .from('app-images')
          .getPublicUrl(filePath);

        return urlData.publicUrl;
      } catch (err) {
        console.warn('[appStore] Storage upload exception, fallback to Data URL', err);
        return await fileToDataUrl(file);
      }
    }

    return await fileToDataUrl(file);
  },

  deleteAppImage: async (imageUrl: string) => {
    if (!imageUrl || !isSupabaseEnabled || !supabase) return;
    const path = extractAppStoragePath(imageUrl, 'app-images');
    if (path) {
      try {
        await supabase.storage.from('app-images').remove([path]);
      } catch (err) {
        console.warn('[appStore] Failed to delete image from app-images storage', err);
      }
    }
  },

  addApp: async (newApp: AppItem) => {
    if (!authStore.getState().hasDebugAccess) {
      alertStore.showError(t('auth.unauthorizedApps') || 'Akses ditolak: Hanya role dengan izin debug yang dapat menambah aplikasi!');
      return false;
    }

    // Optimistically update Zustand store & UI
    const updated = [newApp, ...get().apps.filter((a) => a.id !== newApp.id)];
    set({ apps: updated, isLoading: false });

    if (isSupabaseEnabled && supabase) {
      try {
        const { error } = await supabase.from('apps').insert([mapAppToRow(newApp)]);
        if (error) throw error;
        alertStore.showSuccess(`${t('todo.app')} "${newApp.name}" ${t('add.success')}!`);
        return true;
      } catch (err) {
        console.error('[appStore] Failed to insert app into Supabase', err);
        alertStore.showError(`${t('todo.app')} "${newApp.name}" ${t('add.failed')}!`);
        return false;
      }
    }

    alertStore.showSuccess(`${t('todo.app')} "${newApp.name}" ${t('add.success')}!`);
    return true;
  },

  editApp: async (updatedApp: AppItem) => {
    if (!authStore.getState().hasDebugAccess) {
      alertStore.showError(t('auth.unauthorizedApps') || 'Akses ditolak: Hanya role dengan izin debug yang dapat mengubah aplikasi!');
      return false;
    }

    const currentApp = get().apps.find((a) => a.id === updatedApp.id);
    if (currentApp?.imageUrl && currentApp.imageUrl !== updatedApp.imageUrl) {
      // Hapus gambar lama dari storage jika diganti atau dihapus
      await get().deleteAppImage(currentApp.imageUrl);
    }

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
        alertStore.showSuccess(`${t('todo.app')} "${updatedApp.name}" ${t('edit.success')}!`);
        return true;
      } catch (err) {
        console.error('[appStore] Failed to update app in Supabase', err);
        alertStore.showError(`${t('todo.app')} "${updatedApp.name}" ${t('edit.failed')}!`);
        return false;
      }
    }

    alertStore.showSuccess(`${t('todo.app')} "${updatedApp.name}" ${t('edit.success')}!`);
    return true;
  },

  deleteApp: async (id: string) => {
    if (!authStore.getState().hasDebugAccess) {
      alertStore.showError(t('auth.unauthorizedApps') || 'Akses ditolak: Hanya role dengan izin debug yang dapat menghapus aplikasi!');
      return false;
    }

    const targetApp = get().apps.find((a) => a.id === id);
    const targetName = targetApp?.name || t('todo.app');

    // Optimistically update Zustand store & UI
    const updated = get().apps.filter((a) => a.id !== id);
    set({ apps: updated });

    // Cascading deletion: remove associated image from storage
    if (targetApp?.imageUrl) {
      await get().deleteAppImage(targetApp.imageUrl);
    }

    // Cascading deletion: automatically delete all associated todos
    try {
      await todoStore.deleteTodosByAppId(id);
    } catch (err) {
      console.error('[appStore] Failed cascading deletion of related todos', err);
    }

    if (isSupabaseEnabled && supabase) {
      try {
        const { error } = await supabase.from('apps').delete().eq('id', id);
        if (error) throw error;
        alertStore.showSuccess(`${t('todo.app')} "${targetName}" ${t('delete.success')}!`);
        return true;
      } catch (err) {
        console.error('[appStore] Failed to delete app from Supabase', err);
        alertStore.showError(`${t('todo.app')} "${targetName}" ${t('delete.failed')}!`);
        return false;
      }
    }

    alertStore.showSuccess(`${t('todo.app')} "${targetName}" ${t('delete.success')}!`);
    return true;
  },

  deleteApps: async (ids: string[]) => {
    if (!authStore.getState().hasDebugAccess) {
      alertStore.showError(t('auth.unauthorizedApps') || 'Akses ditolak: Hanya role dengan izin debug yang dapat menghapus aplikasi!');
      return false;
    }

    if (ids.length === 0) return true;
    const idSet = new Set(ids);
    const count = ids.length;

    const targets = get().apps.filter((a) => idSet.has(a.id));

    // Optimistically update Zustand store & UI
    const updated = get().apps.filter((a) => !idSet.has(a.id));
    set({ apps: updated });

    // Cascading deletion: remove associated images from storage
    for (const app of targets) {
      if (app.imageUrl) {
        await get().deleteAppImage(app.imageUrl);
      }
    }

    // Cascading deletion: automatically delete all associated todos
    try {
      await todoStore.deleteTodosByAppIds(ids);
    } catch (err) {
      console.error('[appStore] Failed cascading deletion of related todos in deleteApps', err);
    }

    if (isSupabaseEnabled && supabase) {
      try {
        const { error } = await supabase.from('apps').delete().in('id', ids);
        if (error) throw error;
        alertStore.showSuccess(`${count} ${t('todo.apps')} ${t('delete.success')}!`);
        return true;
      } catch (err) {
        console.error('[appStore] Failed to bulk delete apps from Supabase', err);
        alertStore.showError(`${count} ${t('todo.apps')} ${t('delete.failed')}!`);
        return false;
      }
    }

    alertStore.showSuccess(`${count} ${t('todo.apps')} ${t('delete.success')}!`);
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
  deleteApps: (ids: string[]) => rawStore.getState().deleteApps(ids),
  resetApps: () => rawStore.getState().resetApps(),
  fetchApps: () => rawStore.getState().fetchApps(),
  uploadAppImage: (file: File) => rawStore.getState().uploadAppImage(file),
  deleteAppImage: (imageUrl: string) => rawStore.getState().deleteAppImage(imageUrl),
  subscribe(run: (state: AppStoreState) => void) {
    run(rawStore.getState());
    return rawStore.subscribe((state) => run(state));
  },
};

if (typeof window !== 'undefined') {
  (window as any).__appStore = appStore;
}

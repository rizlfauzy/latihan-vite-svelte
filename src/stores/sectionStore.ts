import { createStore as createZustandStore, type StoreApi } from 'zustand/vanilla';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { alertStore } from '@/stores/alertStore';
import { authStore } from '@/stores/authStore';
import { i18nStore } from '@/stores/i18nStore';

export interface SectionItem {
  id: string;
  page: 'home' | 'company-profile';
  sectionKey: string;
  title: string;
  orderIndex: number;
  visible: boolean;
}

const LOCAL_STORAGE_KEY = 'svelte_hub_section_settings';

export const defaultSections: SectionItem[] = [
  // Home Page
  { id: 'sec-home-1', page: 'home', sectionKey: 'hero', title: 'Hero Banner', orderIndex: 0, visible: true },
  { id: 'sec-home-2', page: 'home', sectionKey: 'apps-hub', title: 'Apps Hub', orderIndex: 1, visible: true },
  { id: 'sec-home-3', page: 'home', sectionKey: 'todo-list', title: 'To-Do List', orderIndex: 2, visible: true },

  // Company Profile Page
  { id: 'sec-cp-1', page: 'company-profile', sectionKey: 'profile', title: 'Header & Hero Profile', orderIndex: 0, visible: true },
  { id: 'sec-cp-2', page: 'company-profile', sectionKey: 'highlights', title: 'Company Highlights', orderIndex: 1, visible: true },
  { id: 'sec-cp-3', page: 'company-profile', sectionKey: 'vision-mission', title: 'Visi & Misi', orderIndex: 2, visible: true },
  { id: 'sec-cp-4', page: 'company-profile', sectionKey: 'services', title: 'Layanan & Servis', orderIndex: 3, visible: true },
  { id: 'sec-cp-5', page: 'company-profile', sectionKey: 'contact', title: 'PIC & Leadership', orderIndex: 4, visible: true },
];

function loadLocalSections(): SectionItem[] {
  if (typeof window === 'undefined') return [...defaultSections];
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('[sectionStore] Failed to load local section settings', err);
  }
  return [...defaultSections];
}

function saveLocalSections(sections: SectionItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sections));
  } catch (err) {
    console.warn('[sectionStore] Failed to save local section settings', err);
  }
}

function mapRowToSection(row: any): SectionItem {
  return {
    id: row.id,
    page: row.page,
    sectionKey: row.section_key,
    title: row.title,
    orderIndex: Number(row.order_index) ?? 0,
    visible: row.visible ?? true,
  };
}

export interface SectionStoreState {
  sections: SectionItem[];
  isLoading: boolean;
  fetchSections: () => Promise<void>;
  moveSection: (page: string, sectionKey: string, direction: 'up' | 'down') => Promise<boolean>;
  toggleVisibility: (page: string, sectionKey: string) => Promise<boolean>;
  reorderSections: (page: string, newOrderedKeys: string[]) => Promise<boolean>;
  resetSections: (page: string) => Promise<boolean>;
  getSectionsForPage: (page: string) => SectionItem[];
}

const rawStore: StoreApi<SectionStoreState> = createZustandStore<SectionStoreState>((set, get) => ({
  sections: loadLocalSections(),
  isLoading: isSupabaseEnabled,

  fetchSections: async () => {
    if (!isSupabaseEnabled || !supabase) return;
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('section_settings')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        const fetched = data.map(mapRowToSection);
        set({ sections: fetched });
        saveLocalSections(fetched);
      }
    } catch (err) {
      console.warn('[sectionStore] Failed to fetch section settings from Supabase', err);
    } finally {
      set({ isLoading: false });
    }
  },

  getSectionsForPage: (page: string) => {
    return get()
      .sections.filter((s) => s.page === page)
      .sort((a, b) => a.orderIndex - b.orderIndex);
  },

  moveSection: async (page: string, sectionKey: string, direction: 'up' | 'down') => {
    if (!authStore.getState().hasDebugAccess) {
      alertStore.showError(i18nStore.t('section.unauthorized', 'Akses ditolak: Hanya role dengan izin debug yang dapat mengubah tata letak!'));
      return false;
    }

    const currentList = get()
      .sections.filter((s) => s.page === page)
      .sort((a, b) => a.orderIndex - b.orderIndex);

    const index = currentList.findIndex((s) => s.sectionKey === sectionKey);
    if (index === -1) return false;

    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return false;

    // Swap positions
    const temp = currentList[index];
    currentList[index] = currentList[targetIndex];
    currentList[targetIndex] = temp;

    // Update orderIndex
    const updatedPageSections = currentList.map((item, idx) => ({
      ...item,
      orderIndex: idx,
    }));

    const otherSections = get().sections.filter((s) => s.page !== page);
    const newAllSections = [...otherSections, ...updatedPageSections];

    set({ sections: newAllSections });
    saveLocalSections(newAllSections);

    if (isSupabaseEnabled && supabase) {
      try {
        for (const item of updatedPageSections) {
          await supabase
            .from('section_settings')
            .update({ order_index: item.orderIndex, updated_at: new Date().toISOString() })
            .match({ page: item.page, section_key: item.sectionKey });
        }
      } catch (err) {
        console.error('[sectionStore] Failed to sync reorder to Supabase', err);
      }
    }

    alertStore.showSuccess(i18nStore.t('section.reorderSuccess', 'Tata letak bagian berhasil diperbarui!'));
    return true;
  },

  toggleVisibility: async (page: string, sectionKey: string) => {
    if (!authStore.getState().hasDebugAccess) {
      alertStore.showError(i18nStore.t('section.unauthorized', 'Akses ditolak: Hanya role dengan izin debug yang dapat mengubah tata letak!'));
      return false;
    }

    const target = get().sections.find((s) => s.page === page && s.sectionKey === sectionKey);
    if (!target) return false;

    const newVisibility = !target.visible;
    const newAllSections = get().sections.map((s) =>
      s.page === page && s.sectionKey === sectionKey ? { ...s, visible: newVisibility } : s
    );

    set({ sections: newAllSections });
    saveLocalSections(newAllSections);

    if (isSupabaseEnabled && supabase) {
      try {
        await supabase
          .from('section_settings')
          .update({ visible: newVisibility, updated_at: new Date().toISOString() })
          .match({ page, section_key: sectionKey });
      } catch (err) {
        console.error('[sectionStore] Failed to sync visibility to Supabase', err);
      }
    }

    const localizedTitle = i18nStore.t(`section.${target.sectionKey}`, target.title);
    alertStore.showSuccess(
      i18nStore.t('section.visibilitySuccess', 'Status visibilitas bagian "{title}" berhasil diubah!').replace('{title}', localizedTitle)
    );
    return true;
  },

  reorderSections: async (page: string, newOrderedKeys: string[]) => {
    if (!authStore.getState().hasDebugAccess) {
      alertStore.showError(i18nStore.t('section.unauthorized', 'Akses ditolak: Hanya role dengan izin debug yang dapat mengubah tata letak!'));
      return false;
    }

    const pageSections = get().sections.filter((s) => s.page === page);
    const updatedPageSections: SectionItem[] = [];

    newOrderedKeys.forEach((key, idx) => {
      const match = pageSections.find((s) => s.sectionKey === key);
      if (match) {
        updatedPageSections.push({ ...match, orderIndex: idx });
      }
    });

    const otherSections = get().sections.filter((s) => s.page !== page);
    const newAllSections = [...otherSections, ...updatedPageSections];

    set({ sections: newAllSections });
    saveLocalSections(newAllSections);

    if (isSupabaseEnabled && supabase) {
      try {
        for (const item of updatedPageSections) {
          await supabase
            .from('section_settings')
            .update({ order_index: item.orderIndex, updated_at: new Date().toISOString() })
            .match({ page: item.page, section_key: item.sectionKey });
        }
      } catch (err) {
        console.error('[sectionStore] Failed to sync reorder to Supabase', err);
      }
    }

    alertStore.showSuccess(i18nStore.t('section.reorderSuccess', 'Urutan bagian berhasil disimpan!'));
    return true;
  },

  resetSections: async (page: string) => {
    if (!authStore.getState().hasDebugAccess) {
      alertStore.showError(i18nStore.t('section.unauthorized', 'Akses ditolak: Hanya role dengan izin debug yang dapat mereset tata letak!'));
      return false;
    }

    const defaultsForPage = defaultSections.filter((s) => s.page === page);
    const otherSections = get().sections.filter((s) => s.page !== page);
    const newAllSections = [...otherSections, ...defaultsForPage];

    set({ sections: newAllSections });
    saveLocalSections(newAllSections);

    if (isSupabaseEnabled && supabase) {
      try {
        for (const item of defaultsForPage) {
          await supabase
            .from('section_settings')
            .update({ order_index: item.orderIndex, visible: item.visible, updated_at: new Date().toISOString() })
            .match({ page: item.page, section_key: item.sectionKey });
        }
      } catch (err) {
        console.error('[sectionStore] Failed to reset section settings in Supabase', err);
      }
    }

    alertStore.showSuccess(i18nStore.t('section.resetSuccess', 'Tata letak berhasil direset ke awal!'));
    return true;
  },
}));

if (typeof window !== 'undefined' && isSupabaseEnabled) {
  rawStore.getState().fetchSections();
}

export const sectionStore = {
  ...rawStore,
  fetchSections: () => rawStore.getState().fetchSections(),
  moveSection: (page: string, sectionKey: string, direction: 'up' | 'down') =>
    rawStore.getState().moveSection(page, sectionKey, direction),
  toggleVisibility: (page: string, sectionKey: string) =>
    rawStore.getState().toggleVisibility(page, sectionKey),
  reorderSections: (page: string, newOrderedKeys: string[]) =>
    rawStore.getState().reorderSections(page, newOrderedKeys),
  resetSections: (page: string) => rawStore.getState().resetSections(page),
  getSectionsForPage: (page: string) => rawStore.getState().getSectionsForPage(page),
  subscribe(run: (state: SectionStoreState) => void) {
    run(rawStore.getState());
    return rawStore.subscribe((state) => run(state));
  },
};

if (typeof window !== 'undefined') {
  (window as any).__sectionStore = sectionStore;
}

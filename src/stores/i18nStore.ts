import { createStore as createZustandStore, type StoreApi } from 'zustand/vanilla';

export type Locale = 'id' | 'en';

export interface Translations {
  [key: string]: string;
}

const dictionaries: Record<Locale, Translations> = {
  id: {
    // Navbar
    'nav.brand': 'SVELTE HUB',
    'nav.debug': 'DEBUG ON',
    'nav.home': '🚀 APPS & DASHBOARD',
    'nav.company': '🏢 COMPANY PROFILE',
    'nav.github': 'GITHUB ↗',
    'nav.menu': '☰ MENU',
    'nav.close': '✕ TUTUP',

    // Hero
    'hero.subtitle': 'Central Dashboard untuk Akses Cepat Semua Aplikasi Svelte',
    'hero.badgeSvelte': '⚡ SVELTE 5',
    'hero.badgeVite': '🚀 VITE',
    'hero.badgeDocker': '🐳 DOCKER READY',

    // App Grid
    'grid.title': 'HUB APLIKASI SVELTE',
    'grid.addApp': 'TAMBAH APLIKASI',
    'grid.connected': 'APPS TERHUBUNG',
    'grid.openApp': 'BUKA APLIKASI',
    'grid.contactPic': 'HUBUNGI PIC (WHATSAPP)',
    'grid.pic': '👤 PIC:',
    'grid.deleteTooltip': 'Hapus Aplikasi (Debug Mode)',
    'grid.editTooltip': 'Edit Aplikasi (Debug Mode)',

    // Common Modal & Actions
    'action.cancel': 'BATAL',
    'action.save': '💾 SIMPAN PERUBAHAN',
    'action.add': '🚀 TAMBAHKAN APLIKASI',
    'action.delete': 'YA, HAPUS',
    'action.deleteApp': 'YA, HAPUS APLIKASI',

    // Footer
    'footer.title': '⚡ SVELTE HUB — Personal Dashboard',
    'footer.subtitle': 'Dibangun dengan Svelte 5, Vite, Tailwind CSS, Zustand, & estetika Neo Brutalism',
    'footer.github': 'GITHUB REPO ↗',
  },
  en: {
    // Navbar
    'nav.brand': 'SVELTE HUB',
    'nav.debug': 'DEBUG ON',
    'nav.home': '🚀 APPS & DASHBOARD',
    'nav.company': '🏢 COMPANY PROFILE',
    'nav.github': 'GITHUB ↗',
    'nav.menu': '☰ MENU',
    'nav.close': '✕ CLOSE',

    // Hero
    'hero.subtitle': 'Central Dashboard for Rapid Access to All Svelte Micro Apps',
    'hero.badgeSvelte': '⚡ SVELTE 5',
    'hero.badgeVite': '🚀 VITE',
    'hero.badgeDocker': '🐳 DOCKER READY',

    // App Grid
    'grid.title': 'SVELTE APPS HUB',
    'grid.addApp': 'ADD APPLICATION',
    'grid.connected': 'CONNECTED APPS',
    'grid.openApp': 'OPEN APPLICATION',
    'grid.contactPic': 'CONTACT PIC (WHATSAPP)',
    'grid.pic': '👤 PIC:',
    'grid.deleteTooltip': 'Delete Application (Debug Mode)',
    'grid.editTooltip': 'Edit Application (Debug Mode)',

    // Common Modal & Actions
    'action.cancel': 'CANCEL',
    'action.save': '💾 SAVE CHANGES',
    'action.add': '🚀 ADD APPLICATION',
    'action.delete': 'YES, DELETE',
    'action.deleteApp': 'YES, DELETE APP',

    // Footer
    'footer.title': '⚡ SVELTE HUB — Personal Dashboard',
    'footer.subtitle': 'Built with Svelte 5, Vite, Tailwind CSS, Zustand, & Neo Brutalism aesthetic',
    'footer.github': 'GITHUB REPO ↗',
  },
};

const STORAGE_KEY = 'svelte_hub_locale';

function getInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'id';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved === 'id' || saved === 'en') return saved;
  } catch (err) {
    console.error('Failed to read locale from localStorage', err);
  }
  return 'id';
}

export interface I18nStoreState {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  toggleLocale: () => void;
  t: (key: string) => string;
}

const rawI18nStore: StoreApi<I18nStoreState> = createZustandStore<I18nStoreState>((set, get) => ({
  locale: getInitialLocale(),

  setLocale: (newLocale: Locale) => {
    set({ locale: newLocale });
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, newLocale);
      } catch (err) {
        console.error('Failed to save locale to localStorage', err);
      }
    }
  },

  toggleLocale: () => {
    const nextLocale = get().locale === 'id' ? 'en' : 'id';
    get().setLocale(nextLocale);
  },

  t: (key: string): string => {
    const current = get().locale;
    const dict = dictionaries[current] || dictionaries.id;
    return dict[key] || dictionaries.id[key] || key;
  },
}));

// Provide Svelte store contract `subscribe` and direct helper methods
export const i18nStore = {
  ...rawI18nStore,
  setLocale: (locale: Locale) => rawI18nStore.getState().setLocale(locale),
  toggleLocale: () => rawI18nStore.getState().toggleLocale(),
  t: (key: string) => rawI18nStore.getState().t(key),
  subscribe(run: (state: I18nStoreState) => void) {
    run(rawI18nStore.getState());
    return rawI18nStore.subscribe((state) => run(state));
  },
};

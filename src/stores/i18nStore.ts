import { createStore as createZustandStore, type StoreApi } from 'zustand/vanilla';
import idLocale from '../i18n/id.json';
import enLocale from '../i18n/en.json';

export type Locale = 'id' | 'en';

export type Translations = Record<string, string>;

const dictionaries: Record<Locale, Translations> = {
  id: idLocale,
  en: enLocale,
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

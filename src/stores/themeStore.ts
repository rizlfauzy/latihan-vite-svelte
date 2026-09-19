import { createStore as createZustandStore, type StoreApi } from 'zustand/vanilla';

export type Theme = 'light' | 'dark';

const STORAGE_KEY = 'svelte_hub_theme';

function getInitialTheme(): Theme {
  if (typeof window === 'undefined') return 'light';
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as Theme | null;
    if (saved === 'light' || saved === 'dark') return saved;
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch (err) {
    console.error('Failed to read theme from localStorage', err);
  }
  return 'light';
}

function applyThemeToDOM(theme: Theme) {
  if (typeof document !== 'undefined') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }
}

export interface ThemeStoreState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const rawThemeStore: StoreApi<ThemeStoreState> = createZustandStore<ThemeStoreState>((set, get) => {
  const initial = getInitialTheme();
  applyThemeToDOM(initial);

  return {
    theme: initial,

    setTheme: (newTheme: Theme) => {
      set({ theme: newTheme });
      applyThemeToDOM(newTheme);
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, newTheme);
        } catch (err) {
          console.error('Failed to save theme to localStorage', err);
        }
      }
    },

    toggleTheme: () => {
      const next = get().theme === 'dark' ? 'light' : 'dark';
      get().setTheme(next);
    },
  };
});

export const themeStore = {
  ...rawThemeStore,
  setTheme: (theme: Theme) => rawThemeStore.getState().setTheme(theme),
  toggleTheme: () => rawThemeStore.getState().toggleTheme(),
  subscribe(run: (state: ThemeStoreState) => void) {
    run(rawThemeStore.getState());
    return rawThemeStore.subscribe((state) => run(state));
  },
};

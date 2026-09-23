import { createStore as createZustandStore, type StoreApi } from 'zustand/vanilla';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { alertStore } from '@/stores/alertStore';

export interface Role {
  id: number | string;
  name: string;
  is_debug: boolean;
}

export interface User {
  uuid: string;
  username: string;
  name: string;
  roleId?: number | string;
  role?: Role;
}

export interface AuthStoreState {
  user: User | null;
  role: Role | null;
  isAuthenticated: boolean;
  hasDebugAccess: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setUserSession: (user: User, role: Role) => void;
}

const AUTH_STORAGE_KEY = 'hub_auth_user';

function loadStoredSession(): { user: User | null; role: Role | null } {
  if (typeof window === 'undefined') return { user: null, role: null };
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.user) {
        return {
          user: parsed.user,
          role: parsed.role || parsed.user.role || null,
        };
      }
    }
  } catch (e) {
    console.error('[authStore] Failed to parse auth session from localStorage', e);
  }
  return { user: null, role: null };
}

function saveStoredSession(user: User | null, role: Role | null) {
  if (typeof window === 'undefined') return;
  try {
    if (user) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ user, role }));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
    }
  } catch (e) {
    console.error('[authStore] Failed to save auth session to localStorage', e);
  }
}

const initialSession = loadStoredSession();

const rawAuthStore: StoreApi<AuthStoreState> = createZustandStore<AuthStoreState>((set, get) => ({
  user: initialSession.user,
  role: initialSession.role,
  isAuthenticated: Boolean(initialSession.user),
  hasDebugAccess: Boolean(initialSession.role?.is_debug),
  isLoading: false,

  setUserSession: (user: User, role: Role) => {
    set({
      user,
      role,
      isAuthenticated: true,
      hasDebugAccess: Boolean(role?.is_debug),
      isLoading: false,
    });
    saveStoredSession(user, role);
  },

  login: async (username: string, password: string) => {
    const cleanUsername = username.trim();
    if (!cleanUsername || !password) {
      return { success: false, message: 'Username dan password wajib diisi!' };
    }

    set({ isLoading: true });

    // 1. Coba Autentikasi via Supabase RPC jika Supabase aktif
    if (isSupabaseEnabled && supabase) {
      try {
        const { data, error } = await supabase.rpc('authenticate_user', {
          p_username: cleanUsername,
          p_password: password,
        });

        if (error) {
          console.warn('[authStore] RPC authenticate_user failed, falling back to direct check', error);
        } else if (Array.isArray(data) && data.length > 0) {
          const row = data[0];
          const role: Role = {
            id: row.role_id,
            name: row.role_name,
            is_debug: Boolean(row.is_debug),
          };
          const user: User = {
            uuid: row.uuid,
            username: row.username,
            name: row.name,
            roleId: row.role_id,
            role,
          };

          get().setUserSession(user, role);
          alertStore.showSuccess(`Selamat datang kembali, ${user.name}!`);
          return { success: true };
        } else {
          set({ isLoading: false });
          alertStore.showError('Username atau password salah!');
          return { success: false, message: 'Username atau password salah!' };
        }
      } catch (err) {
        console.warn('[authStore] Supabase auth error, checking fallback', err);
      }
    }

    // 2. Fallback Default Credentials (untuk Local / Offline / E2E Testing mode)
    // if (cleanUsername === 'rizlfauzy' && password === 'admin123') {
    //   const defaultRole: Role = {
    //     id: 1,
    //     name: 'SUPERADMIN',
    //     is_debug: true,
    //   };
    //   const defaultUser: User = {
    //     uuid: 'a0000000-0000-0000-0000-000000000001',
    //     username: 'rizlfauzy',
    //     name: 'Rizal Fauzi',
    //     roleId: 1,
    //     role: defaultRole,
    //   };

    //   get().setUserSession(defaultUser, defaultRole);
    //   alertStore.showSuccess(`Selamat datang kembali, ${defaultUser.name}!`);
    //   return { success: true };
    // }

    set({ isLoading: false });
    alertStore.showError('Username atau password salah!');
    return { success: false, message: 'Username atau password salah!' };
  },

  logout: () => {
    set({
      user: null,
      role: null,
      isAuthenticated: false,
      hasDebugAccess: false,
      isLoading: false,
    });
    saveStoredSession(null, null);
    alertStore.showInfo('Anda telah berhasil keluar.');
  },
}));

export const authStore = {
  ...rawAuthStore,
  login: (username: string, password: string) => rawAuthStore.getState().login(username, password),
  logout: () => rawAuthStore.getState().logout(),
  setUserSession: (user: User, role: Role) => rawAuthStore.getState().setUserSession(user, role),
  subscribe(run: (state: AuthStoreState) => void) {
    run(rawAuthStore.getState());
    return rawAuthStore.subscribe((state) => run(state));
  },
};

if (typeof window !== 'undefined') {
  (window as any).__authStore = authStore;
}

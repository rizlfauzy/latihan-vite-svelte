import { createStore as createZustandStore, type StoreApi } from 'zustand/vanilla';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { alertStore } from '@/stores/alertStore';
import { i18nStore } from '@/stores/i18nStore';

const { t } = i18nStore;

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
  register: (name: string, username: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  setUserSession: (user: User, role: Role) => void;
}

const AUTH_STORAGE_KEY = 'hub_auth_user';
const REGISTERED_USERS_KEY = 'hub_registered_users';

function saveLocalRegisteredUser(user: User, password: string) {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY) || '[]';
    const list = JSON.parse(raw);
    const filtered = Array.isArray(list) ? list.filter((u: any) => u.username !== user.username) : [];
    // filtered.push({ ...user, password });
    localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(filtered));
  } catch {}
}

function findLocalRegisteredUser(username: string, password: string): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(REGISTERED_USERS_KEY) || '[]';
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return null;
    const found = list.find((u: any) => u.username.toLowerCase() === username.toLowerCase() && u.password === password);
    return found || null;
  } catch {
    return null;
  }
}

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

  register: async (name: string, username: string, password: string) => {
    const cleanName = name.trim();
    const cleanUsername = username.trim();

    if (!cleanName || !cleanUsername || !password) {
      const msg = i18nStore.t('register.errorEmpty', 'Nama, username, dan password wajib diisi!');
      alertStore.showWarning(msg);
      return { success: false, message: msg };
    }

    if (password.length < 6) {
      const msg = i18nStore.t('register.errorPasswordLength', 'Password minimal 6 karakter!');
      alertStore.showWarning(msg);
      return { success: false, message: msg };
    }

    set({ isLoading: true });

    // 1. Coba Registrasi via Supabase RPC jika Supabase aktif
    if (isSupabaseEnabled && supabase) {
      try {
        const { data, error } = await supabase.rpc('register_user', {
          p_name: cleanName,
          p_username: cleanUsername,
          p_password: password,
        });

        if (error) {
          console.warn('[authStore] Supabase register_user error', error);
          if (error.message && (error.message.includes('sudah digunakan') || error.message.includes('already exists'))) {
            set({ isLoading: false });
            alertStore.showError(error.message);
            return { success: false, message: error.message };
          }
        } else if (Array.isArray(data) && data.length > 0) {
          const row = data[0];
          const viewerRole: Role = {
            id: row.role_id,
            name: row.role_name || 'VIEWER',
            is_debug: false,
          };
          const newUser: User = {
            uuid: row.uuid,
            username: row.username,
            name: row.name,
            roleId: row.role_id,
            role: viewerRole,
          };

          saveLocalRegisteredUser(newUser, password);
          get().setUserSession(newUser, viewerRole);
          const welcomeMsg = i18nStore
            .t('register.success', `Pendaftaran berhasil! Selamat datang, ${newUser.name}!`)
            .replace('{name}', newUser.name);
          alertStore.showSuccess(welcomeMsg);
          return { success: true };
        }
      } catch (err) {
        console.warn('[authStore] Exception during Supabase register', err);
      }
    }

    // 2. Fallback Default Registration (Otomatis role: VIEWER, is_debug: false)
    const fallbackRole: Role = {
      id: 2,
      name: 'VIEWER',
      is_debug: false,
    };
    const fallbackUser: User = {
      uuid: `reg-${Date.now()}`,
      username: cleanUsername,
      name: cleanName,
      roleId: 2,
      role: fallbackRole,
    };

    saveLocalRegisteredUser(fallbackUser, password);
    get().setUserSession(fallbackUser, fallbackRole);
    const welcomeMsg = i18nStore
      .t('register.success', `Pendaftaran berhasil! Selamat datang, ${fallbackUser.name}!`)
      .replace('{name}', fallbackUser.name);
    alertStore.showSuccess(welcomeMsg);
    return { success: true };
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
          console.warn('[authStore] RPC authenticate_user failed', error);
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
          alertStore.showSuccess(`${t('auth.welcomeBack')}, ${user.name}!`);
          return { success: true };
        }
      } catch (err) {
        console.warn('[authStore] Supabase auth error', err);
      }
    }

    // 2. Cek local registered users fallback
    const localUser = findLocalRegisteredUser(cleanUsername, password);
    if (localUser) {
      const viewerRole: Role = {
        id: localUser.roleId || 2,
        name: localUser.role?.name || 'VIEWER',
        is_debug: false,
      };
      get().setUserSession(localUser, viewerRole);
      alertStore.showSuccess(`${t('auth.welcomeBack')}, ${localUser.name}!`);
      return { success: true };
    }

    set({ isLoading: false });
    return { success: false, message: `${t('auth.errorInvalid')}` };
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
    alertStore.showInfo(`${t('auth.loggedOut')}`);
  },
}));

export const authStore = {
  ...rawAuthStore,
  login: (username: string, password: string) => rawAuthStore.getState().login(username, password),
  register: (name: string, username: string, password: string) => rawAuthStore.getState().register(name, username, password),
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

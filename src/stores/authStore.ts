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
  deleteTestUser: (username: string) => Promise<boolean>;
  cleanupTestUsers: () => Promise<number>;
  changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; message?: string }>;
  fetchAllUsers: () => Promise<User[]>;
  updateUserRole: (uuid: string, newRoleId: number | string) => Promise<boolean>;
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
            // alertStore.showError(error.message);
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

  deleteTestUser: async (username: string): Promise<boolean> => {
    const cleanUsername = username.trim().toLowerCase();
    if (!cleanUsername.includes('test')) {
      console.warn('[authStore] deleteTestUser only allows usernames containing "test"');
      return false;
    }

    // 1. Remove from localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(REGISTERED_USERS_KEY) || '[]';
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const filtered = list.filter((u: any) => u.username?.toLowerCase() !== cleanUsername);
          localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(filtered));
        }
      } catch (e) {
        console.error('[authStore] Failed to remove local registered user', e);
      }
    }

    // 2. Remove from Supabase
    if (isSupabaseEnabled && supabase) {
      try {
        const { data, error } = await supabase.rpc('delete_test_user', { p_username: cleanUsername });
        if (error) {
          await supabase.from('users').delete().eq('username', cleanUsername);
        }
        return Boolean(data);
      } catch (err) {
        console.error('[authStore] Exception deleting test user in Supabase', err);
      }
    }

    return true;
  },

  cleanupTestUsers: async (): Promise<number> => {
    let deletedCount = 0;

    // 1. Clean from localStorage
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem(REGISTERED_USERS_KEY) || '[]';
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const filtered = list.filter((u: any) => !u.username?.toLowerCase().includes('test'));
          deletedCount += (list.length - filtered.length);
          localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(filtered));
        }
      } catch (e) {
        console.error('[authStore] Failed to cleanup local registered users', e);
      }
    }

    // 2. Clean from Supabase
    if (isSupabaseEnabled && supabase) {
      try {
        const { data, error } = await supabase.rpc('cleanup_test_users');
        if (!error && typeof data === 'number') {
          deletedCount += data;
        } else {
          await supabase.from('users').delete().ilike('username', '%test%');
        }
      } catch (err) {
        console.error('[authStore] Exception cleaning up test users in Supabase', err);
      }
    }

    return deletedCount;
  },

  changePassword: async (oldPassword: string, newPassword: string): Promise<{ success: boolean; message?: string }> => {
    const currentUser = get().user;
    if (!currentUser) {
      return { success: false, message: i18nStore.t('auth.notLoggedIn', 'User belum login') };
    }

    if (!oldPassword.trim()) {
      return { success: false, message: i18nStore.t('auth.oldPasswordRequired', 'Password lama wajib diisi!') };
    }

    if (!newPassword.trim() || newPassword.length < 6) {
      return { success: false, message: i18nStore.t('auth.newPasswordMinLength', 'Password baru minimal 6 karakter!') };
    }

    set({ isLoading: true });
    try {
      if (isSupabaseEnabled && supabase) {
        const { data, error } = await supabase.rpc('change_user_password', {
          p_username: currentUser.username,
          p_old_password: oldPassword,
          p_new_password: newPassword,
        });

        if (error) {
          set({ isLoading: false });
          return { success: false, message: error.message };
        }
      } else {
        const raw = localStorage.getItem(REGISTERED_USERS_KEY) || '[]';
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          const userIdx = list.findIndex((u: any) => u.username?.toLowerCase() === currentUser.username.toLowerCase());
          if (userIdx !== -1) {
            if (list[userIdx].password && list[userIdx].password !== oldPassword) {
              set({ isLoading: false });
              return { success: false, message: i18nStore.t('auth.oldPasswordWrong', 'Password lama tidak sesuai!') };
            }
            list[userIdx].password = newPassword;
            localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(list));
          }
        }
      }

      set({ isLoading: false });
      alertStore.showSuccess(i18nStore.t('auth.changePasswordSuccess', 'Password berhasil diperbarui!'));
      return { success: true };
    } catch (err: any) {
      set({ isLoading: false });
      return { success: false, message: err?.message || 'Gagal mengubah password' };
    }
  },

  fetchAllUsers: async (): Promise<User[]> => {
    if (!get().hasDebugAccess) {
      alertStore.showError(i18nStore.t('auth.unauthorizedApps', 'Akses ditolak!'));
      return [];
    }

    const userMap = new Map<string, User>();

    if (isSupabaseEnabled && supabase) {
      try {
        const { data, error } = await supabase.rpc('get_users_list');
        if (!error && Array.isArray(data) && data.length > 0) {
          data.forEach((row: any) => {
            const userObj: User = {
              uuid: row.uuid,
              username: row.username,
              name: row.name,
              roleId: row.role_id,
              role: {
                id: row.role_id,
                name: row.role_name || (row.role_id === 1 ? 'SUPERADMIN' : 'VIEWER'),
                is_debug: Boolean(row.is_debug),
              },
            };
            userMap.set(userObj.username.toLowerCase(), userObj);
          });
        }
      } catch (err) {
        console.warn('[authStore] Failed to fetch users via RPC get_users_list', err);
      }
    }

    // Fallback: load baseline superadmin if userMap is empty
    if (userMap.size === 0) {
      userMap.set('rizlfauzy', {
        uuid: 'a0000000-0000-0000-0000-000000000001',
        username: 'rizlfauzy',
        name: 'Rizal Fauzi',
        roleId: 1,
        role: { id: 1, name: 'SUPERADMIN', is_debug: true },
      });
    }

    // Always merge registered users from localStorage (for test mocks, offline, or newly registered local users)
    try {
      const raw = localStorage.getItem(REGISTERED_USERS_KEY) || '[]';
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        parsed.forEach((u: any) => {
          if (!u || !u.username) return;
          const key = u.username.toLowerCase();
          const existing = userMap.get(key);
          if (existing) {
            if (u.roleId !== undefined) {
              existing.roleId = u.roleId;
              existing.role = u.role || {
                id: u.roleId,
                name: u.roleId === 1 ? 'SUPERADMIN' : 'VIEWER',
                is_debug: u.roleId === 1,
              };
            }
          } else {
            userMap.set(key, {
              uuid: u.uuid || `user-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
              username: u.username,
              name: u.name,
              roleId: u.roleId || 2,
              role: u.role || { id: u.roleId || 2, name: u.roleId === 1 ? 'SUPERADMIN' : 'VIEWER', is_debug: u.roleId === 1 },
            });
          }
        });
      }
    } catch {}

    return Array.from(userMap.values());
  },

  updateUserRole: async (uuid: string, newRoleId: number | string): Promise<boolean> => {
    if (!get().hasDebugAccess) {
      alertStore.showError(i18nStore.t('auth.unauthorizedApps', 'Akses ditolak!'));
      return false;
    }

    const currentUser = get().user;
    if (currentUser?.uuid === uuid && (Number(newRoleId) === 2 || newRoleId === '2')) {
      alertStore.showError(i18nStore.t('users.cannotDemoteSelf', 'Tidak dapat menurunkan role akun sendiri yang sedang aktif!'));
      return false;
    }

    const numRoleId = Number(newRoleId);
    const isSuperadmin = numRoleId === 1;

    if (isSupabaseEnabled && supabase) {
      try {
        const { error } = await supabase.rpc('update_user_role', {
          p_target_uuid: uuid,
          p_role_id: numRoleId,
        });
        if (error) throw new Error(`${error.message} ${t("common.because", "Karena")} ${error.details}`);
      } catch (err) {
        alertStore.throwAlert(err as Error)
        return false;
      }
    }

    // Update local storage fallback
    try {
      const raw = localStorage.getItem(REGISTERED_USERS_KEY) || '[]';
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        const updated = list.map((u: any) => {
          if (u.uuid === uuid || (u.username && u.username.toLowerCase() === uuid.toLowerCase())) {
            return {
              ...u,
              roleId: numRoleId,
              role: {
                id: numRoleId,
                name: isSuperadmin ? 'SUPERADMIN' : 'VIEWER',
                is_debug: isSuperadmin,
              },
            };
          }
          return u;
        });
        localStorage.setItem(REGISTERED_USERS_KEY, JSON.stringify(updated));
      }
    } catch {}

    alertStore.showSuccess(i18nStore.t('users.roleUpdateSuccess', 'Role pengguna berhasil diperbarui!'));
    return true;
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
  deleteTestUser: (username: string) => rawAuthStore.getState().deleteTestUser(username),
  cleanupTestUsers: () => rawAuthStore.getState().cleanupTestUsers(),
  changePassword: (oldPassword: string, newPassword: string) => rawAuthStore.getState().changePassword(oldPassword, newPassword),
  fetchAllUsers: () => rawAuthStore.getState().fetchAllUsers(),
  updateUserRole: (uuid: string, newRoleId: number | string) => rawAuthStore.getState().updateUserRole(uuid, newRoleId),
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

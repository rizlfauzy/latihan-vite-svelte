import { createRouter } from 'sv-router';
import Home from '@/pages/home/page.svelte';
import CompanyProfile from '@/pages/company-profile/page.svelte';
import Login from '@/pages/login/page.svelte';
import Profile from '@/pages/profile/page.svelte';
import ProtectedRoute from '@/components/routes/ProtectedRoute.svelte';
import UnprotectedRoute from '@/components/routes/UnprotectedRoute.svelte';
import { authStore } from '@/stores/authStore';
import { alertStore } from '@/stores/alertStore';
import { i18nStore } from '@/stores/i18nStore';

declare module 'sv-router' {
  interface RouteMeta {
    requiresAuth?: boolean;
    guestOnly?: boolean;
    requireDebug?: boolean;
    redirectTo?: string;
  }
}

export const router = createRouter({
  hooks: {
    beforeLoad({ pathname, meta }) {
      const isAuth = authStore.getState().isAuthenticated;
      const hasDebug = authStore.getState().hasDebugAccess;

      if (meta?.requiresAuth && !isAuth) {
        alertStore.showWarning(
          i18nStore.t('auth.loginRequired', 'Silakan login terlebih dahulu untuk mengakses halaman ini!')
        );
        const search = pathname && pathname !== '/' ? { redirect: pathname } : undefined;
        router.navigate('/login', { replace: true, search });
        return false;
      }

      if (meta?.guestOnly && isAuth) {
        router.navigate('/profile', { replace: true });
        return false;
      }

      if (meta?.requireDebug && !hasDebug) {
        alertStore.showError(
          i18nStore.t('auth.unauthorizedApps', 'Akses ditolak: Hanya role dengan izin debug!')
        );
        router.navigate('/', { replace: true });
        return false;
      }
    },
  },
  '/': Home,
  '/company-profile': CompanyProfile,
  '/login': {
    layout: UnprotectedRoute,
    '/': Login,
    meta: { guestOnly: true },
  },
  '/profile': {
    layout: ProtectedRoute,
    '/': Profile,
    meta: { requiresAuth: true },
  },
  '*': Home,
});

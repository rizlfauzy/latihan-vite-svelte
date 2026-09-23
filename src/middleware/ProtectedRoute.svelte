<script lang="ts">
  import type { Snippet } from 'svelte';
  import { authStore } from '@/stores/authStore';
  import { router } from '@/router';
  import { alertStore } from '@/stores/alertStore';
  import { i18nStore } from '@/stores/i18nStore';

  type AppPath = '/' | '/company-profile' | '/login' | '/profile';

  interface Props {
    children?: Snippet;
    redirectTo?: AppPath;
    requireDebug?: boolean;
  }

  let { children, redirectTo = '/login', requireDebug = false }: Props = $props();

  let isAuthenticated = $derived($authStore.isAuthenticated);
  let hasDebugAccess = $derived($authStore.hasDebugAccess);
  let isLoading = $derived($authStore.isLoading);

  let isAuthorized = $derived(isAuthenticated && (!requireDebug || hasDebugAccess));

  $effect(() => {
    if (!isLoading && !isAuthorized) {
      if (!isAuthenticated) {
        // alertStore.showWarning(
        //   $i18nStore.t('auth.loginRequired', 'Silakan login terlebih dahulu untuk mengakses halaman ini!')
        // );
        // const currentPath = router.route.pathname;
        // const search = currentPath && currentPath !== '/' ? { redirect: currentPath } : undefined;
        // router.navigate(redirectTo, { replace: true, search });
        router.navigate(redirectTo, { replace: true });
      } else if (requireDebug && !hasDebugAccess) {
        alertStore.showError(
          $i18nStore.t('auth.unauthorizedApps', 'Akses ditolak: Hanya role dengan izin debug!')
        );
        router.navigate('/', { replace: true });
      }
    }
  });
</script>

{#if isAuthorized}
  {@render children?.()}
{:else}
  <div class="w-full max-w-md mx-auto py-12 px-4" data-testid="protected-route-fallback">
    <div class="nb-card bg-white p-6 sm:p-8 text-center border-4 shadow-nb flex flex-col items-center gap-4">
      <div class="w-16 h-16 rounded-full bg-nb-yellow border-3 border-nb-black shadow-nb flex items-center justify-center text-3xl animate-bounce">
        🔒
      </div>
      <div>
        <h2 class="text-lg font-black uppercase text-nb-black m-0">
          {$i18nStore.t('auth.redirectingLogin', 'Mengalihkan ke halaman login...')}
        </h2>
        <p class="text-xs font-bold text-gray-600 mt-1 m-0">
          {$i18nStore.t('auth.loginRequired', 'Silakan login terlebih dahulu untuk mengakses halaman ini!')}
        </p>
      </div>
      <div class="w-full bg-gray-200 h-2 border-2 border-nb-black rounded overflow-hidden mt-2">
        <div class="bg-nb-yellow h-full w-full animate-pulse"></div>
      </div>
    </div>
  </div>
{/if}

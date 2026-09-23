<script lang="ts">
  import type { Snippet } from 'svelte';
  import { authStore } from '@/stores/authStore';
  import { router } from '@/router';
  import { i18nStore } from '@/stores/i18nStore';

  type AppPath = '/' | '/company-profile' | '/login' | '/profile';

  interface Props {
    children?: Snippet;
    redirectTo?: AppPath;
  }

  let { children, redirectTo = '/profile' }: Props = $props();

  let isAuthenticated = $derived($authStore.isAuthenticated);
  let isLoading = $derived($authStore.isLoading);

  const validPaths: AppPath[] = ['/', '/company-profile', '/login', '/profile'];

  $effect(() => {
    if (!isLoading && isAuthenticated) {
      const search = router.route.search;
      const redirectQuery = typeof search?.redirect === 'string' ? search.redirect : '';
      const target: AppPath = validPaths.includes(redirectQuery as AppPath)
        ? (redirectQuery as AppPath)
        : redirectTo;
      router.navigate(target, { replace: true });
    }
  });
</script>

{#if !isAuthenticated}
  {@render children?.()}
{:else}
  <div class="w-full max-w-md mx-auto py-12 px-4" data-testid="unprotected-route-fallback">
    <div class="nb-card bg-white p-6 sm:p-8 text-center border-4 shadow-nb flex flex-col items-center gap-4">
      <div class="w-16 h-16 rounded-full bg-nb-green border-3 border-nb-black shadow-nb flex items-center justify-center text-3xl animate-pulse">
        ⚡
      </div>
      <div>
        <h2 class="text-lg font-black uppercase text-nb-black m-0">
          {$i18nStore.t('auth.redirecting', 'Mengalihkan...')}
        </h2>
        <p class="text-xs font-bold text-gray-600 mt-1 m-0">
          {$i18nStore.t('auth.alreadyLoggedIn', 'Anda sudah login.')}
        </p>
      </div>
      <div class="w-full bg-gray-200 h-2 border-2 border-nb-black rounded overflow-hidden mt-2">
        <div class="bg-nb-green h-full w-full animate-pulse"></div>
      </div>
    </div>
  </div>
{/if}

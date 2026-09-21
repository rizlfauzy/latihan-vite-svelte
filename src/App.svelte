<script lang="ts">
  import { Router } from 'sv-router';
  import Navbar from '@/components/Navbar.svelte';
  import AlertContainer from '@/components/AlertContainer.svelte';
  import { env } from '@/lib/env';
  import { i18nStore } from '@/stores/i18nStore';

  const { t } = i18nStore;
</script>

<AlertContainer />

{#if env.isDev}
  <aside class="fixed bottom-4 right-4 z-50 pointer-events-none" aria-label="Environment indicator">
    <div class="nb-badge bg-nb-yellow text-nb-black border-2 border-nb-black px-3 py-1.5 shadow-nb-md flex items-center gap-2 font-black text-xs">
      <span class="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
      <span>DEV MODE ({env.appEnv})</span>
    </div>
  </aside>
{/if}

<div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-16 flex flex-col gap-8 min-h-screen">
  <Navbar />

  <main class="w-full flex flex-col flex-1">
    <Router />
  </main>

  <footer class="nb-card flex items-center justify-between flex-wrap gap-4 bg-nb-yellow p-5 sm:px-6 mt-auto text-black">
    <div>
      <p class="text-base font-extrabold m-0">{t('footer.title')}</p>
      <small class="text-xs font-semibold text-gray-800!">
        {t('footer.subtitle')}
      </small>
    </div>
  </footer>
</div>

<script lang="ts">
  import { svelteApps, type AppItem } from '../data/apps';
  import AppCard from './AppCard.svelte';

  let { apps = svelteApps }: { apps?: AppItem[] } = $props();
</script>

<section class="w-full">
  <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
    <div class="inline-flex items-center gap-2.5 bg-nb-yellow px-4.5 py-2 border-3 border-nb-black shadow-nb rounded-md text-lg md:text-xl font-extrabold uppercase tracking-wide">
      <span>🚀</span>
      <span>HUB APLIKASI SVELTE</span>
    </div>
    <span class="nb-badge bg-nb-green">
      {apps.length} APPS TERHUBUNG
    </span>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each apps as app (app.id)}
      <AppCard {app} />
    {/each}
  </div>
</section>

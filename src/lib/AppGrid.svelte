<script lang="ts">
  import { svelteApps, type AppItem } from '../data/apps';
  import AppCard from './AppCard.svelte';

  let { apps = svelteApps }: { apps?: AppItem[] } = $props();
</script>

<section class="apps-section">
  <div class="section-header">
    <div class="section-title">
      <span>🚀</span>
      <span>HUB APLIKASI SVELTE</span>
    </div>
    <span class="nb-badge" style="background: var(--nb-green);">
      {apps.length} APPS TERHUBUNG
    </span>
  </div>

  <div class="apps-grid">
    {#each apps as app (app.id)}
      <AppCard {app} />
    {/each}
  </div>
</section>

<style>
  .apps-section {
    width: 100%;
  }

  .apps-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 24px;
  }

  @media (max-width: 640px) {
    .apps-grid {
      grid-template-columns: 1fr;
    }
  }
</style>

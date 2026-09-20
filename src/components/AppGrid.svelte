<script lang="ts">
  import { appStore } from '@/stores/appStore';
  import type { AppItem } from '@/data/apps';
  import AppCard from './AppCard.svelte';
  import AddAppModal from './AddAppModal.svelte';
  import EditAppModal from './EditAppModal.svelte';
  import ConfirmModal from './ConfirmModal.svelte';
  import { env } from '@/lib/env';
  import { i18nStore } from '@/stores/i18nStore';

  let { apps }: { apps?: AppItem[] } = $props();

  let displayedApps = $derived(apps ?? $appStore.apps);
  let isAddModalOpen = $state(false);
  let appToDelete = $state<AppItem | null>(null);
  let appToEdit = $state<AppItem | null>(null);

  function handleDeleteConfirm() {
    if (appToDelete) {
      appStore.deleteApp(appToDelete.id);
      appToDelete = null;
    }
  }
</script>

<section class="w-full" data-testid="app-grid-section">
  <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
    <div class="inline-flex items-center gap-2.5 bg-nb-yellow px-4.5 py-2 border-3 border-nb-black shadow-nb rounded-md text-lg md:text-xl font-extrabold uppercase tracking-wide text-black">
      <span>🚀</span>
      <span>{$i18nStore.t('grid.title')}</span>
    </div>

    <div class="flex items-center gap-2.5 flex-wrap">
      {#if env.enableDebug}
        <button
          type="button"
          class="nb-btn bg-nb-pink text-xs font-black px-3.5 py-2 flex items-center gap-1.5"
          onclick={() => (isAddModalOpen = true)}
          data-testid="btn-open-add-app"
        >
          <span>➕</span>
          <span>{$i18nStore.t('grid.addApp')}</span>
        </button>
      {/if}

      <span class="nb-badge bg-nb-green" data-testid="apps-counter">
        {displayedApps.length} {$i18nStore.t('grid.connected')}
      </span>
    </div>
  </div>

  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="apps-list">
    {#each displayedApps as app (app.id)}
      <AppCard
        {app}
        onEdit={(a) => (appToEdit = a)}
        onDelete={(a) => (appToDelete = a)}
      />
    {/each}
  </div>

  {#if env.enableDebug}
    <AddAppModal bind:isOpen={isAddModalOpen} />

    <ConfirmModal
      isOpen={appToDelete !== null}
      title="HAPUS APLIKASI"
      message="Apakah Anda yakin ingin menghapus aplikasi ini langsung dari apps.ts?"
      itemText={appToDelete ? `${appToDelete.name} (${appToDelete.category})` : ''}
      confirmText={$i18nStore.t('action.deleteApp')}
      cancelText={$i18nStore.t('action.cancel')}
      onConfirm={handleDeleteConfirm}
      onCancel={() => (appToDelete = null)}
    />

    {#if appToEdit}
      <EditAppModal
        isOpen={appToEdit !== null}
        app={appToEdit}
        onClose={() => (appToEdit = null)}
      />
    {/if}
  {/if}
</section>

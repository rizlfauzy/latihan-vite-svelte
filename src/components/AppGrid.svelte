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

  let allApps = $derived(apps ?? $appStore.apps);
  let searchQuery = $state('');
  let selectedCategory = $state('ALL');

  let availableCategories = $derived([
    'ALL',
    ...Array.from(new Set(allApps.map((a) => a.category).filter(Boolean)))
  ]);

  let filteredApps = $derived(
    allApps.filter((app) => {
      const matchesCategory =
        selectedCategory === 'ALL' ||
        app.category.toLowerCase() === selectedCategory.toLowerCase();

      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        app.name.toLowerCase().includes(query) ||
        (app.picName && app.picName.toLowerCase().includes(query));

      return matchesCategory && matchesSearch;
    })
  );

  let isAddModalOpen = $state(false);
  let appToDelete = $state<AppItem | null>(null);
  let appToEdit = $state<AppItem | null>(null);

  function resetFilters() {
    searchQuery = '';
    selectedCategory = 'ALL';
  }

  function handleDeleteConfirm() {
    if (appToDelete) {
      appStore.deleteApp(appToDelete.id);
      appToDelete = null;
    }
  }
</script>

<section class="w-full" data-testid="app-grid-section">
  <!-- Top Section Title & Actions -->
  <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
    <div class="inline-flex items-center gap-2.5 bg-nb-yellow px-4.5 py-2 border-3 border-nb-black shadow-nb rounded-md text-lg md:text-xl font-extrabold uppercase tracking-wide text-black">
      <span>🚀</span>
      <span>{$i18nStore.t('grid.title')}</span>
    </div>

    <div class="flex items-center gap-2.5 flex-wrap">
      {#if env.enableDebug}
        <button
          type="button"
          class="nb-btn bg-nb-pink text-xs font-black px-3.5 py-2 flex items-center gap-1.5 text-black"
          onclick={() => (isAddModalOpen = true)}
          data-testid="btn-open-add-app"
        >
          <span>➕</span>
          <span>{$i18nStore.t('grid.addApp')}</span>
        </button>
      {/if}

      <span class="nb-badge bg-nb-green text-black" data-testid="apps-counter">
        {#if filteredApps.length !== allApps.length}
          {filteredApps.length} / {allApps.length} {$i18nStore.t('grid.connected')}
        {:else}
          {allApps.length} {$i18nStore.t('grid.connected')}
        {/if}
      </span>
    </div>
  </div>

  <!-- Search & Category Filters Bar -->
  <div class="nb-card bg-white p-4 mb-6 flex flex-col gap-4 shadow-nb border-3" data-testid="search-filter-bar">
    <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
      <!-- Search Input Container -->
      <div class="relative grow">
        <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold select-none text-base pointer-events-none z-10">
          🔍
        </span>

        <input
          type="text"
          bind:value={searchQuery}
          placeholder={$i18nStore.t('grid.searchPlaceholder')}
          class="nb-input pl-10 pr-10 py-2 text-sm font-bold w-full"
          data-testid="search-apps-input"
        />
        {#if searchQuery.trim().length > 0}
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-nb-pink text-xs font-black flex items-center justify-center cursor-pointer border border-nb-black shadow-nb-xs text-black"
            onclick={() => (searchQuery = '')}
            title="Hapus pencarian"
            aria-label="Hapus pencarian"
            data-testid="btn-clear-search"
          >
            ✕
          </button>
        {/if}
      </div>

      <!-- Reset Filter Button (if filter or search is active) -->
      {#if searchQuery.trim().length > 0 || selectedCategory !== 'ALL'}
        <button
          type="button"
          class="nb-btn bg-white hover:bg-nb-red hover:text-white text-xs px-3.5 py-2 font-extrabold whitespace-nowrap self-start sm:self-auto text-black"
          onclick={resetFilters}
          data-testid="btn-reset-filters"
        >
          <span>↺</span>
          <span>{$i18nStore.t('grid.resetFilter')}</span>
        </button>
      {/if}
    </div>

    <!-- Category Filter Badges / Buttons -->
    <div class="flex items-center gap-2 flex-wrap pt-1 border-t-2 border-dashed border-gray-200" data-testid="category-filter-list">
      <span class="text-xs font-black text-gray-600 uppercase mr-1 select-none">
        🏷️ {$i18nStore.t('grid.filterCategory')}
      </span>
      {#each availableCategories as cat}
        <button
          type="button"
          class="nb-btn text-xs px-3 py-1.5 font-black {selectedCategory === cat ? 'bg-nb-yellow' : 'bg-white hover:bg-gray-100'} text-black"
          onclick={() => (selectedCategory = cat)}
          data-testid={`category-btn-${cat.toLowerCase().replace(/\s+/g, '-')}`}
        >
          {cat === 'ALL' ? $i18nStore.t('grid.categoryAll') : cat}
        </button>
      {/each}
    </div>
  </div>

  <!-- Apps Grid / Empty State -->
  {#if filteredApps.length === 0}
    <div class="nb-card bg-white p-8 text-center flex flex-col items-center justify-center gap-3 border-3 border-dashed" data-testid="apps-empty-state">
      <span class="text-4xl">🔎</span>
      <p class="font-extrabold text-base text-gray-700 max-w-md m-0">
        {$i18nStore.t('grid.emptySearch')}
      </p>
      <button
        type="button"
        class="nb-btn bg-nb-yellow text-xs px-4 py-2 mt-2 font-black text-black"
        onclick={resetFilters}
        data-testid="btn-empty-reset"
      >
        {$i18nStore.t('grid.resetFilter')}
      </button>
    </div>
  {:else}
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="apps-list">
      {#each filteredApps as app (app.id)}
        <AppCard
          {app}
          onEdit={(a) => (appToEdit = a)}
          onDelete={(a) => (appToDelete = a)}
        />
      {/each}
    </div>
  {/if}

  {#if env.enableDebug}
    <AddAppModal bind:isOpen={isAddModalOpen} />

    <ConfirmModal
      isOpen={appToDelete !== null}
      title={$i18nStore.t('grid.confirmModalDeleteAppTitle')}
      message={$i18nStore.t('grid.confirmModalDeleteAppMsg')}
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

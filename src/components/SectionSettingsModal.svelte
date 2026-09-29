<script lang="ts">
  import { sectionStore, type SectionItem } from '@/stores/sectionStore';
  import { i18nStore } from '@/stores/i18nStore';
  import { ArrowUp, ArrowDown, Eye, EyeOff, RotateCcw, X, SlidersHorizontal } from '@lucide/svelte';

  let {
    isOpen = $bindable(false),
  }: {
    isOpen: boolean;
  } = $props();

  const t = $derived((key: string, defaultValue: string = ''): string => $i18nStore.t(key, defaultValue));

  let activeTab = $state<'home' | 'company-profile'>('home');

  let currentSections = $derived(
    $sectionStore.sections
      .filter((s) => s.page === activeTab)
      .sort((a, b) => a.orderIndex - b.orderIndex)
  );

  function getSectionTitle(sec: SectionItem): string {
    return t(`section.${sec.sectionKey}`, sec.title);
  }

  function handleClose() {
    isOpen = false;
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && isOpen) {
      handleClose();
    }
  }

  async function handleMove(sectionKey: string, direction: 'up' | 'down') {
    await sectionStore.moveSection(activeTab, sectionKey, direction);
  }

  async function handleToggle(sectionKey: string) {
    await sectionStore.toggleVisibility(activeTab, sectionKey);
  }

  async function handleReset() {
    await sectionStore.resetSections(activeTab);
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div
    class="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto animate-in"
    onclick={handleBackdropClick}
    role="presentation"
    data-testid="section-settings-modal-backdrop"
  >
    <div
      class="nb-card bg-nb-surface text-nb-black w-full max-w-lg p-6 my-8 border-4 border-nb-black shadow-nb-lg relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="section-settings-title"
      data-testid="section-settings-modal"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b-3 border-nb-black pb-3">
        <div class="flex items-center gap-2">
          <div class="p-1.5 bg-nb-yellow border-2 border-nb-black rounded shadow-nb-xs">
            <SlidersHorizontal size={20} class="text-nb-black" />
          </div>
          <div>
            <h2 id="section-settings-title" class="text-lg font-black uppercase text-nb-black">
              {t('layoutModal.title')}
            </h2>
            <p class="text-[11px] text-gray-600 font-bold">{t('layoutModal.subtitle')}</p>
          </div>
        </div>
        <button
          type="button"
          class="nb-btn bg-red-500 hover:bg-nb-pink text-xs font-black p-1.5 w-8 h-8 flex items-center justify-center text-nb-black"
          onclick={handleClose}
          aria-label={t('layoutModal.close')}
          data-testid="btn-close-section-settings"
        >
          <X size={16} />
        </button>
      </div>

      <!-- Page Tabs -->
      <div class="flex items-center gap-2 border-b-2 border-nb-black pb-2">
        <button
          type="button"
          class="nb-btn text-xs px-3 py-1.5 font-black uppercase transition-all {activeTab === 'home' ? 'bg-nb-yellow ring-2 ring-nb-black' : 'bg-white hover:bg-gray-100'}"
          onclick={() => (activeTab = 'home')}
          data-testid="tab-section-home"
        >
          {t('layoutModal.tabHome')}
        </button>
        <button
          type="button"
          class="nb-btn text-xs px-3 py-1.5 font-black uppercase transition-all {activeTab === 'company-profile' ? 'bg-nb-yellow ring-2 ring-nb-black' : 'bg-white hover:bg-gray-100'}"
          onclick={() => (activeTab = 'company-profile')}
          data-testid="tab-section-cp"
        >
          {t('layoutModal.tabCompany')}
        </button>
      </div>

      <!-- Section List -->
      <div class="flex flex-col gap-2.5 my-1">
        {#each currentSections as sec, idx (sec.sectionKey)}
          <div
            class="flex items-center justify-between p-3 border-2 border-nb-black rounded bg-white shadow-nb-xs transition-all {sec.visible ? 'opacity-100' : 'opacity-60 bg-gray-100'}"
            data-testid="section-item-{sec.sectionKey}"
          >
            <div class="flex items-center gap-3">
              <span class="w-6 h-6 rounded border-2 border-nb-black bg-nb-yellow text-xs font-black flex items-center justify-center shrink-0">
                {idx + 1}
              </span>
              <div class="flex flex-col">
                <span class="font-black text-sm text-nb-black">{getSectionTitle(sec)}</span>
                <span class="text-[10px] text-gray-500 font-mono font-bold">#{sec.sectionKey}</span>
              </div>
            </div>

            <div class="flex items-center gap-1.5">
              <!-- Reorder Buttons -->
              <button
                type="button"
                disabled={idx === 0}
                class="nb-btn bg-white hover:bg-nb-yellow disabled:opacity-30 disabled:cursor-not-allowed p-1.5 border-2 border-nb-black text-black"
                onclick={() => handleMove(sec.sectionKey, 'up')}
                title={t('layoutModal.moveUp')}
                data-testid="btn-move-up-{sec.sectionKey}"
              >
                <ArrowUp size={14} />
              </button>
              <button
                type="button"
                disabled={idx === currentSections.length - 1}
                class="nb-btn bg-white hover:bg-nb-yellow disabled:opacity-30 disabled:cursor-not-allowed p-1.5 border-2 border-nb-black text-black"
                onclick={() => handleMove(sec.sectionKey, 'down')}
                title={t('layoutModal.moveDown')}
                data-testid="btn-move-down-{sec.sectionKey}"
              >
                <ArrowDown size={14} />
              </button>

              <!-- Visibility Toggle -->
              <button
                type="button"
                class="nb-btn p-1.5 border-2 border-nb-black text-xs font-black flex items-center gap-1 {sec.visible ? 'bg-nb-green text-black' : 'bg-gray-300 text-gray-600'}"
                onclick={() => handleToggle(sec.sectionKey)}
                title={sec.visible ? t('layoutModal.toggleHide') : t('layoutModal.toggleShow')}
                data-testid="btn-toggle-visible-{sec.sectionKey}"
              >
                {#if sec.visible}
                  <Eye size={14} />
                  <span class="hidden sm:inline text-[10px]">{t('layoutModal.show')}</span>
                {:else}
                  <EyeOff size={14} />
                  <span class="hidden sm:inline text-[10px]">{t('layoutModal.hide')}</span>
                {/if}
              </button>
            </div>
          </div>
        {/each}
      </div>

      <!-- Footer Actions -->
      <div class="flex items-center justify-between border-t-2 border-dashed border-nb-black pt-3 mt-1">
        <button
          type="button"
          class="nb-btn bg-white hover:bg-gray-100 text-xs px-3 py-1.5 border-2 border-nb-black flex items-center gap-1.5 text-black font-bold"
          onclick={handleReset}
          data-testid="btn-reset-sections"
        >
          <RotateCcw size={14} />
          <span>{t('layoutModal.reset')}</span>
        </button>

        <button
          type="button"
          class="nb-btn bg-nb-blue text-xs font-black px-4 py-1.5 border-2 border-nb-black text-black"
          onclick={handleClose}
          data-testid="btn-done-section-settings"
        >
          {t('layoutModal.done')}
        </button>
      </div>
    </div>
  </div>
{/if}

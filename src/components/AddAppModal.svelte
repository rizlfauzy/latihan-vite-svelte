<script lang="ts">
  import { appStore } from '@/stores/appStore';
  import type { AppItem } from '@/data/apps';
  import { i18nStore } from '@/stores/i18nStore';
  import CustomSelect from '@/components/CustomSelect.svelte';
  import SkeletonModal from '@/components/SkeletonModal.svelte';

  let {
    isOpen = $bindable(false),
    isLoading = false,
  }: {
    isOpen: boolean;
    isLoading?: boolean;
  } = $props();

  let name = $state('');
  let url = $state('');
  let description = $state('');
  let category = $state('Productivity');
  let icon = $state('🚀');
  let selectedColor = $state('yellow');
  let picName = $state('');
  let picWhatsapp = $state('');
  let copyFeedback = $state('');
  let errorMessage = $state('');

  const colorOptions = [
    { label: 'Yellow', value: 'yellow', cssVar: 'var(--color-nb-yellow)', bgClass: 'bg-nb-yellow' },
    { label: 'Green', value: 'green', cssVar: 'var(--color-nb-green)', bgClass: 'bg-nb-green' },
    { label: 'Blue', value: 'blue', cssVar: 'var(--color-nb-blue)', bgClass: 'bg-nb-blue' },
    { label: 'Pink', value: 'pink', cssVar: 'var(--color-nb-pink)', bgClass: 'bg-nb-pink' },
    { label: 'Purple', value: 'purple', cssVar: 'var(--color-nb-purple)', bgClass: 'bg-nb-purple' },
    { label: 'Orange', value: 'orange', cssVar: 'var(--color-nb-orange)', bgClass: 'bg-nb-orange' },
  ];

  const categoryOptions = [
    'Productivity',
    'DevTools',
    'Utility',
    'Finance',
    'Writing',
    'Portfolio',
    'Internal',
    'General',
  ];

  const quickIcons = ['🚀', '⚡', '📊', '💼', '🛠️', '🔒', '👥', '💡', '📝', '🌐'];

  function resetForm() {
    name = '';
    url = '';
    description = '';
    category = 'Productivity';
    icon = '🚀';
    selectedColor = 'yellow';
    picName = '';
    picWhatsapp = '';
    errorMessage = '';
    copyFeedback = '';
  }

  function handleClose() {
    isOpen = false;
    resetForm();
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

  function buildAppItem(): AppItem {
    const chosen = colorOptions.find((c) => c.value === selectedColor);
    const colorVar = chosen ? chosen.cssVar : 'var(--color-nb-yellow)';
    const cleanId = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `app-${Date.now()}`;

    // Clean WhatsApp number: remove +, space, dash
    const cleanWa = picWhatsapp.replace(/\D/g, '') || '6281234567890';

    return {
      id: `${cleanId}-${Date.now().toString().slice(-4)}`,
      name: name.trim(),
      description: description.trim(),
      url: url.trim().startsWith('http') ? url.trim() : `https://${url.trim()}`,
      icon: icon.trim() || '⚡',
      category: category.trim() || 'General',
      color: colorVar,
      picName: picName.trim() || 'Admin PIC',
      picWhatsapp: cleanWa,
    };
  }

  function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    errorMessage = '';

    if (!name.trim()) {
      errorMessage = $i18nStore.t('modal.errName');
      return;
    }
    if (!url.trim()) {
      errorMessage = $i18nStore.t('modal.errUrl');
      return;
    }
    if (!description.trim()) {
      errorMessage = $i18nStore.t('modal.errDesc');
      return;
    }

    const newApp = buildAppItem();
    appStore.addApp(newApp);
    handleClose();
  }

  async function copyTsSnippet() {
    if (!name.trim() || !url.trim()) {
      errorMessage = $i18nStore.t('modal.errCopy');
      return;
    }
    const app = buildAppItem();
    const snippet = `  {
    id: "${app.id}",
    name: "${app.name}",
    description: "${app.description}",
    url: "${app.url}",
    icon: "${app.icon}",
    category: "${app.category}",
    color: "${app.color}",
    picName: "${app.picName}",
    picWhatsapp: "${app.picWhatsapp}"
  },`;

    try {
      await navigator.clipboard.writeText(snippet);
      copyFeedback = $i18nStore.t('modal.copySuccess');
      setTimeout(() => {
        copyFeedback = '';
      }, 3000);
    } catch {
      copyFeedback = $i18nStore.t('modal.copyFail');
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div
    class="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto animate-in"
    onclick={handleBackdropClick}
    role="presentation"
    data-testid="add-app-modal-backdrop"
  >
    <div
      class="nb-card bg-nb-surface text-nb-black w-full max-w-lg p-6 my-8 border-4 border-nb-black shadow-nb-lg relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-app-title"
      data-testid="add-app-modal-card"
    >
      {#if isLoading}
        <SkeletonModal />
      {:else}
      <!-- Modal Header -->
      <div class="flex items-center justify-between border-b-3 border-nb-black pb-3">
        <div class="flex items-center gap-2">
          <span class="text-2xl">➕</span>
          <h2 id="add-app-title" class="text-xl font-black uppercase text-nb-black">
            {$i18nStore.t('modal.addTitle')}
          </h2>
        </div>
        <button
          type="button"
          class="nb-btn bg-red-500 hover:bg-nb-pink text-xs font-black p-1.5 w-8 h-8 flex items-center justify-center text-nb-black"
          onclick={handleClose}
          aria-label="Tutup modal"
          data-testid="add-app-close-btn"
        >
          ✕
        </button>
      </div>

      <!-- Debug Mode Notice -->
      <div class="bg-nb-yellow/40 border-2 border-nb-black p-3 text-xs font-bold text-gray-800 flex items-center gap-2">
        <span class="text-base">🛠️</span>
        <div>
          <strong class="uppercase">{$i18nStore.t('modal.debugNoticeTitle')}</strong>
          {$i18nStore.t('modal.debugNoticeDesc')}
        </div>
      </div>

      {#if errorMessage}
        <div class="bg-red-100 border-2 border-red-600 text-red-800 p-2.5 text-xs font-bold" data-testid="add-app-error">
          ⚠️ {errorMessage}
        </div>
      {/if}

      {#if copyFeedback}
        <div class="bg-green-100 border-2 border-green-600 text-green-800 p-2.5 text-xs font-bold">
          {copyFeedback}
        </div>
      {/if}

      <!-- Form -->
      <form onsubmit={handleSubmit} class="flex flex-col gap-4 text-xs font-bold">
        <!-- Nama Aplikasi & Icon -->
        <div class="grid grid-cols-4 gap-3">
          <div class="col-span-3 flex flex-col gap-1">
            <label for="app-name" class="uppercase">{$i18nStore.t('modal.nameLabel')}</label>
            <input
              id="app-name"
              type="text"
              class="nb-input p-2.5"
              placeholder={$i18nStore.t('modal.namePlaceholder')}
              bind:value={name}
              required
              data-testid="input-app-name"
            />
          </div>

          <div class="col-span-1 flex flex-col gap-1">
            <label for="app-icon" class="uppercase">{$i18nStore.t('modal.iconLabel')}</label>
            <input
              id="app-icon"
              type="text"
              class="nb-input p-2.5 text-center text-base"
              maxlength="4"
              bind:value={icon}
              data-testid="input-app-icon"
            />
          </div>
        </div>

        <!-- Quick Icon Selector -->
        <div class="flex items-center gap-1.5 flex-wrap">
          <span class="text-[11px] text-gray-600 uppercase font-black">{$i18nStore.t('modal.quickPick')}</span>
          {#each quickIcons as qi}
            <button
              type="button"
              class="w-7 h-7 border-2 border-nb-black bg-white hover:bg-nb-yellow flex items-center justify-center font-bold text-sm text-black"
              onclick={() => (icon = qi)}
            >
              {qi}
            </button>
          {/each}
        </div>

        <!-- URL & Kategori -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1">
            <label for="app-url" class="uppercase">{$i18nStore.t('modal.urlLabel')}</label>
            <input
              id="app-url"
              type="text"
              class="nb-input p-2.5"
              placeholder={$i18nStore.t('modal.urlPlaceholder')}
              bind:value={url}
              required
              data-testid="input-app-url"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label for="app-category" class="uppercase">{$i18nStore.t('modal.categoryLabel')}</label>
            <CustomSelect
              id="app-category"
              options={categoryOptions}
              bind:value={category}
              placeholder={$i18nStore.t('modal.categoryPlaceholder')}
              searchPlaceholder={$i18nStore.t('modal.searchCategoryPlaceholder')}
              dataTestId="input-app-category"
            />
          </div>
        </div>

        <!-- Deskripsi -->
        <div class="flex flex-col gap-1">
          <label for="app-desc" class="uppercase">{$i18nStore.t('modal.descLabel')}</label>
          <textarea
            id="app-desc"
            class="nb-input p-2.5 h-18 resize-y"
            placeholder={$i18nStore.t('modal.descPlaceholder')}
            bind:value={description}
            required
            data-testid="input-app-desc"
          ></textarea>
        </div>

        <!-- Pilihan Warna Badge Neo Brutalism -->
        <div class="flex flex-col gap-1">
          <span class="uppercase">{$i18nStore.t('modal.colorLabel')}</span>
          <div class="flex items-center gap-2 flex-wrap">
            {#each colorOptions as opt}
              <label
                class="flex items-center gap-1.5 cursor-pointer px-2.5 py-1 border-2 border-nb-black {opt.bgClass} shadow-nb-sm text-[11px] font-black uppercase text-black"
              >
                <input
                  type="radio"
                  name="badge-color"
                  value={opt.value}
                  checked={selectedColor === opt.value}
                  onchange={() => (selectedColor = opt.value)}
                  class="cursor-pointer"
                />
                <span>{opt.label}</span>
              </label>
            {/each}
          </div>
        </div>

        <!-- PIC & WhatsApp -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t-2 border-dashed border-nb-black pt-3">
          <div class="flex flex-col gap-1">
            <label for="app-pic" class="uppercase">{$i18nStore.t('modal.picLabel')}</label>
            <input
              id="app-pic"
              type="text"
              class="nb-input p-2.5"
              placeholder={$i18nStore.t('modal.picPlaceholder')}
              bind:value={picName}
              data-testid="input-app-pic"
            />
          </div>

          <div class="flex flex-col gap-1">
            <label for="app-wa" class="uppercase">{$i18nStore.t('modal.waLabel')}</label>
            <input
              id="app-wa"
              type="text"
              class="nb-input p-2.5"
              placeholder={$i18nStore.t('modal.waPlaceholder')}
              bind:value={picWhatsapp}
              data-testid="input-app-wa"
            />
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-t-3 border-nb-black pt-4 mt-2">
          <button
            type="button"
            class="nb-btn bg-white hover:bg-gray-100 text-xs px-3 py-2 flex items-center justify-center gap-1.5 text-black"
            onclick={copyTsSnippet}
            title={$i18nStore.t('modal.copyTooltip')}
            data-testid="btn-copy-snippet"
          >
            <span>📋</span>
            <span>{$i18nStore.t('modal.copySnippet')}</span>
          </button>

          <div class="flex items-center gap-2">
            <button
              type="button"
              class="nb-btn bg-white text-xs px-4 py-2 text-black"
              onclick={handleClose}
              data-testid="btn-cancel-add-app"
            >
              {$i18nStore.t('action.cancel')}
            </button>
            <button
              type="submit"
              class="nb-btn bg-nb-green text-xs font-black px-5 py-2 flex items-center justify-center gap-1.5 text-black"
              data-testid="btn-submit-add-app"
            >
              <span>💾</span>
              <span>{$i18nStore.t('modal.saveAdd')}</span>
            </button>
          </div>
        </div>
      </form>
      {/if}
    </div>
  </div>
{/if}

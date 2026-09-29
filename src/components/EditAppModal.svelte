<script lang="ts">
  import { appStore } from '@/stores/appStore';
  import type { AppItem } from '@/data/apps';
  import { i18nStore } from '@/stores/i18nStore';
  import CustomSelect from './CustomSelect.svelte';
  import SkeletonModal from './SkeletonModal.svelte';
  import AppIcon from '@/components/AppIcon.svelte';
  import { alertStore } from '@/stores/alertStore';
  import { env } from '@/lib/env';

  let {
    isOpen = $bindable(false),
    app,
    isLoading = false,
    onClose,
  }: {
    isOpen: boolean;
    app: AppItem;
    isLoading?: boolean;
    onClose?: () => void;
  } = $props();

  let name = $state('');
  let url = $state('');
  let description = $state('');
  let category = $state('Productivity');
  let icon = $state('app-window');
  let selectedColor = $state('yellow');
  let picName = $state('');
  let picWhatsapp = $state('');
  let errorMessage = $state('');
  let uploadedImageUrl = $state<string | null>(null);
  let isUploadingImage = $state(false);
  let fileInputRef = $state<HTMLInputElement | null>(null);

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
    'Portfolio',
    'Utility',
    'Finance',
    'Writing',
    'DevTools',
    'General',
  ];

  const quickIcons = [
    { label: 'AppWindow', value: 'app-window' },
    { label: 'Rocket', value: 'rocket' },
    { label: 'Zap', value: 'zap' },
    { label: 'Activity', value: 'activity' },
    { label: 'Briefcase', value: 'briefcase' },
    { label: 'Wrench', value: 'wrench' },
    { label: 'Lock', value: 'lock' },
    { label: 'Users', value: 'users' },
    { label: 'Lightbulb', value: 'lightbulb' },
    { label: 'FileText', value: 'file-text' },
    { label: 'Globe', value: 'globe' },
    { label: 'Gamepad', value: 'gamepad' },
  ];

  $effect(() => {
    if (isOpen && app) {
      name = app.name || '';
      url = app.url || '';
      description = app.description || '';
      category = app.category || 'Productivity';
      icon = app.icon || 'app-window';
      picName = app.picName || '';
      picWhatsapp = app.picWhatsapp || '';
      errorMessage = '';
      uploadedImageUrl = app.imageUrl || null;
      isUploadingImage = false;

      // Match color
      const foundColor = colorOptions.find((c) => c.cssVar === app.color);
      selectedColor = foundColor ? foundColor.value : 'yellow';
    }
  });

  function handleClose() {
    isOpen = false;
    errorMessage = '';
    onClose?.();
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

  async function handleFileSelect(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (!file) return;

    const allowed = ['jpg', 'jpeg', 'png', 'svg'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowed.includes(ext)) {
      alertStore.showError($i18nStore.t('imageModal.errFormat', 'Ekstensi file tidak didukung! Hanya .jpg, .jpeg, .png, dan .svg yang diperbolehkan.'));
      if (fileInputRef) fileInputRef.value = '';
      return;
    }

    const maxMb = env.maxImageSizeMb || 5;
    if (file.size > maxMb * 1024 * 1024) {
      alertStore.showError($i18nStore.t('imageModal.errSize', `Ukuran file melebihi batas maksimal ${maxMb} MB!`));
      if (fileInputRef) fileInputRef.value = '';
      return;
    }

    isUploadingImage = true;
    try {
      const url = await appStore.uploadAppImage(file);
      uploadedImageUrl = url;
    } catch (err: any) {
      alertStore.showError(err?.message || 'Gagal mengupload gambar');
    } finally {
      isUploadingImage = false;
      if (fileInputRef) fileInputRef.value = '';
    }
  }

  function handleRemoveImage() {
    uploadedImageUrl = null;
  }

  async function handleSubmit(e: SubmitEvent) {
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

    if (!picName.trim()) {
      errorMessage = $i18nStore.t('modal.errPic');
      return;
    }

    const cleanedWa = picWhatsapp.replace(/\D/g, '');
    if (!cleanedWa) {
      errorMessage = $i18nStore.t('modal.errWa');
      return;
    }

    const matchedColor = colorOptions.find((c) => c.value === selectedColor);
    const resolvedColor = matchedColor ? matchedColor.cssVar : 'var(--color-nb-yellow)';

    const updatedApp: AppItem = {
      ...app,
      name: name.trim(),
      url: url.trim(),
      description: description.trim(),
      category: category.trim(),
      icon: icon.trim() || 'app-window',
      color: resolvedColor,
      picName: picName.trim(),
      picWhatsapp: cleanedWa,
      imageUrl: uploadedImageUrl || null,
    };

    await appStore.editApp(updatedApp);
    handleClose();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-nb-black/60 backdrop-blur-xs transition-opacity overflow-y-auto"
    onclick={handleBackdropClick}
    role="presentation"
    data-testid="edit-app-modal-backdrop"
  >
    <!-- Modal Card -->
    <div
      class="nb-card max-w-xl w-full bg-nb-surface text-nb-black p-5 sm:p-6 my-8 relative flex flex-col gap-5 shadow-nb-lg border-3 border-nb-black animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-app-title"
      data-testid="edit-app-modal"
    >
      {#if isLoading}
        <SkeletonModal />
      {:else}
      <!-- Modal Header -->
      <div class="flex items-center justify-between gap-3 border-b-2 border-nb-black pb-3">
        <div class="inline-flex items-center gap-2 bg-nb-blue px-3 py-1 border-2 border-nb-black rounded font-black text-sm uppercase text-black">
          <span>✏️</span>
          <span id="edit-app-title">{$i18nStore.t('modal.editTitle')}</span>
        </div>

        <button
          type="button"
          class="w-8 h-8 border-2 border-nb-black hover:bg-nb-pink rounded flex items-center justify-center font-bold text-sm cursor-pointer shadow-nb-xs transition-all text-nb-black bg-red-500"
          onclick={handleClose}
          aria-label="Tutup form edit"
          data-testid="btn-close-edit-app"
        >
          ✕
        </button>
      </div>

      <!-- Error Message Banner -->
      {#if errorMessage}
        <div class="nb-card bg-nb-red text-white p-3 border-2 border-nb-black text-xs font-black flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      {/if}

      <!-- Form Body -->
      <form onsubmit={handleSubmit} class="flex flex-col gap-4 text-nb-black text-xs font-bold">
        <!-- Optional Image Upload -->
        <div class="flex flex-col gap-2 p-3 border-2 border-nb-black bg-gray-50 rounded-md">
          <div class="flex items-center justify-between">
            <span class="uppercase text-[11px] font-black text-gray-700">{$i18nStore.t('modal.appImageLabel')}</span>
            {#if uploadedImageUrl}
              <button
                type="button"
                class="text-[11px] text-red-600 hover:underline font-black cursor-pointer"
                onclick={handleRemoveImage}
                data-testid="btn-remove-edit-app-image"
              >
                {$i18nStore.t('modal.removeImage')}
              </button>
            {/if}
          </div>

          {#if uploadedImageUrl}
            <div class="flex items-center gap-3">
              <div class="w-14 h-14 border-2 border-nb-black rounded bg-white overflow-hidden shadow-nb-sm shrink-0">
                <img src={uploadedImageUrl} alt="Preview" class="w-full h-full object-cover" data-testid="preview-edit-app-image" />
              </div>
              <div class="text-[11px] text-gray-600">
                <p class="font-bold text-green-700">{$i18nStore.t('modal.imageAttached')}</p>
                <p>{$i18nStore.t('modal.imageDescEdit')}</p>
                <div class="mt-1">
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.svg"
                    bind:this={fileInputRef}
                    onchange={handleFileSelect}
                    class="hidden"
                    id="edit-app-image-input-replace"
                    data-testid="input-edit-app-image-replace"
                  />
                  <label
                    for="edit-app-image-input-replace"
                    class="nb-btn bg-white hover:bg-nb-yellow text-[10px] px-2 py-1 border-2 border-nb-black cursor-pointer inline-block text-black"
                  >
                    <span>{$i18nStore.t('modal.replaceImage')}</span>
                  </label>
                </div>
              </div>
            </div>
          {:else}
            <div class="flex items-center gap-2 flex-wrap">
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.svg"
                bind:this={fileInputRef}
                onchange={handleFileSelect}
                class="hidden"
                id="edit-app-image-input"
                data-testid="input-edit-app-image"
              />
              <label
                for="edit-app-image-input"
                class="nb-btn bg-white hover:bg-nb-yellow text-xs px-3 py-1.5 border-2 border-nb-black flex items-center gap-1.5 cursor-pointer text-black"
                data-testid="btn-upload-edit-app-image"
              >
                <span>📷</span>
                <span>{isUploadingImage ? $i18nStore.t('modal.uploading') : $i18nStore.t('modal.chooseImage')}</span>
              </label>
              <span class="text-[11px] text-gray-500 font-medium">{$i18nStore.t('modal.imageFallbackNotice')}</span>
            </div>
          {/if}
        </div>

        <!-- App Name -->
        <div class="flex flex-col gap-1.5">
          <label for="edit-name" class="font-extrabold text-xs uppercase tracking-wide">
            {$i18nStore.t('modal.nameLabel')}
          </label>
          <input
            id="edit-name"
            type="text"
            bind:value={name}
            placeholder={$i18nStore.t('modal.namePlaceholder')}
            class="nb-input w-full p-2.5 text-sm"
            required
            data-testid="input-edit-app-name"
          />
        </div>

        <!-- URL & Category -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="edit-url" class="font-extrabold text-xs uppercase tracking-wide">
              {$i18nStore.t('modal.urlLabel')}
            </label>
            <input
              id="edit-url"
              type="text"
              bind:value={url}
              placeholder={$i18nStore.t('modal.urlPlaceholder')}
              class="nb-input w-full p-2.5 text-sm"
              required
              data-testid="input-edit-app-url"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="edit-category" class="font-extrabold text-xs uppercase tracking-wide">
              {$i18nStore.t('modal.categoryLabel')}
            </label>
            <CustomSelect
              id="edit-category"
              options={categoryOptions}
              bind:value={category}
              placeholder={$i18nStore.t('modal.categoryPlaceholder')}
              searchPlaceholder={$i18nStore.t('modal.searchCategoryPlaceholder')}
              dataTestId="select-edit-app-category"
            />
          </div>
        </div>

        <!-- Description -->
        <div class="flex flex-col gap-1.5">
          <label for="edit-desc" class="font-extrabold text-xs uppercase tracking-wide">
            {$i18nStore.t('modal.descLabel')}
          </label>
          <textarea
            id="edit-desc"
            bind:value={description}
            rows="2"
            placeholder={$i18nStore.t('modal.descPlaceholder')}
            class="nb-input w-full p-2.5 text-sm resize-none"
            data-testid="input-edit-app-desc"
          ></textarea>
        </div>

        <!-- Icon Picker & Color Theme -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 border-2 border-nb-black p-3 bg-gray-50 rounded">
          <!-- Icon -->
          <div class="flex flex-col gap-1.5">
            <label for="edit-icon" class="font-extrabold text-xs uppercase tracking-wide">
              {$i18nStore.t('modal.iconLabel')}
            </label>
            <div class="flex items-center gap-2">
              <div class="w-10 h-10 border-2 border-nb-black bg-white flex items-center justify-center shrink-0">
                <AppIcon name={icon} size={20} />
              </div>
              <input
                id="edit-icon"
                type="text"
                bind:value={icon}
                class="nb-input w-24 text-center p-2 text-xs text-black"
                data-testid="input-edit-app-icon"
              />
            </div>
            <div class="flex gap-1 flex-wrap pt-1">
              {#each quickIcons.slice(0, 6) as qi}
                <button
                  type="button"
                  class="w-7 h-7 border-2 border-nb-black bg-white hover:bg-nb-yellow rounded text-xs flex items-center justify-center cursor-pointer transition-all text-black {icon === qi.value ? 'bg-nb-yellow ring-2 ring-nb-black' : ''}"
                  onclick={() => (icon = qi.value)}
                  title={qi.label}
                  data-testid="edit-quick-icon-{qi.value}"
                >
                  <AppIcon name={qi.value} size={15} />
                </button>
              {/each}
            </div>
          </div>

          <!-- Color -->
          <div class="flex flex-col gap-1.5">
            <span class="font-extrabold text-xs uppercase tracking-wide">{$i18nStore.t('modal.colorLabel')}</span>
            <div class="flex gap-2 items-center flex-wrap pt-1">
              {#each colorOptions as c}
                <button
                  type="button"
                  class="w-7 h-7 rounded border-2 border-nb-black cursor-pointer shadow-nb-xs transition-transform {c.bgClass} {selectedColor === c.value ? 'scale-115 ring-2 ring-nb-black' : 'hover:scale-105'}"
                  onclick={() => (selectedColor = c.value)}
                  title={c.label}
                  aria-label="Pilih warna {c.label}"
                ></button>
              {/each}
            </div>
          </div>
        </div>

        <!-- PIC Details -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 border-2 border-nb-black p-3 bg-nb-yellow/20 rounded">
          <div class="flex flex-col gap-1.5">
            <label for="edit-pic" class="font-extrabold text-xs uppercase tracking-wide">
              {$i18nStore.t('modal.picLabel')}
            </label>
            <input
              id="edit-pic"
              type="text"
              bind:value={picName}
              placeholder={$i18nStore.t('modal.picPlaceholder')}
              class="nb-input w-full p-2.5 text-sm bg-white"
              required
              data-testid="input-edit-app-pic"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="edit-wa" class="font-extrabold text-xs uppercase tracking-wide">
              {$i18nStore.t('modal.waLabel')}
            </label>
            <input
              id="edit-wa"
              type="text"
              bind:value={picWhatsapp}
              placeholder={$i18nStore.t('modal.waPlaceholder')}
              class="nb-input w-full p-2.5 text-sm bg-white font-mono"
              required
              data-testid="input-edit-app-wa"
            />
          </div>
        </div>

        <!-- Modal Actions -->
        <div class="flex items-center justify-end gap-3 pt-3 border-t-2 border-dashed border-gray-300">
          <button
            type="button"
            class="nb-btn bg-gray-200 hover:bg-gray-300 text-xs px-4 py-2 text-black"
            onclick={handleClose}
            data-testid="btn-cancel-edit-app"
          >
            {$i18nStore.t('action.cancel')}
          </button>

          <button
            type="submit"
            class="nb-btn bg-nb-blue text-xs px-5 py-2 font-black shadow-nb-sm text-black"
            data-testid="btn-submit-edit-app"
          >
            💾 {$i18nStore.t('modal.saveEdit')}
          </button>
        </div>
      </form>
      {/if}
    </div>
  </div>
{/if}

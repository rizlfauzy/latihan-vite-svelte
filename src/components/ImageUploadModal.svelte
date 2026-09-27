<script lang="ts">
  import { alertStore } from '@/stores/alertStore';
  import { i18nStore } from '@/stores/i18nStore';
  import { env } from '@/lib/env';

  interface ImageItem {
    id: string;
    url: string;
    file: File | null;
    name: string;
    size?: number;
  }

  interface Props {
    isOpen: boolean;
    initialImageUrls?: string[] | null;
    initialImageUrl?: string | null;
    title?: string;
    onClose: () => void;
    onSave: (urls: string[], files: File[]) => void | Promise<void>;
    onRemove?: () => void;
  }

  let {
    isOpen = $bindable(false),
    initialImageUrls = null,
    initialImageUrl = null,
    title,
    onClose,
    onSave,
    onRemove,
  }: Props = $props();

  const t = $derived((key: string, defaultValue: string = ''): string => $i18nStore.t(key, defaultValue));

  let items = $state<ImageItem[]>([]);
  let activeIndex = $state(0);
  let isDragging = $state(false);
  let isFullPreview = $state(false);
  let fileInputEl = $state<HTMLInputElement | null>(null);

  const activeItem = $derived(items[activeIndex] || null);
  const previewUrl = $derived(activeItem?.url || '');
  const selectedFile = $derived(activeItem?.file || null);

  $effect(() => {
    if (isOpen) {
      const initialList: ImageItem[] = [];
      const sources: string[] = [];
      if (Array.isArray(initialImageUrls) && initialImageUrls.length > 0) {
        sources.push(...initialImageUrls);
      } else if (initialImageUrl) {
        sources.push(initialImageUrl);
      }

      sources.forEach((url, idx) => {
        initialList.push({
          id: `initial-${idx}-${Date.now()}`,
          url,
          file: null,
          name: `Gambar ${idx + 1}`,
        });
      });

      items = initialList;
      activeIndex = 0;
      isDragging = false;
      isFullPreview = false;
    }
  });

  function validateAndProcessFiles(files: FileList | File[]) {
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'svg'];
    const maxMb = env.maxImageSizeMb || 5;
    const MAX_SIZE = maxMb * 1024 * 1024;

    const newItems: ImageItem[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = file.name.split('.').pop()?.toLowerCase();

      if (!ext || !allowedExtensions.includes(ext)) {
        alertStore.throwAlert(
          new Error(t('imageModal.errFormat', 'Ekstensi file tidak valid! Hanya diperbolehkan jpg, jpeg, png, dan svg.'))
        );
        continue;
      }

      if (file.size > MAX_SIZE) {
        alertStore.throwAlert(
          new Error(t('imageModal.errSize', `Ukuran file terlalu besar! Maksimal ${maxMb} MB.`))
        );
        continue;
      }

      newItems.push({
        id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        url: URL.createObjectURL(file),
        file,
        name: file.name,
        size: file.size,
      });
    }

    if (newItems.length > 0) {
      const prevLength = items.length;
      items = [...items, ...newItems];
      activeIndex = prevLength;
    }
  }

  function handleFileInputChange(e: Event) {
    const target = e.target as HTMLInputElement;
    if (target.files && target.files.length > 0) {
      validateAndProcessFiles(target.files);
    }
    if (fileInputEl) fileInputEl.value = '';
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault();
    isDragging = true;
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    isDragging = false;
    if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndProcessFiles(e.dataTransfer.files);
    }
  }

  async function handleSave() {
    if (items.length > 0) {
      const allUrls = items.map((item) => item.url);
      const newFiles = items.filter((item): item is ImageItem & { file: File } => Boolean(item.file)).map((item) => item.file);
      await onSave(allUrls, newFiles);
    } else {
      if (onRemove) {
        onRemove();
      }
    }
    onClose();
  }

  function removeItem(index: number) {
    const updated = items.filter((_, idx) => idx !== index);
    items = updated;
    if (activeIndex >= updated.length) {
      activeIndex = Math.max(0, updated.length - 1);
    }
    if (updated.length === 0 && onRemove) {
      onRemove();
    }
  }

  function handleRemoveAll() {
    items = [];
    activeIndex = 0;
    if (fileInputEl) fileInputEl.value = '';
    if (onRemove) {
      onRemove();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      if (isFullPreview) {
        isFullPreview = false;
      } else {
        onClose();
      }
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-nb-black/60 backdrop-blur-xs transition-opacity"
    onclick={handleBackdropClick}
    role="presentation"
    data-testid="image-upload-backdrop"
  >
    <!-- Modal Card -->
    <div
      class="nb-card max-w-xl w-full bg-nb-surface text-nb-black p-6 relative flex flex-col gap-4 shadow-nb-lg border-3 border-nb-black animate-in fade-in zoom-in-95 max-h-[92vh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="image-modal-title"
      data-testid="image-upload-modal"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between gap-3 border-b-2 border-nb-black pb-3">
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 rounded bg-nb-yellow border-2 border-nb-black shadow-nb-xs flex items-center justify-center text-base font-black text-black">
            🖼️
          </span>
          <div>
            <h2 id="image-modal-title" class="text-base font-black uppercase text-nb-black m-0" data-testid="image-modal-title">
              {title || t('imageModal.title', 'UPLOAD & PREVIEW GAMBAR')}
            </h2>
            <p class="text-xs font-bold text-gray-500 m-0">
              {t('imageModal.formatNotice', `Maksimal ${env.maxImageSizeMb || 5} MB per gambar (Hanya .jpg, .jpeg, .png, dan .svg)`)}
            </p>
          </div>
        </div>

        <button
          type="button"
          class="w-7 h-7 border-2 border-nb-black bg-gray-100 hover:bg-nb-yellow rounded flex items-center justify-center font-bold text-xs cursor-pointer shadow-nb-xs transition-all"
          onclick={onClose}
          aria-label="Tutup modal"
          data-testid="btn-close-image-modal"
        >
          ✕
        </button>
      </div>

      <!-- Drag & Drop Zone -->
      <div
        class="border-3 border-dashed rounded-lg p-5 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-all duration-150 {isDragging
          ? 'border-nb-blue bg-blue-50 scale-[1.01]'
          : 'border-nb-black bg-gray-50 hover:bg-yellow-50/50'}"
        ondragover={handleDragOver}
        ondragleave={handleDragLeave}
        ondrop={handleDrop}
        onclick={() => fileInputEl?.click()}
        onkeydown={(e) => { if (e.key === 'Enter' || e.key === ' ') fileInputEl?.click(); }}
        tabindex="0"
        role="button"
        aria-label="Area drag and drop upload gambar"
        data-testid="image-dropzone"
      >
        <span class="text-3xl select-none">📁</span>
        <div class="flex flex-col gap-0.5 select-none">
          <span class="text-sm font-black text-nb-black">
            {t('imageModal.dropzoneTitle', 'Tarik & Lepas gambar di sini')}
          </span>
          <span class="text-xs font-semibold text-gray-500">
            {t('imageModal.dropzoneSub', 'atau klik untuk memilih file dari komputer (bisa pilih banyak)')}
          </span>
        </div>

        <input
          bind:this={fileInputEl}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.svg,image/jpeg,image/png,image/svg+xml"
          class="hidden"
          onchange={handleFileInputChange}
          data-testid="image-file-input"
        />
      </div>

      <!-- Image Preview Section (with Gallery & Click to Preview feature) -->
      {#if items.length > 0 && activeItem}
        <div class="flex flex-col gap-3 p-3 bg-white border-2 border-nb-black rounded shadow-nb-xs" data-testid="preview-container">
          <div class="flex items-center justify-between">
            <span class="text-xs font-black uppercase text-nb-black flex items-center gap-1.5">
              <span>{t('imageModal.previewTitle', 'Pratinjau Gambar:')}</span>
              <span class="px-1.5 py-0.2 bg-nb-yellow border border-nb-black rounded text-[10px] font-black">
                {activeIndex + 1} / {items.length}
              </span>
            </span>
            <span class="text-[11px] font-bold text-gray-500 flex items-center gap-1">
              <span>🔍</span>
              <span>{t('imageModal.clickToPreview', 'Klik gambar untuk melihat ukuran penuh')}</span>
            </span>
          </div>

          <!-- Main Active Preview -->
          <div class="relative group flex items-center justify-center bg-gray-100 border-2 border-nb-black rounded overflow-hidden max-h-56">
            <button
              type="button"
              class="w-full h-full flex items-center justify-center p-1 cursor-pointer bg-transparent border-none"
              onclick={() => (isFullPreview = true)}
              title={t('imageModal.clickToPreview', 'Klik gambar untuk melihat ukuran penuh')}
              data-testid="btn-trigger-full-preview"
            >
              <img
                src={previewUrl}
                alt="Preview Lampiran"
                class="max-h-52 w-auto object-contain rounded transition-transform duration-150 group-hover:scale-[1.02]"
                data-testid="image-preview"
              />
            </button>
          </div>

          <!-- Thumbnails Row (if multiple images) -->
          {#if items.length > 1}
            <div class="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5" data-testid="image-thumbnails-list">
              {#each items as item, idx}
                <div class="relative shrink-0 group">
                  <button
                    type="button"
                    class="w-14 h-14 rounded border-2 p-0.5 cursor-pointer overflow-hidden transition-all bg-gray-50 {activeIndex === idx
                      ? 'border-nb-black shadow-nb-xs ring-2 ring-nb-yellow'
                      : 'border-gray-300 opacity-70 hover:opacity-100'}"
                    onclick={() => (activeIndex = idx)}
                    data-testid={`thumb-item-${idx}`}
                  >
                    <img src={item.url} alt={item.name} class="w-full h-full object-cover rounded-xs" />
                  </button>
                  <button
                    type="button"
                    class="absolute -top-1.5 -right-1.5 w-4 h-4 bg-nb-red text-white text-[9px] font-black rounded-full border border-nb-black flex items-center justify-center cursor-pointer shadow-nb-xs hover:scale-110"
                    onclick={(e) => { e.stopPropagation(); removeItem(idx); }}
                    title="Hapus foto ini"
                    data-testid={`btn-remove-thumb-${idx}`}
                  >
                    ✕
                  </button>
                </div>
              {/each}
            </div>
          {/if}

          <!-- File Info & Actions -->
          <div class="flex items-center justify-between text-[11px] font-semibold text-gray-600 px-1">
            {#if selectedFile}
              <span class="truncate max-w-60" title={selectedFile.name}>
                📄 {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </span>
            {:else}
              <span class="truncate max-w-60">🔗 {activeItem.name || 'Gambar tersimpan'}</span>
            {/if}

            <div class="flex items-center gap-3">
              <button
                type="button"
                class="text-nb-red hover:underline font-bold cursor-pointer text-xs flex items-center gap-1"
                onclick={() => removeItem(activeIndex)}
                data-testid="btn-remove-image-upload"
              >
                <span>🗑️</span>
                <span>{t('imageModal.removeButton', 'HAPUS GAMBAR')}</span>
              </button>

              {#if items.length > 1}
                <button
                  type="button"
                  class="text-gray-500 hover:text-nb-red hover:underline font-bold cursor-pointer text-xs"
                  onclick={handleRemoveAll}
                  data-testid="btn-remove-all-images"
                >
                  {t('imageModal.removeAllButton', 'HAPUS SEMUA')}
                </button>
              {/if}
            </div>
          </div>
        </div>
      {/if}

      <!-- Modal Actions -->
      <div class="flex items-center justify-end gap-3 pt-3 border-t-2 border-dashed border-gray-300">
        <button
          type="button"
          class="nb-btn bg-gray-200 hover:bg-gray-300 text-xs px-4 py-2 text-black cursor-pointer shadow-nb-xs"
          onclick={onClose}
          data-testid="btn-cancel-image-upload"
        >
          {t('imageModal.cancelButton', 'BATAL')}
        </button>

        <button
          type="button"
          class="nb-btn bg-nb-yellow hover:bg-yellow-400 text-black text-xs px-5 py-2 font-black shadow-nb-sm border-2 border-nb-black cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={items.length === 0}
          onclick={handleSave}
          data-testid="btn-save-image-upload"
        >
          {t('imageModal.saveButton', 'GUNAKAN GAMBAR')}
        </button>
      </div>
    </div>
  </div>

  <!-- Full-Size Image Preview Overlay (Click to Preview Modal) -->
  {#if isFullPreview && previewUrl}
    <div
      class="fixed inset-0 z-60 flex items-center justify-center p-4 bg-nb-black/85 backdrop-blur-sm animate-in fade-in"
      onclick={() => (isFullPreview = false)}
      role="presentation"
      data-testid="full-image-preview-overlay"
    >
      <div
        class="relative max-w-4xl max-h-[90vh] bg-white p-3 border-3 border-nb-black rounded-lg shadow-nb-lg flex flex-col gap-2 items-center"
        role="dialog"
        aria-modal="true"
        aria-label="Full-resolution Preview"
        onclick={(e) => e.stopPropagation()}
        onkeydown={(e) => { if (e.key === 'Escape') isFullPreview = false; }}
        tabindex="-1"
      >
        <div class="w-full flex justify-between items-center pb-2 border-b-2 border-nb-black">
          <span class="text-xs font-black uppercase text-nb-black flex items-center gap-1.5">
            <span>🔍</span>
            <span>Pratinjau Penuh Gambar ({activeIndex + 1}/{items.length})</span>
          </span>
          <button
            type="button"
            class="w-7 h-7 border-2 border-nb-black bg-nb-red text-white hover:bg-red-600 rounded flex items-center justify-center font-bold text-xs cursor-pointer shadow-nb-xs"
            onclick={() => (isFullPreview = false)}
            aria-label="Tutup pratinjau penuh"
            data-testid="btn-close-full-preview"
          >
            ✕
          </button>
        </div>

        <div class="overflow-auto max-h-[75vh] max-w-full flex items-center justify-center p-2 bg-gray-50 border-2 border-dashed border-gray-300 rounded">
          <img
            src={previewUrl}
            alt="Full Resolution Preview"
            class="max-w-full max-h-[70vh] object-contain rounded shadow-nb-sm"
            data-testid="full-image-preview"
          />
        </div>
      </div>
    </div>
  {/if}
{/if}

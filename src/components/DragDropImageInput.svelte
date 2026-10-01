<script lang="ts">
  import { appStore } from '@/stores/appStore';
  import { alertStore } from '@/stores/alertStore';
  import { i18nStore } from '@/stores/i18nStore';
  import { env } from '@/lib/env';

  let {
    label,
    description = '',
    imageUrl = null,
    allowedExtensions = ['jpg', 'jpeg', 'png', 'svg'],
    aspectRatio = 'square',
    subfolder = 'apps',
    inputId,
    testIdPrefix = 'app-image',
    fallbackNotice = '',
    onUpload,
    onRemove,
  }: {
    label: string;
    description?: string;
    imageUrl?: string | null;
    allowedExtensions?: string[];
    aspectRatio?: 'square' | 'banner';
    subfolder?: string;
    inputId: string;
    testIdPrefix?: string;
    fallbackNotice?: string;
    onUpload: (url: string) => void;
    onRemove: () => void;
  } = $props();

  const t = $derived((key: string, defaultValue: string = ''): string => $i18nStore.t(key, defaultValue));

  let isDragging = $state(false);
  let isUploading = $state(false);
  let fileInputRef = $state<HTMLInputElement | null>(null);

  const allowedStr = $derived(allowedExtensions.map((e) => `.${e}`).join(','));

  async function processFile(file: File) {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      alertStore.showError(
        t('imageModal.errFormat', `Ekstensi file tidak didukung! Hanya ${allowedExtensions.join(', ')} yang diperbolehkan.`)
      );
      if (fileInputRef) fileInputRef.value = '';
      return;
    }

    const maxMb = env.maxImageSizeMb || 5;
    if (file.size > maxMb * 1024 * 1024) {
      alertStore.showError(
        t('imageModal.errSize', `Ukuran file melebihi batas maksimal ${maxMb} MB!`)
      );
      if (fileInputRef) fileInputRef.value = '';
      return;
    }

    isUploading = true;
    try {
      const url = await appStore.uploadAppImage(file, {
        allowedExtensions,
        subfolder,
      });
      onUpload(url);
    } catch (err: any) {
      alertStore.showError(err?.message || 'Gagal mengupload gambar');
    } finally {
      isUploading = false;
      if (fileInputRef) fileInputRef.value = '';
    }
  }

  function handleFileChange(e: Event) {
    const target = e.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      processFile(file);
    }
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
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      processFile(file);
    }
  }
</script>

<div
  class="flex flex-col gap-2 p-3 border-2 border-nb-black bg-gray-50 rounded-md transition-all {isDragging ? 'bg-yellow-100 ring-2 ring-nb-black' : ''}"
  ondragover={handleDragOver}
  ondragleave={handleDragLeave}
  ondrop={handleDrop}
  role="region"
  aria-label={label}
  data-testid={`dropzone-${testIdPrefix}`}
>
  <div class="flex items-center justify-between">
    <span class="uppercase text-[11px] font-black text-gray-700">{label}</span>
    {#if imageUrl}
      <button
        type="button"
        class="text-[11px] text-red-600 hover:underline font-black cursor-pointer"
        onclick={onRemove}
        data-testid={`btn-remove-${testIdPrefix}`}
      >
        {t('modal.removeImage', '✕ Hapus Gambar')}
      </button>
    {/if}
  </div>

  {#if imageUrl}
    <div class="flex items-center gap-3">
      <div
        class="border-2 border-nb-black rounded bg-white overflow-hidden shadow-nb-sm shrink-0 {aspectRatio === 'banner' ? 'w-28 h-14' : 'w-14 h-14'}"
      >
        <img
          src={imageUrl}
          alt="Preview"
          class="w-full h-full object-cover"
          data-testid={`preview-${testIdPrefix}`}
        />
      </div>
      <div class="text-[11px] text-gray-600 grow">
        <p class="font-bold text-green-700 m-0">{t('modal.imageAttached', '✓ Gambar terpasang')}</p>
        {#if description}
          <p class="m-0 text-gray-500">{description}</p>
        {/if}
        <div class="mt-1 flex items-center gap-2">
          <input
            type="file"
            accept={allowedStr}
            bind:this={fileInputRef}
            onchange={handleFileChange}
            class="hidden"
            id={`${inputId}-replace`}
            data-testid={`input-${testIdPrefix}-replace`}
          />
          <label
            for={`${inputId}-replace`}
            class="nb-btn bg-white hover:bg-nb-yellow text-[10px] px-2 py-1 border-2 border-nb-black cursor-pointer inline-block text-black font-bold"
          >
            <span>{isUploading ? t('modal.uploading', 'Mengunggah...') : t('modal.replaceImage', '🔄 Ganti Gambar')}</span>
          </label>
        </div>
      </div>
    </div>
  {:else}
    <div class="flex flex-col gap-2">
      <div class="flex items-center gap-2 flex-wrap">
        <input
          type="file"
          accept={allowedStr}
          bind:this={fileInputRef}
          onchange={handleFileChange}
          class="hidden"
          id={inputId}
          data-testid={`input-${testIdPrefix}`}
        />
        <label
          for={inputId}
          class="nb-btn bg-white hover:bg-nb-yellow text-xs px-3 py-1.5 border-2 border-nb-black flex items-center gap-1.5 cursor-pointer text-black"
          data-testid={`btn-upload-${testIdPrefix}`}
        >
          <span>📷</span>
          <span>
            {isUploading
              ? t('modal.uploading', 'Mengunggah...')
              : t('modal.chooseImage', 'Pilih Gambar (Maks 5 MB)')}
          </span>
        </label>
        <span class="text-[11px] text-gray-500 font-medium">
          {t('modal.dragDropHint', 'atau drag & drop file ke sini')}
        </span>
      </div>

      {#if fallbackNotice}
        <span class="text-[11px] text-gray-500 font-medium">
          {fallbackNotice}
        </span>
      {/if}
    </div>
  {/if}
</div>

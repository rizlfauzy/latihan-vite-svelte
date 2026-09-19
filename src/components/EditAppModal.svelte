<script lang="ts">
  import { appStore } from '../stores/appStore';
  import type { AppItem } from '../data/apps';

  let {
    isOpen = $bindable(false),
    app,
    onClose,
  }: {
    isOpen: boolean;
    app: AppItem;
    onClose?: () => void;
  } = $props();

  let name = $state('');
  let url = $state('');
  let description = $state('');
  let category = $state('Productivity');
  let icon = $state('🚀');
  let selectedColor = $state('yellow');
  let picName = $state('');
  let picWhatsapp = $state('');
  let errorMessage = $state('');

  const colorOptions = [
    { label: 'Yellow', value: 'yellow', cssVar: 'var(--color-nb-yellow)', bgClass: 'bg-nb-yellow' },
    { label: 'Green', value: 'green', cssVar: 'var(--color-nb-green)', bgClass: 'bg-nb-green' },
    { label: 'Blue', value: 'blue', cssVar: 'var(--color-nb-blue)', bgClass: 'bg-nb-blue' },
    { label: 'Pink', value: 'pink', cssVar: 'var(--color-nb-pink)', bgClass: 'bg-nb-pink' },
    { label: 'Purple', value: 'purple', cssVar: 'var(--color-nb-purple)', bgClass: 'bg-nb-purple' },
    { label: 'Orange', value: 'orange', cssVar: 'var(--color-nb-orange)', bgClass: 'bg-nb-orange' },
  ];

  const quickIcons = ['🚀', '⚡', '📊', '💼', '🛠️', '🔒', '👥', '💡', '📝', '🌐'];

  $effect(() => {
    if (isOpen && app) {
      name = app.name || '';
      url = app.url || '';
      description = app.description || '';
      category = app.category || 'Productivity';
      icon = app.icon || '🚀';
      picName = app.picName || '';
      picWhatsapp = app.picWhatsapp || '';
      errorMessage = '';

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

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    errorMessage = '';

    if (!name.trim()) {
      errorMessage = 'Nama aplikasi wajib diisi!';
      return;
    }

    if (!url.trim()) {
      errorMessage = 'URL aplikasi wajib diisi!';
      return;
    }

    if (!picName.trim()) {
      errorMessage = 'Nama PIC wajib diisi!';
      return;
    }

    const cleanedWa = picWhatsapp.replace(/\D/g, '');
    if (!cleanedWa) {
      errorMessage = 'Nomor WhatsApp PIC wajib diisi!';
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
      icon: icon.trim() || '⚡',
      color: resolvedColor,
      picName: picName.trim(),
      picWhatsapp: cleanedWa,
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
      class="nb-card max-w-xl w-full bg-white p-5 sm:p-6 my-8 relative flex flex-col gap-5 shadow-nb-lg border-3 border-nb-black animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-app-title"
      data-testid="edit-app-modal"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between gap-3 border-b-2 border-nb-black pb-3">
        <div class="inline-flex items-center gap-2 bg-nb-blue px-3 py-1 border-2 border-nb-black rounded font-black text-sm uppercase">
          <span>✏️</span>
          <span id="edit-app-title">EDIT APLIKASI (DEBUG MODE)</span>
        </div>

        <button
          type="button"
          class="w-8 h-8 border-2 border-nb-black bg-gray-100 hover:bg-nb-yellow rounded flex items-center justify-center font-bold text-sm cursor-pointer shadow-nb-xs transition-all"
          onclick={handleClose}
          aria-label="Tutup form edit"
          data-testid="btn-close-edit-app"
        >
          ✕
        </button>
      </div>

      <!-- Error Message Banner -->
      {#if errorMessage}
        <div class="nb-card bg-[#ff4757] text-white p-3 border-2 border-nb-black text-xs font-black flex items-center gap-2">
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      {/if}

      <!-- Form Body -->
      <form onsubmit={handleSubmit} class="flex flex-col gap-4 text-nb-black">
        <!-- App Name -->
        <div class="flex flex-col gap-1.5">
          <label for="edit-name" class="font-extrabold text-xs uppercase tracking-wide">
            Nama Aplikasi <span class="text-red-500">*</span>
          </label>
          <input
            id="edit-name"
            type="text"
            bind:value={name}
            placeholder="Contoh: Super Analytics"
            class="nb-input w-full p-2.5 text-sm"
            required
            data-testid="input-edit-app-name"
          />
        </div>

        <!-- URL & Category -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div class="flex flex-col gap-1.5">
            <label for="edit-url" class="font-extrabold text-xs uppercase tracking-wide">
              URL Aplikasi <span class="text-red-500">*</span>
            </label>
            <input
              id="edit-url"
              type="url"
              bind:value={url}
              placeholder="https://app.domain.com"
              class="nb-input w-full p-2.5 text-sm"
              required
              data-testid="input-edit-app-url"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="edit-category" class="font-extrabold text-xs uppercase tracking-wide">
              Kategori
            </label>
            <select
              id="edit-category"
              bind:value={category}
              class="nb-input w-full p-2.5 text-sm bg-white"
              data-testid="select-edit-app-category"
            >
              <option value="Productivity">Productivity</option>
              <option value="Portfolio">Portfolio</option>
              <option value="Utility">Utility</option>
              <option value="Finance">Finance</option>
              <option value="Writing">Writing</option>
              <option value="DevTools">DevTools</option>
              <option value="General">General</option>
            </select>
          </div>
        </div>

        <!-- Description -->
        <div class="flex flex-col gap-1.5">
          <label for="edit-desc" class="font-extrabold text-xs uppercase tracking-wide">
            Deskripsi Singkat
          </label>
          <textarea
            id="edit-desc"
            bind:value={description}
            rows="2"
            placeholder="Keterangan singkat fungsi aplikasi..."
            class="nb-input w-full p-2.5 text-sm resize-none"
            data-testid="input-edit-app-desc"
          ></textarea>
        </div>

        <!-- Icon Picker & Color Theme -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 border-2 border-nb-black p-3 bg-gray-50 rounded">
          <!-- Icon -->
          <div class="flex flex-col gap-1.5">
            <label for="edit-icon" class="font-extrabold text-xs uppercase tracking-wide">
              Icon Emoji
            </label>
            <div class="flex items-center gap-2">
              <input
                id="edit-icon"
                type="text"
                bind:value={icon}
                maxlength="2"
                class="nb-input w-12 text-center p-2 text-lg"
                data-testid="input-edit-app-icon"
              />
              <div class="flex gap-1 flex-wrap">
                {#each quickIcons.slice(0, 5) as emoji}
                  <button
                    type="button"
                    class="w-7 h-7 border-2 border-nb-black bg-white hover:bg-nb-yellow rounded text-xs flex items-center justify-center cursor-pointer transition-all"
                    onclick={() => (icon = emoji)}
                  >
                    {emoji}
                  </button>
                {/each}
              </div>
            </div>
          </div>

          <!-- Color -->
          <div class="flex flex-col gap-1.5">
            <span class="font-extrabold text-xs uppercase tracking-wide">Warna Tema</span>
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
              Nama PIC <span class="text-red-500">*</span>
            </label>
            <input
              id="edit-pic"
              type="text"
              bind:value={picName}
              placeholder="Contoh: Rizal Fauzi"
              class="nb-input w-full p-2.5 text-sm bg-white"
              required
              data-testid="input-edit-app-pic"
            />
          </div>

          <div class="flex flex-col gap-1.5">
            <label for="edit-wa" class="font-extrabold text-xs uppercase tracking-wide">
              WhatsApp PIC <span class="text-red-500">*</span>
            </label>
            <input
              id="edit-wa"
              type="text"
              bind:value={picWhatsapp}
              placeholder="Contoh: 6281234567890"
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
            class="nb-btn bg-gray-200 hover:bg-gray-300 text-xs px-4 py-2"
            onclick={handleClose}
            data-testid="btn-cancel-edit-app"
          >
            BATAL
          </button>

          <button
            type="submit"
            class="nb-btn bg-nb-blue text-xs px-5 py-2 font-black shadow-nb-sm"
            data-testid="btn-submit-edit-app"
          >
            💾 SIMPAN PERUBAHAN
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<script lang="ts">
  import type { AppItem } from '@/data/apps';
  import { env } from '@/lib/env';
  import { i18nStore } from '@/stores/i18nStore';

  let {
    app,
    isSelected = false,
    onToggleSelect,
    onEdit,
    onDelete,
  }: {
    app: AppItem;
    isSelected?: boolean;
    onToggleSelect?: (app: AppItem) => void;
    onEdit?: (app: AppItem) => void;
    onDelete?: (app: AppItem) => void;
  } = $props();

  const waMessage = $derived(
    encodeURIComponent(`Halo ${app.picName}, saya ingin bertanya dan konsultasi mengenai aplikasi "${app.name}" di Portal Aplikasi Perusahaan.`)
  );
  const waUrl = $derived(`https://wa.me/${app.picWhatsapp}?text=${waMessage}`);
</script>

<div
  class="nb-card nb-card-interactive group flex flex-col justify-between gap-4 bg-nb-surface text-nb-black relative {isSelected ? 'ring-3 ring-nb-black bg-yellow-50 dark:bg-yellow-950/20' : ''}"
  data-testid="app-card-{app.id}"
>
  <div class="flex items-center justify-between gap-2.5">
    <div class="flex items-center gap-2.5">
      {#if env.enableDebug}
        <label class="cursor-pointer flex items-center justify-center m-0" title="Pilih aplikasi">
          <input
            type="checkbox"
            checked={isSelected}
            onchange={() => onToggleSelect?.(app)}
            class="w-5 h-5 border-2 border-nb-black rounded bg-white accent-nb-black cursor-pointer shadow-nb-xs focus:outline-none transition-transform hover:scale-105"
            data-testid="checkbox-select-app-{app.id}"
            aria-label={`Pilih aplikasi ${app.name}`}
          />
        </label>
      {/if}

      <div
        class="w-12 h-12 border-2 border-nb-black rounded-md shadow-nb-sm flex items-center justify-center"
        style="background: {app.color};"
      >
        <span class="text-2xl leading-none">{app.icon}</span>
      </div>
    </div>

    <div class="flex items-center gap-1.5">
      <span class="nb-badge text-black" style="background: {app.color};">
        {app.category}
      </span>

      {#if env.enableDebug}
        <button
          type="button"
          class="nb-btn bg-nb-blue hover:bg-blue-400 text-xs px-2 py-1 flex items-center justify-center font-black transition-all cursor-pointer"
          onclick={() => onEdit?.(app)}
          title={$i18nStore.t('grid.editTooltip')}
          data-testid="btn-edit-app-{app.id}"
        >
          ✏️
        </button>

        <button
          type="button"
          class="nb-btn bg-red-400 hover:bg-red-500 text-xs px-2 py-1 flex items-center justify-center font-black transition-all cursor-pointer"
          onclick={() => onDelete?.(app)}
          title={$i18nStore.t('grid.deleteTooltip')}
          data-testid="btn-delete-app-{app.id}"
        >
          🗑️
        </button>
      {/if}
    </div>
  </div>

  <div class="flex flex-col gap-2 grow">
    <h3 class="text-xl font-extrabold m-0">{app.name}</h3>
    <p class="text-sm text-gray-600 font-medium leading-relaxed m-0">{app.description}</p>
  </div>

  <!-- PIC & WhatsApp Contact Info -->
  <div class="p-2.5 bg-gray-50 border-2 border-nb-black rounded-md shadow-nb-sm flex flex-col gap-2">
    <div class="flex items-center justify-between text-xs font-bold text-gray-700">
      <span>{$i18nStore.t('grid.pic')} <span class="text-nb-black">{app.picName}</span></span>
    </div>
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      class="nb-btn bg-nb-wa text-white text-xs px-3 py-1.5 shadow-nb-sm border-2 border-nb-black flex items-center justify-center gap-1.5 font-extrabold tracking-normal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-nb-md transition-all"
    >
      <span>💬</span>
      <span>{$i18nStore.t('grid.contactPic')}</span>
    </a>
  </div>

  <div class="pt-3 border-t-2 border-dashed border-gray-200 flex items-center justify-between">
    <a
      href={app.url}
      target="_blank"
      rel="noopener noreferrer"
      class="nb-btn bg-nb-yellow text-xs px-4 py-2 w-full flex items-center justify-center gap-1.5 font-mono font-extrabold text-black"
    >
      <span>{$i18nStore.t('grid.openApp')}</span>
      <span class="text-base transition-transform duration-150 group-hover:translate-x-1 group-hover:-translate-y-1">
        ↗
      </span>
    </a>
  </div>
</div>

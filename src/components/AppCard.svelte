<script lang="ts">
  import type { AppItem } from '@/data/apps';
  import { i18nStore } from '@/stores/i18nStore';
  import { authStore } from '@/stores/authStore';
  import AppIcon from '@/components/AppIcon.svelte';
  import defaultHeroImage from '@/assets/default-app-hero.svg';
  import { GripVertical } from '@lucide/svelte';

  let {
    app,
    isSelected = false,
    isDraggingThis = false,
    isDragOverThis = false,
    onToggleSelect,
    onEdit,
    onDelete,
    onContactPic,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
  }: {
    app: AppItem;
    isSelected?: boolean;
    isDraggingThis?: boolean;
    isDragOverThis?: boolean;
    onToggleSelect?: (app: AppItem) => void;
    onEdit?: (app: AppItem) => void;
    onDelete?: (app: AppItem) => void;
    onContactPic?: (app: AppItem) => void;
    onDragStart?: (app: AppItem, e: DragEvent) => void;
    onDragOver?: (app: AppItem, e: DragEvent) => void;
    onDragLeave?: (app: AppItem, e: DragEvent) => void;
    onDrop?: (app: AppItem, e: DragEvent) => void;
    onDragEnd?: (app: AppItem, e: DragEvent) => void;
  } = $props();

  let canManageApps = $derived($authStore.hasDebugAccess);
  const t = $derived((key: string, defaultValue: string = ''): string => $i18nStore.t(key, defaultValue));

  let isDragReady = $state(false);
  let longPressTimer: any = null;

  function handlePointerDown(e: PointerEvent) {
    if (!canManageApps) return;
    if ((e.target as HTMLElement).closest('button, input, a, label')) return;

    // Tekan lama 150ms untuk mengaktifkan drag mode
    longPressTimer = setTimeout(() => {
      isDragReady = true;
    }, 150);
  }

  function handlePointerUp() {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      longPressTimer = null;
    }
  }

  function handleDragStartInternal(e: DragEvent) {
    if (!canManageApps) {
      e.preventDefault();
      return;
    }
    onDragStart?.(app, e);
  }

  function handleDragEndInternal(e: DragEvent) {
    isDragReady = false;
    onDragEnd?.(app, e);
  }
</script>

<div
  role="article"
  class="nb-card nb-card-interactive group flex flex-col justify-between gap-3 bg-nb-surface text-nb-black relative transition-all
    {isSelected ? 'ring-3 ring-nb-black bg-yellow-50 dark:bg-yellow-950/20' : ''}
    {isDragReady ? 'ring-4 ring-nb-yellow shadow-nb-lg scale-[1.01] cursor-grab active:cursor-grabbing' : ''}
    {isDraggingThis ? 'opacity-40 border-dashed scale-95' : ''}
    {isDragOverThis ? 'border-nb-blue ring-4 ring-nb-blue bg-blue-50' : ''}"
  draggable={canManageApps && isDragReady}
  onpointerdown={handlePointerDown}
  onpointerup={handlePointerUp}
  onpointercancel={handlePointerUp}
  ondragstart={handleDragStartInternal}
  ondragend={handleDragEndInternal}
  ondragover={(e) => { e.preventDefault(); onDragOver?.(app, e); }}
  ondragleave={(e) => { onDragLeave?.(app, e); }}
  ondrop={(e) => { e.preventDefault(); onDrop?.(app, e); }}
  data-testid="app-card-{app.id}"
  data-drag-ready={isDragReady ? 'true' : 'false'}
>
  <!-- Hero Banner Image -->
  <div
    class="w-full h-32 border-2 border-nb-black rounded-md overflow-hidden bg-gray-100 relative shadow-nb-xs shrink-0"
    data-testid="app-hero-{app.id}"
  >
    <img
      src={app.heroImageUrl || defaultHeroImage}
      alt={`${app.name} Hero`}
      class="w-full h-full object-cover"
      data-testid="app-hero-image-{app.id}"
      loading="lazy"
    />
  </div>

  <div class="flex items-center justify-between gap-2.5">
    <div class="flex items-center gap-2.5">
      {#if canManageApps}
        <!-- Drag Handle Icon for Admin Mode -->
        <button
          type="button"
          class="cursor-grab active:cursor-grabbing p-1 text-gray-500 hover:text-black transition-colors"
          title={t('grid.dragHandleTooltip', 'Tekan lama card atau drag handle ini untuk mengubah posisi')}
          onpointerdown={() => (isDragReady = true)}
          data-testid="drag-handle-{app.id}"
          aria-label={`Drag to rearrange ${app.name}`}
        >
          <GripVertical size={16} />
        </button>

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
        class="w-12 h-12 border-2 border-nb-black rounded-md shadow-nb-sm flex items-center justify-center overflow-hidden shrink-0"
        style="background: {app.color};"
      >
        {#if app.imageUrl}
          <img
            src={app.imageUrl}
            alt={app.name}
            class="w-full h-full object-cover"
            data-testid="app-image-{app.id}"
          />
        {:else}
          <div class="text-nb-black flex items-center justify-center" data-testid="app-icon-{app.id}">
            <AppIcon name={app.icon} size={24} />
          </div>
        {/if}
      </div>
    </div>

    <div class="flex items-center gap-1.5">
      <span class="nb-badge text-black" style="background: {app.color};">
        {app.category}
      </span>

      {#if canManageApps}
        <button
          type="button"
          class="nb-btn bg-nb-blue hover:bg-blue-400 text-xs px-2 py-1 flex items-center justify-center font-black transition-all cursor-pointer"
          onclick={() => onEdit?.(app)}
          title={t('grid.editTooltip')}
          data-testid="btn-edit-app-{app.id}"
        >
          ✏️
        </button>

        <button
          type="button"
          class="nb-btn bg-red-400 hover:bg-red-500 text-xs px-2 py-1 flex items-center justify-center font-black transition-all cursor-pointer"
          onclick={() => onDelete?.(app)}
          title={t('grid.deleteTooltip')}
          data-testid="btn-delete-app-{app.id}"
        >
          🗑️
        </button>
      {/if}
    </div>
  </div>

  <div class="flex flex-col gap-1.5 grow">
    <h3 class="text-lg sm:text-xl font-extrabold m-0 text-nb-black">{app.name}</h3>
    <p class="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed m-0">{app.description}</p>
  </div>

  <!-- PIC & WhatsApp Contact Info -->
  <div class="p-2.5 bg-gray-50 border-2 border-nb-black rounded-md shadow-nb-sm flex flex-col gap-2">
    <div class="flex items-center justify-between text-xs font-bold text-gray-700">
      <span>{t('grid.pic')} <span class="text-nb-black">{app.picName}</span></span>
    </div>
    <button
      type="button"
      onclick={() => onContactPic?.(app)}
      class="nb-btn bg-nb-wa text-white text-xs px-3 py-1.5 shadow-nb-sm border-2 border-nb-black flex items-center justify-center gap-1.5 font-extrabold tracking-normal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-nb-md transition-all cursor-pointer"
      data-testid="btn-contact-pic-{app.id}"
    >
      <span>💬</span>
      <span>{t('grid.contactPic')}</span>
    </button>
  </div>

  <div class="pt-3 border-t-2 border-dashed border-gray-200 flex items-center justify-between">
    <a
      href={app.url}
      target="_blank"
      rel="noopener noreferrer"
      class="nb-btn text-xs px-4 py-2 w-full flex items-center justify-center gap-1.5 font-mono font-extrabold text-black"
      style="background: {app.color};"
    >
      <span>{t('grid.openApp')}</span>
      <span class="text-base transition-transform duration-150 group-hover:translate-x-1 group-hover:-translate-y-1">
        ↗
      </span>
    </a>
  </div>
</div>

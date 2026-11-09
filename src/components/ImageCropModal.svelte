<script lang="ts">
  import { untrack } from 'svelte';
  import { i18nStore } from '@/stores/i18nStore';

  interface Props {
    isOpen: boolean;
    imageFile?: File | null;
    imageSrc?: string | null;
    aspectRatio?: 'square' | 'banner';
    allowRatioToggle?: boolean;
    title?: string;
    onCrop: (croppedFile: File, previewUrl: string) => void | Promise<void>;
    onCancel: () => void;
  }

  let {
    isOpen = false,
    imageFile = null,
    imageSrc = null,
    aspectRatio = 'square',
    allowRatioToggle = false,
    title,
    onCrop,
    onCancel,
  }: Props = $props();

  const t = $derived((key: string, defaultValue: string = ''): string => $i18nStore.t(key, defaultValue));

  let currentRatio = $state<'square' | 'banner'>('square');
  let zoom = $state(1);
  let naturalWidth = $state(0);
  let naturalHeight = $state(0);

  let containerW = $state(380);
  let containerH = $state(280);

  // Derivasi dimensi frame potong secara reaktif terhadap dimensi container & rasio terpilih
  const frameMetrics = $derived.by(() => {
    const padding = 20;
    const wAvail = Math.max(100, (containerW || 380) - padding * 2);
    const hAvail = Math.max(100, (containerH || 280) - padding * 2);
    const aspect = currentRatio === 'banner' ? 2.0 : 1.0;

    let w: number;
    let h: number;
    if (aspect >= 1) {
      w = Math.min(wAvail, hAvail * aspect);
      h = Math.round(w / aspect);
      if (h > hAvail) {
        h = hAvail;
        w = Math.round(h * aspect);
      }
    } else {
      h = Math.min(hAvail, wAvail / aspect);
      w = Math.round(h * aspect);
    }

    w = Math.round(w);
    h = Math.round(h);
    const left = Math.round(((containerW || 380) - w) / 2);
    const top = Math.round(((containerH || 280) - h) / 2);

    return {
      w,
      h,
      left,
      top,
      right: left + w,
      bottom: top + h,
    };
  });

  // Skala minimum agar gambar selalu menutupi frame (cover)
  const minScale = $derived.by(() => {
    if (naturalWidth === 0 || naturalHeight === 0) return 1;
    return Math.max(frameMetrics.w / naturalWidth, frameMetrics.h / naturalHeight);
  });

  const currentScale = $derived(minScale * zoom);
  const dispW = $derived(Math.round(naturalWidth * currentScale));
  const dispH = $derived(Math.round(naturalHeight * currentScale));

  // Posisi (X, Y) sudut kiri-atas gambar relatif terhadap viewport container (top-0 left-0)
  let posX = $state(70);
  let posY = $state(20);

  let isDragging = $state(false);
  let dragStartX = 0;
  let dragStartY = 0;
  let initPosX = 0;
  let initPosY = 0;

  let activeSrc = $state<string>('');
  let createdBlobUrl = $state<string | null>(null);
  let imgElement = $state<HTMLImageElement | null>(null);
  let isSaving = $state(false);

  function clamp(val: number, min: number, max: number): number {
    return Math.max(min, Math.min(val, max));
  }

  // Posisikan gambar di tengah frame potong
  function centerImage(natW: number = naturalWidth, natH: number = naturalHeight, targetZoom: number = zoom) {
    if (natW === 0 || natH === 0) return;
    const scale = Math.max(frameMetrics.w / natW, frameMetrics.h / natH) * targetZoom;
    const dW = Math.round(natW * scale);
    const dH = Math.round(natH * scale);

    const cx = frameMetrics.left + frameMetrics.w / 2;
    const cy = frameMetrics.top + frameMetrics.h / 2;

    const initialX = Math.round(cx - dW / 2);
    const initialY = Math.round(cy - dH / 2);

    const minX = frameMetrics.right - dW;
    const maxX = frameMetrics.left;
    const minY = frameMetrics.bottom - dH;
    const maxY = frameMetrics.top;

    posX = clamp(initialX, minX, maxX);
    posY = clamp(initialY, minY, maxY);
  }

  function handleImageLoad(e: Event) {
    const target = e.target as HTMLImageElement;
    if (target && target.naturalWidth > 0 && target.naturalHeight > 0) {
      if (naturalWidth !== target.naturalWidth || naturalHeight !== target.naturalHeight) {
        naturalWidth = target.naturalWidth;
        naturalHeight = target.naturalHeight;
        zoom = 1;
        centerImage(target.naturalWidth, target.naturalHeight, 1);
      }
    }
  }

  let wasOpen = false;
  $effect(() => {
    if (isOpen && !wasOpen) {
      wasOpen = true;
      currentRatio = aspectRatio;
      zoom = 1;
      isSaving = false;

      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
        createdBlobUrl = null;
      }

      if (imageFile) {
        const url = URL.createObjectURL(imageFile);
        createdBlobUrl = url;
        activeSrc = url;
      } else if (imageSrc) {
        activeSrc = imageSrc;
      }

      // Deteksi dimensi gambar sumber
      if (activeSrc && typeof window !== 'undefined') {
        const probe = new Image();
        if (activeSrc.startsWith('http')) {
          probe.crossOrigin = 'anonymous';
        }
        probe.onload = () => {
          if (probe.naturalWidth > 0 && probe.naturalHeight > 0) {
            naturalWidth = probe.naturalWidth;
            naturalHeight = probe.naturalHeight;
            zoom = 1;
            centerImage(probe.naturalWidth, probe.naturalHeight, 1);
          }
        };
        probe.src = activeSrc;
      }
    } else if (!isOpen && wasOpen) {
      wasOpen = false;
      if (createdBlobUrl) {
        URL.revokeObjectURL(createdBlobUrl);
        createdBlobUrl = null;
      }
      activeSrc = '';
      naturalWidth = 0;
      naturalHeight = 0;
    }
  });

  // Jaga posisi tetap ter-clamp jika dimensi container atau rasio berubah
  $effect(() => {
    const _w = containerW;
    const _h = containerH;
    const _r = currentRatio;
    untrack(() => {
      if (_w > 0 && _h > 0 && naturalWidth > 0 && naturalHeight > 0) {
        const minX = frameMetrics.right - dispW;
        const maxX = frameMetrics.left;
        const minY = frameMetrics.bottom - dispH;
        const maxY = frameMetrics.top;
        posX = clamp(posX, minX, maxX);
        posY = clamp(posY, minY, maxY);
      }
    });
  });

  function setRatio(ratio: 'square' | 'banner') {
    if (currentRatio === ratio) return;
    currentRatio = ratio;
    zoom = 1;
    if (naturalWidth > 0 && naturalHeight > 0) {
      // Re-center di frame rasio baru
      setTimeout(() => {
        centerImage(naturalWidth, naturalHeight, 1);
      }, 0);
    }
  }

  function applyZoom(newZoom: number) {
    const clampedZoom = Math.max(1, Math.min(newZoom, 3));
    if (naturalWidth === 0 || naturalHeight === 0) return;

    const cx = frameMetrics.left + frameMetrics.w / 2;
    const cy = frameMetrics.top + frameMetrics.h / 2;

    const oldScale = currentScale;
    const nextScale = minScale * clampedZoom;

    // Pertahankan titik fokus gambar di tengah frame potong
    const u = (cx - posX) / oldScale;
    const v = (cy - posY) / oldScale;

    const nextDispW = Math.round(naturalWidth * nextScale);
    const nextDispH = Math.round(naturalHeight * nextScale);

    const nextPosX = Math.round(cx - u * nextScale);
    const nextPosY = Math.round(cy - v * nextScale);

    zoom = clampedZoom;
    posX = clamp(nextPosX, frameMetrics.right - nextDispW, frameMetrics.left);
    posY = clamp(nextPosY, frameMetrics.bottom - nextDispH, frameMetrics.top);
  }

  function handleZoomSlider(e: Event) {
    const val = parseFloat((e.target as HTMLInputElement).value);
    applyZoom(val);
  }

  function handleWheel(e: WheelEvent) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    applyZoom(zoom + delta);
  }

  function handlePointerDown(e: PointerEvent) {
    e.preventDefault();
    isDragging = true;
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    initPosX = posX;
    initPosY = posY;
    try {
      (e.currentTarget as HTMLElement)?.setPointerCapture?.(e.pointerId);
    } catch {}
  }

  function handlePointerMove(e: PointerEvent) {
    if (!isDragging) return;
    const dx = e.clientX - dragStartX;
    const dy = e.clientY - dragStartY;
    posX = clamp(initPosX + dx, frameMetrics.right - dispW, frameMetrics.left);
    posY = clamp(initPosY + dy, frameMetrics.bottom - dispH, frameMetrics.top);
  }

  function handlePointerUp(e: PointerEvent) {
    if (isDragging) {
      isDragging = false;
      try {
        (e.currentTarget as HTMLElement)?.releasePointerCapture?.(e.pointerId);
      } catch {}
    }
  }

  function resetCrop() {
    zoom = 1;
    centerImage(naturalWidth, naturalHeight, 1);
  }

  function ensureImageLoaded(): Promise<HTMLImageElement> {
    if (imgElement && imgElement.complete && imgElement.naturalWidth > 0) {
      return Promise.resolve(imgElement);
    }
    return new Promise((resolve, reject) => {
      const probe = new Image();
      probe.onload = () => resolve(probe);
      probe.onerror = reject;
      probe.src = activeSrc;
    });
  }

  async function handleApply() {
    if (!activeSrc || isSaving) return;
    isSaving = true;

    try {
      const loadedImg = await ensureImageLoaded();
      const curNatW = loadedImg.naturalWidth;
      const curNatH = loadedImg.naturalHeight;
      const curScale = currentScale > 0 ? currentScale : (minScale > 0 ? minScale : 1);

      // Hitung koordinat potongan pada gambar asli
      let sx = (frameMetrics.left - posX) / curScale;
      let sy = (frameMetrics.top - posY) / curScale;
      let sw = frameMetrics.w / curScale;
      let sh = frameMetrics.h / curScale;

      sx = Math.max(0, Math.min(sx, curNatW - 1));
      sy = Math.max(0, Math.min(sy, curNatH - 1));
      sw = Math.max(1, Math.min(sw, curNatW - sx));
      sh = Math.max(1, Math.min(sh, curNatH - sy));

      const targetRatio = frameMetrics.w / frameMetrics.h;
      const targetW = Math.max(100, Math.min(Math.round(sw), 1600));
      const targetH = Math.max(50, Math.round(targetW / targetRatio));

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        throw new Error('Canvas context not available');
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(loadedImg, sx, sy, sw, sh, 0, 0, targetW, targetH);

      const mime = imageFile?.type || 'image/jpeg';
      const outMime = mime === 'image/png' ? 'image/png' : 'image/jpeg';

      const blob = await new Promise<Blob | null>((resolve) => {
        canvas.toBlob(resolve, outMime, 0.92);
      });

      if (!blob) {
        throw new Error('Gagal menghasilkan blob gambar crop');
      }

      const origName = imageFile?.name || 'cropped-image.jpg';
      const lastDot = origName.lastIndexOf('.');
      const baseName = lastDot > 0 ? origName.substring(0, lastDot) : origName;
      const ext = outMime === 'image/png' ? 'png' : 'jpg';
      const outFileName = `${baseName}_cropped.${ext}`;

      const croppedFile = new File([blob], outFileName, { type: outMime });
      const previewUrl = URL.createObjectURL(blob);

      await onCrop(croppedFile, previewUrl);
    } catch (err) {
      console.error('[ImageCropModal] Error cropping image:', err);
    } finally {
      isSaving = false;
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (!isOpen) return;
    if (e.key === 'Escape') {
      onCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleApply();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-70 flex items-center justify-center p-4 bg-nb-black/75 backdrop-blur-xs transition-opacity"
    role="presentation"
    onclick={(e) => {
      if (e.target === e.currentTarget) onCancel();
    }}
    data-testid="image-crop-backdrop"
  >
    <!-- Modal Card -->
    <div
      class="nb-card max-w-lg w-full bg-nb-surface text-nb-black p-5 relative flex flex-col gap-3 shadow-nb-lg border-3 border-nb-black animate-in fade-in zoom-in-95 max-h-[96vh] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="crop-modal-title"
      data-testid="image-crop-modal"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b-2 border-nb-black pb-2.5">
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 rounded bg-nb-yellow border-2 border-nb-black shadow-nb-xs flex items-center justify-center text-base font-black text-black">
            ✂️
          </span>
          <div>
            <h2 id="crop-modal-title" class="text-sm font-black uppercase text-nb-black m-0" data-testid="crop-modal-title">
              {title || t('cropModal.title', 'ATUR AREA GAMBAR')}
            </h2>
            <p class="text-[11px] font-bold text-gray-500 m-0">
              {t('cropModal.subtitle', 'Geser dan perbesar gambar untuk menyesuaikan area tampilan di dalam frame.')}
            </p>
          </div>
        </div>

        <button
          type="button"
          class="w-7 h-7 border-2 border-nb-black bg-gray-100 hover:bg-nb-yellow rounded flex items-center justify-center font-bold text-xs cursor-pointer shadow-nb-xs transition-all text-black"
          onclick={onCancel}
          aria-label="Tutup modal crop"
          data-testid="btn-close-crop-modal"
        >
          ✕
        </button>
      </div>

      <!-- Ratio Toggle (jika diaktifkan) -->
      {#if allowRatioToggle}
        <div class="flex items-center gap-2 text-xs font-bold" data-testid="crop-ratio-group">
          <span class="text-gray-600 text-[11px] uppercase font-black">Rasio Frame:</span>
          <button
            type="button"
            class="px-2.5 py-1 text-xs border-2 border-nb-black rounded cursor-pointer font-bold transition-all {currentRatio === 'square'
              ? 'bg-nb-yellow text-black shadow-nb-xs font-black'
              : 'bg-white hover:bg-gray-100 text-gray-700'}"
            onclick={() => setRatio('square')}
            data-testid="btn-ratio-square"
          >
            {t('cropModal.ratioSquare', 'Kotak (1:1)')}
          </button>
          <button
            type="button"
            class="px-2.5 py-1 text-xs border-2 border-nb-black rounded cursor-pointer font-bold transition-all {currentRatio === 'banner'
              ? 'bg-nb-yellow text-black shadow-nb-xs font-black'
              : 'bg-white hover:bg-gray-100 text-gray-700'}"
            onclick={() => setRatio('banner')}
            data-testid="btn-ratio-banner"
          >
            {t('cropModal.ratioBanner', 'Persegi Panjang (Banner)')}
          </button>
        </div>
      {/if}

      <!-- Crop Viewport Container (tanpa flex centering agar sistem koordinat gambar & frame presisi) -->
      <div
        class="relative w-full h-[280px] bg-gray-900 border-2 border-nb-black rounded overflow-hidden select-none {isDragging ? 'cursor-grabbing' : 'cursor-grab'}"
        bind:clientWidth={containerW}
        bind:clientHeight={containerH}
        onpointerdown={handlePointerDown}
        onpointermove={handlePointerMove}
        onpointerup={handlePointerUp}
        onpointercancel={handlePointerUp}
        onwheel={handleWheel}
        style="touch-action: none;"
        role="region"
        aria-label="Area crop gambar"
        data-testid="crop-viewport"
      >
        <!-- Gambar yang digeser & diperbesar: top-0 left-0 memastikan koordinat tepat dari (0, 0) kontainer -->
        {#if activeSrc}
          <img
            bind:this={imgElement}
            src={activeSrc}
            alt="Source to crop"
            onload={handleImageLoad}
            crossorigin={activeSrc.startsWith('http') ? 'anonymous' : undefined}
            draggable="false"
            class="absolute top-0 left-0 max-w-none max-h-none pointer-events-none select-none transition-none"
            style="width: {dispW}px; height: {dispH}px; transform: translate3d({posX}px, {posY}px, 0);"
            data-testid="crop-image"
          />
        {/if}

        <!-- Frame Cutout Overlay -->
        <div
          class="absolute border-2 border-nb-yellow pointer-events-none select-none transition-all duration-100"
          style="width: {frameMetrics.w}px; height: {frameMetrics.h}px; left: {frameMetrics.left}px; top: {frameMetrics.top}px; box-shadow: 0 0 0 9999px rgba(0, 0, 0, 0.65);"
          data-testid="crop-frame"
          data-ratio={currentRatio}
        >
          <!-- 4 Neo Brutalism Corner Accent Brackets -->
          <span class="absolute -top-1 -left-1 w-3.5 h-3.5 border-t-3 border-l-3 border-white"></span>
          <span class="absolute -top-1 -right-1 w-3.5 h-3.5 border-t-3 border-r-3 border-white"></span>
          <span class="absolute -bottom-1 -left-1 w-3.5 h-3.5 border-b-3 border-l-3 border-white"></span>
          <span class="absolute -bottom-1 -right-1 w-3.5 h-3.5 border-b-3 border-r-3 border-white"></span>

          <!-- Rule-of-thirds Faint Grid -->
          <div class="w-full h-full grid grid-cols-3 grid-rows-3 pointer-events-none opacity-30">
            <div class="border-r border-b border-white"></div>
            <div class="border-r border-b border-white"></div>
            <div class="border-b border-white"></div>
            <div class="border-r border-b border-white"></div>
            <div class="border-r border-b border-white"></div>
            <div class="border-b border-white"></div>
            <div class="border-r border-white"></div>
            <div class="border-r border-white"></div>
            <div></div>
          </div>
        </div>
      </div>

      <!-- Controls: Zoom & Reset -->
      <div class="flex flex-col gap-2 p-2 bg-gray-50 border-2 border-nb-black rounded">
        <div class="flex items-center gap-2">
          <span class="text-[11px] font-black uppercase text-gray-700 shrink-0 flex items-center gap-1">
            <span>🔍</span>
            <span>{t('cropModal.zoomLabel', 'Zoom:')}</span>
          </span>

          <button
            type="button"
            class="w-6 h-6 border border-nb-black bg-white hover:bg-gray-200 rounded font-black text-xs flex items-center justify-center cursor-pointer text-black"
            onclick={() => applyZoom(zoom - 0.1)}
            title="Perkecil zoom"
            data-testid="btn-zoom-out"
          >
            -
          </button>

          <input
            type="range"
            min="1"
            max="3"
            step="0.02"
            value={zoom}
            oninput={handleZoomSlider}
            class="grow accent-nb-yellow cursor-pointer h-2 bg-gray-200 rounded-lg"
            data-testid="crop-zoom-slider"
          />

          <button
            type="button"
            class="w-6 h-6 border border-nb-black bg-white hover:bg-gray-200 rounded font-black text-xs flex items-center justify-center cursor-pointer text-black"
            onclick={() => applyZoom(zoom + 0.1)}
            title="Perbesar zoom"
            data-testid="btn-zoom-in"
          >
            +
          </button>

          <button
            type="button"
            class="px-2 py-0.5 border border-nb-black bg-white hover:bg-nb-yellow rounded text-[10px] font-black text-black cursor-pointer shadow-nb-xs"
            onclick={resetCrop}
            data-testid="btn-crop-reset"
          >
            ↺ {t('cropModal.reset', 'Reset')}
          </button>
        </div>

        <p class="text-[10px] font-bold text-gray-500 m-0">
          💡 {t('cropModal.tips', 'Tips: Geser gambar untuk memilih area, gunakan slider atau scroll untuk zoom.')}
        </p>
      </div>

      <!-- Action Buttons -->
      <div class="flex items-center justify-end gap-3 pt-2 border-t-2 border-dashed border-gray-300">
        <button
          type="button"
          class="nb-btn bg-gray-200 hover:bg-gray-300 text-xs px-4 py-2 text-black cursor-pointer shadow-nb-xs"
          onclick={onCancel}
          data-testid="btn-cancel-crop"
        >
          {t('cropModal.cancel', 'BATAL')}
        </button>

        <button
          type="button"
          class="nb-btn bg-nb-yellow hover:bg-yellow-400 text-black text-xs px-5 py-2 font-black shadow-nb-sm border-2 border-nb-black cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
          onclick={handleApply}
          disabled={isSaving || !activeSrc}
          data-testid="btn-apply-crop"
        >
          <span>✂️</span>
          <span>{isSaving ? 'Menyimpan...' : t('cropModal.apply', 'TERAPKAN CROP')}</span>
        </button>
      </div>
    </div>
  </div>
{/if}
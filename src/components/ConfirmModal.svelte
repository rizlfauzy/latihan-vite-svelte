<script lang="ts">
  import { i18nStore } from '@/stores/i18nStore';
  import SkeletonModal from '@/components/SkeletonModal.svelte';

  interface Props {
    isOpen: boolean;
    title?: string;
    message?: string;
    itemText?: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
  }

  let {
    isOpen = $bindable(false),
    title,
    message,
    itemText = '',
    confirmText,
    cancelText,
    isLoading = false,
    onConfirm,
    onCancel
  }: Props = $props();

  let resolvedTitle = $derived(title || $i18nStore.t('confirm.title'));
  let resolvedMessage = $derived(message || $i18nStore.t('confirm.message'));
  let resolvedConfirmText = $derived(confirmText || $i18nStore.t('confirm.confirm'));
  let resolvedCancelText = $derived(cancelText || $i18nStore.t('confirm.cancel'));

  function handleKeydown(e: KeyboardEvent) {
    if (isOpen && e.key === 'Escape') {
      onCancel();
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onCancel();
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
    data-testid="confirm-modal-backdrop"
  >
    <!-- Modal Card -->
    <div
      class="nb-card max-w-md w-full bg-white p-6 relative flex flex-col gap-4 shadow-nb-lg border-3 border-nb-black animate-in fade-in zoom-in-95"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      data-testid="confirm-modal"
    >
      {#if isLoading}
        <SkeletonModal />
      {:else}
      <!-- Modal Header -->
      <div class="flex items-center justify-between gap-3 border-b-2 border-nb-black pb-3">
        <div class="inline-flex items-center gap-2 bg-nb-yellow px-3 py-1 border-2 border-nb-black rounded font-black text-sm uppercase text-black">
          <span>⚠️</span>
          <span id="modal-title">{resolvedTitle}</span>
        </div>

        <button
          type="button"
          class="w-7 h-7 border-2 border-nb-black bg-gray-100 hover:bg-nb-yellow rounded flex items-center justify-center font-bold text-xs cursor-pointer shadow-nb-xs transition-all"
          onclick={onCancel}
          aria-label={$i18nStore.t('confirm.closeModal')}
          data-testid="modal-close-button"
        >
          ✕
        </button>
      </div>

      <!-- Modal Content -->
      <div class="flex flex-col gap-2.5 text-nb-black">
        <p class="font-bold text-base m-0 leading-snug">
          {resolvedMessage}
        </p>

        {#if itemText}
          <div class="bg-gray-100 p-3 border-2 border-dashed border-gray-400 rounded text-sm font-semibold text-gray-700 wrap-break-word whitespace-pre-wrap max-h-28 overflow-y-auto italic">
            {itemText}
          </div>
        {/if}

        <p class="text-xs font-semibold text-gray-500 m-0">
          * {$i18nStore.t('confirm.warning')}
        </p>
      </div>

      <!-- Modal Actions -->
      <div class="flex items-center justify-end gap-3 pt-2 border-t border-dashed border-gray-300">
        <button
          type="button"
          class="nb-btn bg-gray-200 hover:bg-gray-300 text-xs px-4 py-2 text-black"
          onclick={onCancel}
          data-testid="modal-cancel-button"
        >
          {resolvedCancelText}
        </button>

        <button
          type="button"
          class="nb-btn bg-nb-red text-white text-xs px-4 py-2 hover:bg-red-600"
          onclick={onConfirm}
          data-testid="modal-confirm-button"
        >
          {resolvedConfirmText}
        </button>
      </div>
      {/if}
    </div>
  </div>
{/if}

<script lang="ts">
  import type { AppItem } from '@/data/apps';
  import { todoStore } from '@/stores/todoStore';
  import { i18nStore } from '@/stores/i18nStore';

  interface Props {
    isOpen: boolean;
    app: AppItem | null;
    onClose: () => void;
  }

  let { isOpen = $bindable(false), app, onClose }: Props = $props();

  const t = $derived((key: string, defaultValue: string = ''): string => $i18nStore.t(key, defaultValue));

  let messageText = $state('');

  // Cari todos yang belum selesai dengan topik aplikasi yang bersangkutan
  let pendingTodos = $derived(
    app ? $todoStore.todos.filter((todo) => todo.appId === app.id && !todo.done) : []
  );

  // Buat default draft saat modal dibuka atau app berubah
  $effect(() => {
    if (isOpen && app) {
      let draft = `Halo ${app.picName}, saya ingin bertanya dan berkonsultasi mengenai aplikasi "${app.name}" di Portal Aplikasi Perusahaan.`;

      if (pendingTodos.length > 0) {
        draft += `\n\nBerikut daftar catatan/tugas yang belum selesai:\n` +
          pendingTodos.map((todo, idx) => {
            let line = `${idx + 1}. ${todo.text}`;
            const urls = todo.imageUrls && todo.imageUrls.length > 0
              ? todo.imageUrls
              : (todo.imageUrl ? [todo.imageUrl] : []);
            if (urls.length > 0) {
              line += ` (Lampiran gambar: ${urls.join(', ')})`;
            }
            return line;
          }).join('\n');
      }

      messageText = draft;
    }
  });

  const cleanPhone = $derived(app?.picWhatsapp ? app.picWhatsapp.replace(/[^0-9]/g, '') : '');
  const waUrl = $derived(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(messageText)}`);

  function handleKeydown(e: KeyboardEvent) {
    if (isOpen && e.key === 'Escape') {
      onClose();
    }
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen && app}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-nb-black/60 backdrop-blur-xs transition-opacity"
    onclick={handleBackdropClick}
    role="presentation"
    data-testid="wa-preview-modal-backdrop"
  >
    <!-- Modal Card -->
    <div
      class="nb-card max-w-lg w-full bg-nb-surface text-nb-black p-6 relative flex flex-col gap-4 shadow-nb-lg border-3 border-nb-black animate-in fade-in zoom-in-95"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wa-modal-title"
      data-testid="wa-preview-modal"
    >
      <!-- Modal Header -->
      <div class="flex items-center justify-between gap-3 border-b-2 border-nb-black pb-3">
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 rounded bg-nb-wa border-2 border-nb-black shadow-nb-xs flex items-center justify-center text-base font-black text-white">
            💬
          </span>
          <div>
            <h2 id="wa-modal-title" class="text-base font-black uppercase text-nb-black m-0" data-testid="wa-modal-title">
              {t('waModal.title', 'PREVIEW PESAN WHATSAPP')}
            </h2>
            <p class="text-xs font-bold text-gray-500 m-0">
              PIC: {app.picName} ({app.name})
            </p>
          </div>
        </div>

        <button
          type="button"
          class="w-7 h-7 border-2 border-nb-black bg-gray-100 hover:bg-nb-yellow rounded flex items-center justify-center font-bold text-xs cursor-pointer shadow-nb-xs transition-all"
          onclick={onClose}
          aria-label="Tutup modal"
          data-testid="btn-close-wa-modal"
        >
          ✕
        </button>
      </div>

      <!-- Pending To-Dos Info Badge / Notice -->
      {#if pendingTodos.length > 0}
        <div class="p-3 bg-yellow-50 border-2 border-nb-black rounded shadow-nb-xs text-xs font-bold text-yellow-900 flex flex-col gap-1">
          <span class="flex items-center gap-1.5 font-extrabold text-nb-black uppercase text-[11px]">
            <span>📌</span>
            <span>{t('waModal.pendingTodosNotice', 'Catatan tugas belum selesai otomatis disertakan:')} ({pendingTodos.length})</span>
          </span>
          <ul class="list-none m-0 p-0 flex flex-col gap-1 max-h-28 overflow-y-auto">
            {#each pendingTodos as todo}
              <li class="flex items-center justify-between gap-2 text-[11px] bg-white/80 p-1 px-2 rounded border border-yellow-300">
                <span class="truncate font-semibold text-gray-800">• {todo.text}</span>
                {#if (todo.imageUrls && todo.imageUrls.length > 0) || todo.imageUrl}
                  {@const urls = todo.imageUrls && todo.imageUrls.length > 0 ? todo.imageUrls : [todo.imageUrl!]}
                  <div class="flex items-center gap-1 shrink-0">
                    {#each urls as url, i}
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 text-[10px] font-black px-1.5 py-0.5 bg-blue-100 text-blue-800 rounded border border-blue-400 hover:underline shrink-0"
                        title="Lihat lampiran gambar"
                        data-testid={`wa-todo-image-link-${todo.id}`}
                      >
                        <span>📷</span>
                        <span>{urls.length > 1 ? `Foto ${i + 1}` : 'Lampiran'}</span>
                      </a>
                    {/each}
                  </div>
                {/if}
              </li>
            {/each}
          </ul>
        </div>
      {:else}
        <div class="p-2.5 bg-gray-50 border-2 border-gray-300 rounded text-xs font-bold text-gray-600 flex items-center gap-2">
          <span>✨</span>
          <span>{t('waModal.noPendingTodos', 'Tidak ada catatan pending untuk aplikasi ini.')}</span>
        </div>
      {/if}

      <!-- Message Textarea -->
      <div class="flex flex-col gap-1.5">
        <label for="wa-message-input" class="text-xs font-black uppercase text-nb-black">
          {t('waModal.messageLabel', 'DRAF PESAN (DAPAT DIEDIT)')}
        </label>
        <textarea
          id="wa-message-input"
          bind:value={messageText}
          rows="6"
          class="nb-input w-full text-xs font-medium leading-relaxed resize-y p-3"
          data-testid="textarea-wa-message"
          placeholder="Tulis pesan..."
        ></textarea>
      </div>

      <!-- Modal Actions -->
      <div class="flex items-center justify-end gap-3 pt-3 border-t-2 border-dashed border-gray-300">
        <button
          type="button"
          class="nb-btn bg-gray-200 hover:bg-gray-300 text-xs px-4 py-2 text-black cursor-pointer shadow-nb-xs"
          onclick={onClose}
          data-testid="btn-cancel-wa-modal"
        >
          {t('waModal.cancelButton', 'BATAL')}
        </button>

        <a
          href={waUrl}
          target="_blank"
          rel="noopener noreferrer"
          class="nb-btn bg-nb-wa hover:bg-green-600 text-white text-xs px-4 py-2 flex items-center gap-1.5 font-extrabold shadow-nb-sm border-2 border-nb-black cursor-pointer"
          onclick={onClose}
          data-testid="btn-send-whatsapp"
        >
          <span>💬</span>
          <span>{t('waModal.sendButton', 'KIRIM KE WHATSAPP ➔')}</span>
        </a>
      </div>
    </div>
  </div>
{/if}

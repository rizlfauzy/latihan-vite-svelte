<script lang="ts">
  import { alertStore } from '@/stores/alertStore';
  import { slide, fade } from 'svelte/transition';

  const icons = {
    success: '✅',
    error: '❌',
    info: 'ℹ️',
  };

  const bgClasses = {
    success: 'bg-nb-green text-nb-black',
    error: 'bg-nb-red text-white',
    info: 'bg-nb-blue text-nb-black',
  };
</script>

<aside
  class="fixed top-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
  aria-label="Notifikasi Alert"
  data-testid="alert-container"
>
  {#each $alertStore.alerts as alert (alert.id)}
    <div
      class="pointer-events-auto nb-card p-3 sm:p-3.5 flex items-start justify-between gap-3 shadow-nb-md border-3 border-nb-black {bgClasses[alert.type] || 'bg-white text-nb-black'}"
      transition:slide={{ duration: 200 }}
      role="status"
      aria-live="polite"
      data-testid="alert-toast"
      data-type={alert.type}
    >
      <div class="flex items-start gap-2.5">
        <span class="text-lg leading-none mt-0.5" aria-hidden="true">
          {icons[alert.type] || '🔔'}
        </span>
        <div class="flex flex-col gap-0.5">
          <span class="font-extrabold text-xs uppercase tracking-wider opacity-90">
            {alert.type}
          </span>
          <p class="font-bold text-xs sm:text-sm m-0 leading-snug" data-testid="alert-message">
            {alert.message}
          </p>
        </div>
      </div>

      <button
        type="button"
        class="cursor-pointer font-black text-xs w-6 h-6 border-2 border-nb-black rounded bg-white/30 hover:bg-white/60 text-current flex items-center justify-center transition-all ml-2 shrink-0"
        onclick={() => alertStore.removeAlert(alert.id)}
        aria-label="Tutup notifikasi"
        data-testid="alert-close-btn"
      >
        ✕
      </button>
    </div>
  {/each}
</aside>

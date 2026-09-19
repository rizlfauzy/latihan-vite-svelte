<script lang="ts">
  import type { AppItem } from '../data/apps';

  let { app }: { app: AppItem } = $props();

  const waMessage = $derived(
    encodeURIComponent(`Halo ${app.picName}, saya ingin bertanya dan konsultasi mengenai aplikasi "${app.name}" di Svelte Hub.`)
  );
  const waUrl = $derived(`https://wa.me/${app.picWhatsapp}?text=${waMessage}`);
</script>

<div class="nb-card nb-card-interactive group flex flex-col justify-between gap-4 bg-nb-surface text-nb-black relative">
  <div class="flex items-center justify-between gap-2.5">
    <div
      class="w-12 h-12 border-2 border-nb-black rounded-md shadow-[2px_2px_0px_#121212] flex items-center justify-center"
      style="background: {app.color};"
    >
      <span class="text-2xl leading-none">{app.icon}</span>
    </div>
    <span class="nb-badge" style="background: {app.color};">
      {app.category}
    </span>
  </div>

  <div class="flex flex-col gap-2 grow">
    <h3 class="text-xl font-extrabold m-0">{app.name}</h3>
    <p class="text-sm text-gray-600 font-medium leading-relaxed m-0">{app.description}</p>
  </div>

  <!-- PIC & WhatsApp Contact Info -->
  <div class="p-2.5 bg-gray-50 border-2 border-nb-black rounded-md shadow-[2px_2px_0px_#121212] flex flex-col gap-2">
    <div class="flex items-center justify-between text-xs font-bold text-gray-700">
      <span>👤 PIC: <span class="text-nb-black">{app.picName}</span></span>
    </div>
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      class="nb-btn bg-[#25D366] text-white text-xs px-3 py-1.5 shadow-[2px_2px_0px_#121212] border-2 border-nb-black flex items-center justify-center gap-1.5 font-extrabold tracking-normal hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#121212] transition-all"
    >
      <span>💬</span>
      <span>HUBUNGI PIC (WHATSAPP)</span>
    </a>
  </div>

  <div class="pt-3 border-t-2 border-dashed border-gray-200 flex items-center justify-between">
    <a
      href={app.url}
      target="_blank"
      rel="noopener noreferrer"
      class="nb-btn bg-nb-yellow text-xs px-4 py-2 w-full flex items-center justify-center gap-1.5 font-mono font-extrabold"
    >
      <span>BUKA APLIKASI</span>
      <span class="text-base transition-transform duration-150 group-hover:translate-x-1 group-hover:-translate-y-1">
        ↗
      </span>
    </a>
  </div>
</div>

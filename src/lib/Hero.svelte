<script lang="ts">
  let { title = "SVELTE HUB", subtitle = "Central Dashboard untuk Akses Cepat Semua Aplikasi Svelte" } = $props();
</script>

<header class="w-full flex justify-center">
  <div class="nb-card w-full flex flex-col items-center text-center p-6 md:p-9 gap-5 relative overflow-hidden bg-nb-surface">
    <div class="inline-flex items-center justify-center p-2 transition-transform duration-200 hover:-rotate-3 hover:scale-105">
      <img src="/logo.svg" alt="Svelte Hub Logo" class="w-24 h-24 md:w-28 md:h-28 block" />
    </div>
    
    <div class="flex flex-col items-center gap-3">
      <div class="flex gap-2 flex-wrap justify-center">
        <span class="nb-badge bg-nb-pink text-white">⚡ SVELTE 5</span>
        <span class="nb-badge bg-nb-blue">🚀 VITE</span>
        <span class="nb-badge bg-nb-green">🐳 DOCKER READY</span>
      </div>

      <h1 class="text-3xl md:text-5xl font-black tracking-tight uppercase m-0 leading-tight">
        {title}
      </h1>
      <p class="text-sm md:text-lg text-gray-700 font-semibold max-w-xl m-0 leading-snug">
        {subtitle}
      </p>
    </div>
  </div>
</header>

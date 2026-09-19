<script lang="ts">
  import { Router } from 'sv-router';
  import Navbar from './components/Navbar.svelte';
  import { env } from './lib/env';
</script>

{#if env.isDev}
  <aside class="fixed bottom-4 right-4 z-50 pointer-events-none" aria-label="Environment indicator">
    <div class="nb-badge bg-nb-yellow text-nb-black border-2 border-nb-black px-3 py-1.5 shadow-nb-md flex items-center gap-2 font-black text-xs">
      <span class="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
      <span>DEV MODE ({env.appEnv})</span>
    </div>
  </aside>
{/if}

<div class="max-w-6xl mx-auto px-4 sm:px-6 py-6 pb-16 flex flex-col gap-8 min-h-screen">
  <Navbar />

  <main class="w-full flex flex-col flex-1">
    <Router />
  </main>

  <footer class="nb-card flex items-center justify-between flex-wrap gap-4 bg-nb-yellow p-5 sm:px-6 mt-auto">
    <div>
      <p class="text-base font-extrabold m-0">⚡ <strong>SVELTE HUB</strong> — Personal Dashboard</p>
      <small class="text-xs font-semibold text-gray-800">
        Built with Svelte 5, Vite, Tailwind CSS, Zustand, & Neo Brutalism aesthetic
      </small>
    </div>
    <a
      href="https://github.com/rizlfauzy/latihan-vite-svelte"
      target="_blank"
      rel="noopener noreferrer"
      class="nb-btn bg-white text-xs px-4 py-2"
    >
      GITHUB REPO ↗
    </a>
  </footer>
</div>

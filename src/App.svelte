<script lang="ts">
  import Hero from './lib/Hero.svelte';
  import AppGrid from './lib/AppGrid.svelte';
  import TodoList from './lib/TodoList.svelte';
</script>

<div class="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-16 flex flex-col gap-10 min-h-screen">
  <main class="flex flex-col gap-10 w-full">
    <Hero />
    <AppGrid />
    <TodoList />
  </main>

  <footer class="nb-card flex items-center justify-between flex-wrap gap-4 bg-nb-yellow p-5 sm:px-6">
    <div>
      <p class="text-base font-extrabold m-0">⚡ <strong>SVELTE HUB</strong> — Personal Dashboard</p>
      <small class="text-xs font-semibold text-gray-800">
        Built with Svelte 5, Vite, Tailwind CSS, & Neo Brutalism aesthetic
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

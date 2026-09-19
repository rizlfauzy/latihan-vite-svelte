<script lang="ts">
  import Hero from './lib/Hero.svelte';
  import AppGrid from './lib/AppGrid.svelte';
  import TodoList from './lib/TodoList.svelte';
</script>

<main class="hub-layout">
  <Hero />
  <AppGrid />
  <TodoList />
</main>

<footer class="hub-footer nb-card">
  <div class="footer-text">
    <p>⚡ <strong>SVELTE HUB</strong> — Personal Dashboard</p>
    <small>Built with Svelte 5, Vite, & Neo Brutalism aesthetic</small>
  </div>
  <a
    href="https://github.com/rizlfauzy/latihan-vite-svelte"
    target="_blank"
    rel="noopener noreferrer"
    class="nb-btn nb-btn-white footer-btn"
  >
    GITHUB REPO ↗
  </a>
</footer>

<style>
  .hub-layout {
    display: flex;
    flex-direction: column;
    gap: 40px;
    width: 100%;
  }

  .hub-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
    background: var(--nb-yellow);
    padding: 20px 24px;
  }

  .footer-text p {
    font-size: 16px;
    font-weight: 800;
    margin: 0;
  }

  .footer-text small {
    font-size: 13px;
    font-weight: 600;
    color: #333333;
  }

  .footer-btn {
    padding: 8px 16px;
    font-size: 13px;
  }
</style>

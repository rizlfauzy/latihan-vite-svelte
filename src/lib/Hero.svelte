<script lang="ts">
  let { title = "SVELTE HUB", subtitle = "Central Dashboard untuk Akses Cepat Semua Aplikasi Svelte" } = $props();
</script>

<header class="hero-container">
  <div class="hero-card nb-card">
    <div class="logo-wrapper">
      <img src="/logo.svg" alt="Svelte Hub Logo" class="hero-logo" />
    </div>
    
    <div class="hero-content">
      <div class="badge-row">
        <span class="nb-badge" style="background: var(--nb-pink); color: #fff;">⚡ SVELTE 5</span>
        <span class="nb-badge" style="background: var(--nb-blue);">🚀 VITE</span>
        <span class="nb-badge" style="background: var(--nb-green);">🐳 DOCKER READY</span>
      </div>

      <h1 class="hero-title">{title}</h1>
      <p class="hero-subtitle">{subtitle}</p>
    </div>
  </div>
</header>

<style>
  .hero-container {
    width: 100%;
    display: flex;
    justify-content: center;
  }

  .hero-card {
    width: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    background: var(--nb-surface);
    padding: 36px 24px;
    gap: 20px;
    position: relative;
    overflow: hidden;
  }

  .logo-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 8px;
    transition: transform 0.2s ease;
  }

  .logo-wrapper:hover {
    transform: rotate(-3deg) scale(1.05);
  }

  .hero-logo {
    width: 110px;
    height: 110px;
    display: block;
  }

  .hero-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
  }

  .badge-row {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    justify-content: center;
  }

  .hero-title {
    font-size: clamp(32px, 5vw, 52px);
    font-weight: 900;
    letter-spacing: -1px;
    text-transform: uppercase;
    margin: 0;
  }

  .hero-subtitle {
    font-size: clamp(15px, 2vw, 18px);
    color: #444444;
    font-weight: 600;
    max-width: 600px;
    margin: 0;
  }
</style>

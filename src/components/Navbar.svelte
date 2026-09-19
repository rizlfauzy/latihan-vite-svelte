<script lang="ts">
  import { router } from '../router';
  import { env } from '../lib/env';
  import { i18nStore } from '../stores/i18nStore';

  let mobileMenuOpen = $state(false);

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }
</script>

<header class="w-full sticky top-0 z-40 bg-nb-bg/95 backdrop-blur-xs py-1.5" data-testid="navbar-header">
  <nav class="nb-card bg-white p-3.5 sm:p-4 flex items-center justify-between gap-4 flex-wrap" aria-label="Main Navigation">
    <!-- Brand / Logo -->
    <div class="flex items-center gap-3">
      <a
        href="/"
        class="inline-flex items-center gap-2.5 font-black text-lg sm:text-xl tracking-tight text-nb-black hover:scale-[1.02] transition-transform"
        data-testid="navbar-brand"
        onclick={closeMobileMenu}
      >
        <span class="inline-flex items-center justify-center w-9 h-9 bg-nb-yellow border-2 border-nb-black shadow-nb-sm rounded font-black text-lg">
          ⚡
        </span>
        <span class="uppercase">{$i18nStore.t('nav.brand')}</span>
      </a>

      {#if env.enableDebug}
        <span class="nb-badge bg-nb-pink text-[10px] sm:text-xs py-0.5 px-2 border-2" title="Mode Debug Aktif">
          {$i18nStore.t('nav.debug')}
        </span>
      {/if}
    </div>

    <!-- Desktop Navigation Links -->
    <div class="hidden md:flex items-center gap-2.5">
      <a
        href="/"
        class="nb-btn text-xs sm:text-sm px-3.5 py-2 font-black transition-all {router.isActive('/') ? 'bg-nb-yellow border-3' : 'bg-white hover:bg-gray-100'}"
        data-testid="nav-link-home"
      >
        {$i18nStore.t('nav.home')}
      </a>

      <a
        href="/company-profile"
        class="nb-btn text-xs sm:text-sm px-3.5 py-2 font-black transition-all {router.isActive('/company-profile') ? 'bg-nb-yellow border-3' : 'bg-white hover:bg-gray-100'}"
        data-testid="nav-link-company-profile"
      >
        {$i18nStore.t('nav.company')}
      </a>
    </div>

    <!-- Right Actions -->
    <div class="hidden sm:flex items-center gap-2.5">
      <!-- Language Switcher -->
      <button
        type="button"
        class="nb-btn bg-white hover:bg-nb-yellow text-xs font-black px-2.5 py-2 flex items-center gap-1.5"
        onclick={() => i18nStore.toggleLocale()}
        data-testid="lang-switcher-btn"
        title="Ganti Bahasa / Switch Language"
      >
        <span>{$i18nStore.locale === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}</span>
      </button>

      <a
        href="https://github.com/rizlfauzy/latihan-vite-svelte"
        target="_blank"
        rel="noopener noreferrer"
        class="nb-btn bg-nb-blue text-xs font-black px-3.5 py-2"
        data-testid="navbar-github-link"
      >
        {$i18nStore.t('nav.github')}
      </a>
    </div>

    <!-- Mobile Menu Button & Mobile Switcher -->
    <div class="flex sm:hidden items-center gap-2">
      <button
        type="button"
        class="nb-btn bg-white text-xs font-black px-2 py-1.5"
        onclick={() => i18nStore.toggleLocale()}
        data-testid="lang-switcher-btn-mobile"
      >
        {$i18nStore.locale === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}
      </button>

      <button
        type="button"
        class="nb-btn bg-nb-yellow p-2 text-sm font-black"
        onclick={toggleMobileMenu}
        aria-label="Toggle Navigation Menu"
        data-testid="navbar-mobile-toggle"
      >
        {mobileMenuOpen ? $i18nStore.t('nav.close') : $i18nStore.t('nav.menu')}
      </button>
    </div>
  </nav>

  <!-- Mobile Dropdown -->
  {#if mobileMenuOpen}
    <div class="md:hidden nb-card bg-white mt-2 p-3 flex flex-col gap-2 shadow-nb border-3 animate-in" data-testid="navbar-mobile-menu">
      <a
        href="/"
        class="nb-btn text-xs px-4 py-2.5 font-black text-left {router.isActive('/') ? 'bg-nb-yellow' : 'bg-white'}"
        onclick={closeMobileMenu}
      >
        {$i18nStore.t('nav.home')}
      </a>

      <a
        href="/company-profile"
        class="nb-btn text-xs px-4 py-2.5 font-black text-left {router.isActive('/company-profile') ? 'bg-nb-yellow' : 'bg-white'}"
        onclick={closeMobileMenu}
      >
        {$i18nStore.t('nav.company')}
      </a>

      <a
        href="https://github.com/rizlfauzy/latihan-vite-svelte"
        target="_blank"
        rel="noopener noreferrer"
        class="nb-btn bg-nb-blue text-xs font-black px-4 py-2.5 text-center mt-1"
        onclick={closeMobileMenu}
      >
        {$i18nStore.t('nav.github')}
      </a>
    </div>
  {/if}
</header>

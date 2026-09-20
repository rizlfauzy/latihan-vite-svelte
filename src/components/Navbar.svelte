<script lang="ts">
  import { router } from '@/router';
  import { env } from '@/lib/env';
  import { i18nStore } from '@/stores/i18nStore';
  import { themeStore } from '@/stores/themeStore';

  let mobileMenuOpen = $state(false);
  let openDropdown = $state<'home' | 'company' | null>(null);

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function closeMobileMenu() {
    mobileMenuOpen = false;
  }

  function toggleDropdown(menu: 'home' | 'company') {
    openDropdown = openDropdown === menu ? null : menu;
  }

  function closeDropdowns() {
    openDropdown = null;
  }

  function scrollToSection(targetPath: '/' | '/company-profile', targetId: string) {
    closeMobileMenu();
    closeDropdowns();

    if (router.isActive(targetPath)) {
      const el = document.getElementById(targetId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      router.navigate(targetPath);
      setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 120);
    }
  }
</script>

<svelte:window onclick={(e) => {
  const target = e.target as HTMLElement | null;
  if (!target?.closest('[data-nav-dropdown]')) {
    closeDropdowns();
  }
}} />

<header class="w-full sticky top-0 z-40 bg-nb-bg/95 backdrop-blur-xs py-1.5" data-testid="navbar-header">
  <nav class="nb-card bg-white p-3.5 sm:p-4 flex items-center justify-between gap-4 flex-wrap" aria-label="Main Navigation">
    <!-- Brand / Logo -->
    <div class="flex items-center gap-3">
      <a
        href="/"
        class="inline-flex items-center gap-2.5 font-black text-lg sm:text-xl tracking-tight text-nb-black hover:scale-[1.02] transition-transform"
        data-testid="navbar-brand"
        onclick={() => { closeMobileMenu(); closeDropdowns(); }}
      >
        <span class="inline-flex items-center justify-center w-9 h-9 bg-nb-yellow border-2 border-nb-black shadow-nb-sm rounded font-black text-lg text-nb-black">
          ⚡
        </span>
        <span class="uppercase hidden sm:inline">{$i18nStore.t('nav.brand')}</span>
      </a>

      {#if env.enableDebug}
        <span class="nb-badge bg-nb-pink text-[10px] sm:text-xs py-0.5 px-2 border-2 text-nb-black hidden sm:inline" title="Mode Debug Aktif">
          {$i18nStore.t('nav.debug')}
        </span>
      {/if}
    </div>

    <!-- Desktop Navigation Links with Submenus -->
    <div class="hidden md:flex items-center gap-2.5">
      <!-- Apps & Dashboard Dropdown -->
      <div class="relative inline-flex items-stretch" data-nav-dropdown data-testid="nav-group-home">
        <a
          href="/"
          class="nb-btn text-xs sm:text-sm px-3.5 py-2 font-black transition-all rounded-r-none border-r-0 {router.isActive('/') ? 'bg-nb-yellow border-3 text-black' : 'bg-white hover:bg-gray-100'}"
          data-testid="nav-link-home"
          onclick={closeDropdowns}
        >
          {$i18nStore.t('nav.home')}
        </a>
        <button
          type="button"
          class="nb-btn text-xs sm:text-sm px-2 py-2 font-black transition-all rounded-l-none {router.isActive('/') ? 'bg-nb-yellow border-3 text-black' : 'bg-white hover:bg-gray-100'}"
          onclick={(e) => { e.stopPropagation(); toggleDropdown('home'); }}
          aria-label="Toggle Apps Submenu"
          data-testid="nav-dropdown-toggle-home"
        >
          ▾
        </button>

        {#if openDropdown === 'home'}
          <div
            class="absolute top-full left-0 mt-1 min-w-50 nb-card bg-white p-1.5 shadow-nb-md border-3 flex flex-col gap-1 z-50 animate-in"
            data-testid="nav-submenu-home"
          >
            <button
              type="button"
              class="text-left font-black text-xs px-3 py-2 border-2 border-transparent hover:border-nb-black hover:bg-nb-yellow transition-all rounded cursor-pointer text-nb-black"
              onclick={() => scrollToSection('/', 'apps-hub')}
              data-testid="nav-sublink-apps-hub"
            >
              🚀 {$i18nStore.t('nav.submenuApps')}
            </button>
            <button
              type="button"
              class="text-left font-black text-xs px-3 py-2 border-2 border-transparent hover:border-nb-black hover:bg-nb-yellow transition-all rounded cursor-pointer text-nb-black"
              onclick={() => scrollToSection('/', 'todo-list')}
              data-testid="nav-sublink-todo-list"
            >
              📝 {$i18nStore.t('nav.submenuTodo')}
            </button>
          </div>
        {/if}
      </div>

      <!-- Company Profile Dropdown -->
      <div class="relative inline-flex items-stretch" data-nav-dropdown data-testid="nav-group-company">
        <a
          href="/company-profile"
          class="nb-btn text-xs sm:text-sm px-3.5 py-2 font-black transition-all rounded-r-none border-r-0 {router.isActive('/company-profile') ? 'bg-nb-yellow border-3 text-black' : 'bg-white hover:bg-gray-100'}"
          data-testid="nav-link-company-profile"
          onclick={closeDropdowns}
        >
          {$i18nStore.t('nav.company')}
        </a>
        <button
          type="button"
          class="nb-btn text-xs sm:text-sm px-2 py-2 font-black transition-all rounded-l-none {router.isActive('/company-profile') ? 'bg-nb-yellow border-3 text-black' : 'bg-white hover:bg-gray-100'}"
          onclick={(e) => { e.stopPropagation(); toggleDropdown('company'); }}
          aria-label="Toggle Company Profile Submenu"
          data-testid="nav-dropdown-toggle-company"
        >
          ▾
        </button>

        {#if openDropdown === 'company'}
          <div
            class="absolute top-full left-0 mt-1 min-w-52.5 nb-card bg-white p-1.5 shadow-nb-md border-3 flex flex-col gap-1 z-50 animate-in"
            data-testid="nav-submenu-company"
          >
            <button
              type="button"
              class="text-left font-black text-xs px-3 py-2 border-2 border-transparent hover:border-nb-black hover:bg-nb-yellow transition-all rounded cursor-pointer text-nb-black"
              onclick={() => scrollToSection('/company-profile', 'profile')}
              data-testid="nav-sublink-profile"
            >
              🏢 {$i18nStore.t('nav.submenuProfile')}
            </button>
            <button
              type="button"
              class="text-left font-black text-xs px-3 py-2 border-2 border-transparent hover:border-nb-black hover:bg-nb-yellow transition-all rounded cursor-pointer text-nb-black"
              onclick={() => scrollToSection('/company-profile', 'vision-mission')}
              data-testid="nav-sublink-vision-mission"
            >
              🎯 {$i18nStore.t('nav.submenuVision')}
            </button>
            <button
              type="button"
              class="text-left font-black text-xs px-3 py-2 border-2 border-transparent hover:border-nb-black hover:bg-nb-yellow transition-all rounded cursor-pointer text-nb-black"
              onclick={() => scrollToSection('/company-profile', 'services')}
              data-testid="nav-sublink-services"
            >
              🛠️ {$i18nStore.t('nav.submenuServices')}
            </button>
            <button
              type="button"
              class="text-left font-black text-xs px-3 py-2 border-2 border-transparent hover:border-nb-black hover:bg-nb-yellow transition-all rounded cursor-pointer text-nb-black"
              onclick={() => scrollToSection('/company-profile', 'contact')}
              data-testid="nav-sublink-contact"
            >
              👑 {$i18nStore.t('nav.submenuContact')}
            </button>
          </div>
        {/if}
      </div>
    </div>

    <!-- Right Actions -->
    <div class="hidden sm:flex items-center gap-2">
      <!-- Dark / Light Mode Switcher -->
      <button
        type="button"
        class="nb-btn bg-white hover:bg-nb-yellow text-xs font-black px-2.5 py-2 flex items-center gap-1.5"
        onclick={() => themeStore.toggleTheme()}
        data-testid="theme-toggle-btn"
        title="Ganti Tema (Dark/Light Mode)"
      >
        <span>{$themeStore.theme === 'dark' ? '☀️' : '🌙'}</span>
      </button>

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

    </div>

    <!-- Mobile Menu Button & Mobile Switchers -->
    <div class="flex sm:hidden items-center gap-1.5">
      <button
        type="button"
        class="nb-btn bg-white text-xs font-black px-2 py-1.5"
        onclick={() => themeStore.toggleTheme()}
        data-testid="theme-toggle-btn-mobile"
        title="Toggle Theme"
      >
        <span>{$themeStore.theme === 'dark' ? '☀️' : '🌙'}</span>
      </button>

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

  <!-- Mobile Drawer Menu -->
  {#if mobileMenuOpen}
    <div class="md:hidden nb-card bg-white mt-2 p-3 flex flex-col gap-2 shadow-nb border-3 animate-in" data-testid="navbar-mobile-menu">
      <!-- Route: Home -->
      <a
        href="/"
        class="nb-btn text-xs px-4 py-2 font-black text-left {router.isActive('/') ? 'bg-nb-yellow' : 'bg-white'}"
        onclick={closeMobileMenu}
      >
        {$i18nStore.t('nav.home')}
      </a>
      <div class="flex flex-col gap-1 pl-3 border-l-3 border-nb-yellow mb-1">
        <button
          type="button"
          class="text-left text-xs font-bold py-1.5 px-2 hover:bg-nb-yellow/40 rounded flex items-center gap-1.5 text-nb-black"
          onclick={() => scrollToSection('/', 'apps-hub')}
          data-testid="mobile-sublink-apps-hub"
        >
          <span>↳ 🚀</span>
          <span>{$i18nStore.t('nav.submenuApps')}</span>
        </button>
        <button
          type="button"
          class="text-left text-xs font-bold py-1.5 px-2 hover:bg-nb-yellow/40 rounded flex items-center gap-1.5 text-nb-black"
          onclick={() => scrollToSection('/', 'todo-list')}
          data-testid="mobile-sublink-todo-list"
        >
          <span>↳ 📝</span>
          <span>{$i18nStore.t('nav.submenuTodo')}</span>
        </button>
      </div>

      <!-- Route: Company Profile -->
      <a
        href="/company-profile"
        class="nb-btn text-xs px-4 py-2 font-black text-left {router.isActive('/company-profile') ? 'bg-nb-yellow' : 'bg-white'}"
        onclick={closeMobileMenu}
      >
        {$i18nStore.t('nav.company')}
      </a>
      <div class="flex flex-col gap-1 pl-3 border-l-3 border-nb-yellow mb-1">
        <button
          type="button"
          class="text-left text-xs font-bold py-1.5 px-2 hover:bg-nb-yellow/40 rounded flex items-center gap-1.5 text-nb-black"
          onclick={() => scrollToSection('/company-profile', 'profile')}
          data-testid="mobile-sublink-profile"
        >
          <span>↳ 🏢</span>
          <span>{$i18nStore.t('nav.submenuProfile')}</span>
        </button>
        <button
          type="button"
          class="text-left text-xs font-bold py-1.5 px-2 hover:bg-nb-yellow/40 rounded flex items-center gap-1.5 text-nb-black"
          onclick={() => scrollToSection('/company-profile', 'vision-mission')}
          data-testid="mobile-sublink-vision-mission"
        >
          <span>↳ 🎯</span>
          <span>{$i18nStore.t('nav.submenuVision')}</span>
        </button>
        <button
          type="button"
          class="text-left text-xs font-bold py-1.5 px-2 hover:bg-nb-yellow/40 rounded flex items-center gap-1.5 text-nb-black"
          onclick={() => scrollToSection('/company-profile', 'services')}
          data-testid="mobile-sublink-services"
        >
          <span>↳ 🛠️</span>
          <span>{$i18nStore.t('nav.submenuServices')}</span>
        </button>
        <button
          type="button"
          class="text-left text-xs font-bold py-1.5 px-2 hover:bg-nb-yellow/40 rounded flex items-center gap-1.5 text-nb-black"
          onclick={() => scrollToSection('/company-profile', 'contact')}
          data-testid="mobile-sublink-contact"
        >
          <span>↳ 👑</span>
          <span>{$i18nStore.t('nav.submenuContact')}</span>
        </button>
      </div>

      <a
        href="https://github.com/rizlfauzy/latihan-vite-svelte"
        target="_blank"
        rel="noopener noreferrer"
        class="nb-btn bg-nb-blue text-xs font-black px-4 py-2.5 text-center mt-1 text-nb-black"
        onclick={closeMobileMenu}
      >
        {$i18nStore.t('nav.github')}
      </a>
    </div>
  {/if}
</header>

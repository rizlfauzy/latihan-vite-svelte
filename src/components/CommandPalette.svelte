<script lang="ts">
  import { onMount } from 'svelte';
  import { router } from '@/router';
  import { appStore } from '@/stores/appStore';
  import { themeStore } from '@/stores/themeStore';
  import { i18nStore } from '@/stores/i18nStore';
  import { authStore } from '@/stores/authStore';

  const t = $derived((key: string, defaultValue?: string): string => $i18nStore.t(key, defaultValue));

  let isOpen = $state(false);
  let searchQuery = $state('');
  let selectedIndex = $state(0);
  let inputEl = $state<HTMLInputElement | null>(null);

  interface CommandItem {
    id: string;
    group: 'apps' | 'navigation' | 'actions';
    title: string;
    description?: string;
    icon: string;
    badge?: string;
    run: () => void;
  }

  const apps = $derived($appStore.apps);
  const hasDebug = $derived($authStore.hasDebugAccess);
  const isAuth = $derived($authStore.isAuthenticated);

  const commandItems = $derived<CommandItem[]>([
    // Quick Actions
    {
      id: 'action-theme',
      group: 'actions',
      title: t('theme.toggle', 'Ganti Tema (Dark / Light)'),
      description: $themeStore.theme === 'dark' ? 'Mode Gelap Aktif ➔ Ubah ke Terang' : 'Mode Terang Aktif ➔ Ubah ke Gelap',
      icon: $themeStore.theme === 'dark' ? '☀️' : '🌙',
      run: () => themeStore.toggleTheme(),
    },
    {
      id: 'action-lang',
      group: 'actions',
      title: t('lang.toggle', 'Ganti Bahasa (ID / EN)'),
      description: $i18nStore.locale === 'id' ? 'Bahasa Indonesia ➔ Switch to English' : 'English ➔ Ganti ke Bahasa Indonesia',
      icon: $i18nStore.locale === 'id' ? '🇬🇧' : '🇮🇩',
      run: () => i18nStore.toggleLocale(),
    },
    // Navigation
    {
      id: 'nav-home',
      group: 'navigation',
      title: t('nav.home', 'Beranda / Portal Aplikasi'),
      description: 'Navigasi ke halaman beranda',
      icon: '🏠',
      run: () => {
        router.navigate('/');
      },
    },
    {
      id: 'nav-todo',
      group: 'navigation',
      title: t('nav.submenuTodo', 'To-Do List & Catatan Tugas'),
      description: 'Buka daftar tugas dan catatan to-do',
      icon: '📝',
      run: () => {
        if (!router.isActive('/')) {
          router.navigate('/');
        }
        setTimeout(() => {
          const el = document.getElementById('todo-list');
          el?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
      },
    },
    {
      id: 'nav-company',
      group: 'navigation',
      title: t('nav.company', 'Profil Perusahaan (Company Profile)'),
      description: 'Lihat profil perusahaan, visi, misi & kontak',
      icon: '🏢',
      run: () => {
        router.navigate('/company-profile');
      },
    },
    ...(isAuth
      ? [
          {
            id: 'nav-profile',
            group: 'navigation',
            title: t('profile.title', 'Profil Pengguna'),
            description: 'Lihat profil dan ganti kata sandi',
            icon: '👤',
            run: () => router.navigate('/profile'),
          } as CommandItem,
        ]
      : [
          {
            id: 'nav-login',
            group: 'navigation',
            title: t('nav.login', 'Masuk / Login'),
            description: 'Autentikasi akun pengguna',
            icon: '🔑',
            run: () => router.navigate('/login'),
          } as CommandItem,
        ]),
    ...(hasDebug
      ? [
          {
            id: 'nav-users',
            group: 'navigation',
            title: t('nav.users', 'Kelola Pengguna (Superadmin)'),
            description: 'Manajemen pengguna & hak akses role',
            icon: '👥',
            badge: 'ADMIN',
            run: () => router.navigate('/users'),
          } as CommandItem,
        ]
      : []),
    // Apps
    ...apps.map(
      (app): CommandItem => ({
        id: `app-${app.id}`,
        group: 'apps',
        title: app.name,
        description: `${app.category || 'Aplikasi'} • ${app.description || ''}`,
        icon: app.icon,
        badge: app.status === 'maintenance' ? '🛠️ Maintenance' : app.status === 'beta' ? '🧪 Beta' : undefined,
        run: () => {
          if (app.url) {
            window.open(app.url, '_blank');
          }
        },
      })
    ),
  ]);

  const filteredItems = $derived<CommandItem[]>(
    commandItems.filter((item) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.title.toLowerCase().includes(q) ||
        (item.description && item.description.toLowerCase().includes(q))
      );
    })
  );

  function openPalette() {
    isOpen = true;
    searchQuery = '';
    selectedIndex = 0;
    setTimeout(() => {
      inputEl?.focus();
    }, 50);
  }

  function closePalette() {
    isOpen = false;
    searchQuery = '';
    selectedIndex = 0;
  }

  function executeItem(item: CommandItem) {
    closePalette();
    item.run();
  }

  function handleKeydown(e: KeyboardEvent) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (isOpen) {
        closePalette();
      } else {
        openPalette();
      }
      return;
    }

    if (!isOpen) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        selectedIndex = (selectedIndex + 1) % filteredItems.length;
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (filteredItems.length > 0) {
        selectedIndex = (selectedIndex - 1 + filteredItems.length) % filteredItems.length;
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredItems[selectedIndex];
      if (target) {
        executeItem(target);
      }
    }
  }

  onMount(() => {
    const handleCustomToggle = () => {
      if (isOpen) closePalette();
      else openPalette();
    };

    window.addEventListener('keydown', handleKeydown);
    window.addEventListener('toggle-command-palette', handleCustomToggle);

    return () => {
      window.removeEventListener('keydown', handleKeydown);
      window.removeEventListener('toggle-command-palette', handleCustomToggle);
    };
  });
</script>

{#if isOpen}
  <!-- Backdrop -->
  <div
    class="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-start justify-center pt-16 sm:pt-24 px-4 animate-in fade-in duration-100"
    onclick={(e) => { if (e.target === e.currentTarget) closePalette(); }}
    onkeydown={(e) => { if (e.key === 'Escape') closePalette(); }}
    role="dialog"
    tabindex="-1"
    aria-modal="true"
    aria-label={t('command.title', 'Pintasan & Perintah Cepat')}
    data-testid="command-palette-backdrop"
  >
    <!-- Modal Container -->
    <div
      class="bg-white border-3 border-nb-black shadow-nb-xl rounded-lg max-w-xl w-full overflow-hidden flex flex-col text-nb-black"
      data-testid="command-palette-modal"
    >
      <!-- Header / Search input -->
      <div class="flex items-center gap-3 p-3.5 border-b-3 border-nb-black bg-nb-yellow">
        <span class="text-xl">🔍</span>
        <input
          bind:this={inputEl}
          bind:value={searchQuery}
          oninput={() => { selectedIndex = 0; }}
          type="text"
          placeholder={t('command.placeholder', 'Ketik nama aplikasi, perintah, atau aksi...')}
          class="grow bg-transparent text-base font-black outline-none placeholder:text-gray-600 text-nb-black"
          data-testid="command-palette-input"
        />
        <button
          type="button"
          class="px-2 py-0.5 border-2 border-nb-black rounded bg-white text-xs font-black shadow-nb-xs cursor-pointer hover:bg-gray-100 transition-colors"
          onclick={closePalette}
          aria-label="Tutup Command Palette"
        >
          ESC
        </button>
      </div>

      <!-- Results list -->
      <div class="max-h-96 overflow-y-auto p-2 flex flex-col gap-1" data-testid="command-palette-list">
        {#if filteredItems.length === 0}
          <div class="p-8 text-center text-gray-500 font-bold" data-testid="command-palette-empty">
            {t('command.noResults', 'Tidak ada hasil ditemukan.')}
          </div>
        {:else}
          {#each filteredItems as item, idx (item.id)}
            {@const isSelected = idx === selectedIndex}
            <button
              type="button"
              class="w-full text-left flex items-center justify-between gap-3 p-2.5 rounded border-2 transition-all cursor-pointer {isSelected
                ? 'bg-nb-yellow border-nb-black shadow-nb-xs scale-[1.01]'
                : 'bg-white border-transparent hover:bg-gray-100 hover:border-gray-300'}"
              onclick={() => executeItem(item)}
              onmouseenter={() => (selectedIndex = idx)}
              data-testid={`command-item-${idx}`}
              data-active={isSelected ? 'true' : 'false'}
            >
              <div class="flex items-center gap-3 min-w-0">
                <span class="text-xl shrink-0">{item.icon}</span>
                <div class="flex flex-col min-w-0">
                  <span class="font-extrabold text-sm truncate text-nb-black">{item.title}</span>
                  {#if item.description}
                    <span class="text-xs text-gray-600 truncate font-semibold">{item.description}</span>
                  {/if}
                </div>
              </div>

              {#if item.badge}
                <span class="nb-badge bg-white text-nb-black text-[10px] shrink-0 border border-nb-black shadow-nb-xs">
                  {item.badge}
                </span>
              {/if}
            </button>
          {/each}
        {/if}
      </div>

      <!-- Footer / Helper -->
      <div class="p-2.5 px-4 bg-gray-50 border-t-2 border-nb-black flex items-center justify-between text-xs font-bold text-gray-600">
        <div class="flex items-center gap-3">
          <span><kbd class="px-1 border border-nb-black rounded bg-white shadow-nb-xs">↑</kbd> <kbd class="px-1 border border-nb-black rounded bg-white shadow-nb-xs">↓</kbd> Navigasi</span>
          <span><kbd class="px-1.5 border border-nb-black rounded bg-white shadow-nb-xs">Enter</kbd> Pilih</span>
        </div>
        <span>{filteredItems.length} opsi</span>
      </div>
    </div>
  </div>
{/if}

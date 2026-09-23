<script lang="ts">
  import { authStore } from '@/stores/authStore';
  import { router } from '@/router';
  import { i18nStore } from '@/stores/i18nStore';
  import ConfirmModal from '@/components/ConfirmModal.svelte';

  const t = $derived((key: string, defaultValue: string = ''): string => $i18nStore.t(key, defaultValue));

  let currentUser = $derived($authStore.user);
  let currentRole = $derived($authStore.role);

  let isModalLogoutOpen = $state(false);

  function handleLogout() {
    isModalLogoutOpen = false;
    authStore.logout();
    router.navigate('/login', { replace: true });
  }
</script>

<div class="w-full max-w-md mx-auto py-8 sm:py-16 px-4" data-testid="profile-page">
  <!-- Card Container Neo-Brutalism -->
  <div class="nb-card bg-white p-6 sm:p-8 shadow-nb border-4">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3 mb-6 pb-4 border-b-3 border-nb-black">
      <div class="flex items-center gap-2.5">
        <span class="w-10 h-10 rounded bg-nb-yellow border-2 border-nb-black shadow-nb-sm flex items-center justify-center text-xl font-black">
          🔐
        </span>
        <div>
          <h1 class="text-xl sm:text-2xl font-black tracking-tight text-nb-black uppercase m-0">
            {t('profile.title', "Profile User")}
          </h1>
          <p class="text-xs font-bold text-gray-500 m-0">
            {t('profile.subtitle', "Informasi Akun Anda")}
          </p>
        </div>
      </div>
      <button
        type="button"
        class="nb-btn bg-white hover:bg-gray-100 text-xs font-black px-2.5 py-1.5 cursor-pointer text-black"
        onclick={() => router.navigate('/')}
        data-testid="btn-back-home"
      >
        ← {t('profile.backToHome', 'Beranda')}
      </button>
    </div>

    <!-- Already logged in view -->
    <div class="flex flex-col gap-4 text-center py-4" data-testid="logged-in-profile">
      <div class="w-16 h-16 mx-auto rounded-full bg-nb-green border-3 border-nb-black shadow-nb flex items-center justify-center text-3xl">
        👤
      </div>
      <div>
        <h2 class="text-lg font-black text-nb-black m-0" data-testid="user-display-name">
          {currentUser?.name}
        </h2>
        <p class="text-xs font-extrabold text-gray-500 m-0" data-testid="user-display-username">
          @{currentUser?.username}
        </p>
      </div>

      <div class="inline-flex items-center justify-center gap-2 flex-wrap">
        <span class="nb-badge bg-nb-blue text-xs font-black uppercase" data-testid="user-display-role">
          Role: {currentRole?.name || 'USER'}
        </span>
        {#if currentRole?.is_debug}
          <span class="nb-badge bg-nb-pink text-xs font-black uppercase" data-testid="user-display-debug">
            ⚡ Debug Active
          </span>
        {/if}
      </div>

      <div class="flex items-center justify-center gap-3 pt-4 border-t-2 border-dashed border-gray-300">
        <button
          type="button"
          class="nb-btn bg-nb-yellow text-xs font-black px-4 py-2 text-black cursor-pointer shadow-nb-sm"
          onclick={() => router.navigate('/')}
          data-testid="btn-go-dashboard"
        >
          🚀 {t('login.goToDashboard')}
        </button>
        <button
          type="button"
          class="nb-btn bg-nb-red text-white text-xs font-black px-4 py-2 cursor-pointer shadow-nb-sm"
          onclick={() => isModalLogoutOpen = true}
          data-testid="btn-logout"
        >
          🚪 {t('login.logout')}
        </button>
      </div>
    </div>
  </div>
</div>

<ConfirmModal
  bind:isOpen={isModalLogoutOpen}
  title={t('nav.logout')}
  message={t('nav.logoutConfirm')}
  confirmText={t('common.yes')}
  cancelText={t('common.no')}
  onConfirm={handleLogout}
  onCancel={() => (isModalLogoutOpen = false)}
/>
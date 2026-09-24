<script lang="ts">
  import { authStore } from '@/stores/authStore';
  import { router } from '@/router';
  import { i18nStore } from '@/stores/i18nStore';
  import { alertStore } from '@/stores/alertStore';
  import { Warning } from '@/exceptions/CustomError';
  import { Eye, EyeOff } from '@lucide/svelte'

  const t = $derived((key:string, defaultValue: string = ''): string => $i18nStore.t(key,defaultValue))

  let username = $state('');
  let password = $state('');
  let errorMessage = $state('');
  let isSubmitting = $state(false);
  let isPasswordVisible = $state(false);

  let isAuthenticated = $derived($authStore.isAuthenticated);
  let currentUser = $derived($authStore.user);
  let currentRole = $derived($authStore.role);
  let inputPassword = $state<HTMLElement | null>(null);

  async function handleLogin(e: SubmitEvent) {
    e.preventDefault();

    isSubmitting = true;
    try {
      if (!username.trim() || !password) throw new Warning(t('login.errorEmpty', 'Username dan password wajib diisi!'));
      // if (password.length < 6) throw new Warning(t('login.errorPasswordLength', 'Password minimal 6 karakter!'));

      const res = await authStore.login(username, password);
      if (!res.success) throw new Error(res.message || t('login.errorInvalid') || 'Kredensial tidak valid!');

        const search = router.route.search;
        const redirectParam = typeof search?.redirect === 'string' ? search.redirect : '';
        const validTargets = ['/', '/company-profile', '/login', '/profile'] as const;
        type AppRoute = typeof validTargets[number];
        const target: AppRoute = validTargets.includes(redirectParam as AppRoute)
          ? (redirectParam as AppRoute)
          : '/profile';
        router.navigate(target);
    } catch (e) {
      alertStore.throwAlert(e as Error);
    } finally {
      isSubmitting = false;
    }
  }

  function togglePasswordVisibility() {
    try {
      isPasswordVisible = !isPasswordVisible;
      if (inputPassword) {
        (inputPassword as HTMLInputElement).type = isPasswordVisible ? 'text' : 'password';
        (inputPassword as HTMLInputElement).focus();
      }
    } catch (e) {
      alertStore.throwAlert(e as Error)
    }
  }

  function handleLogout() {
    authStore.logout();
    username = '';
    password = '';
  }
</script>

<div class="w-full max-w-md mx-auto py-8 sm:py-16 px-4" data-testid="login-page">
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
            {t('login.title')}
          </h1>
          <p class="text-xs font-bold text-gray-500 m-0">
            {t('login.subtitle')}
          </p>
        </div>
      </div>
      <button
        type="button"
        class="nb-btn bg-white hover:bg-gray-100 text-xs font-black px-2.5 py-1.5 cursor-pointer text-black"
        onclick={() => router.navigate('/')}
        data-testid="btn-back-home"
      >
        ← {t('login.backToHome')}
      </button>
    </div>

    <!-- Notice Box: Pengunjung tidak wajib login & Registrasi via DB -->
    <!-- <div class="p-3 bg-yellow-50 border-2 border-nb-black rounded-md shadow-nb-xs mb-6 text-xs font-bold text-yellow-900 flex flex-col gap-1.5" data-testid="login-notice-box">
      <div class="flex items-center gap-1.5 text-black font-extrabold uppercase text-[11px]">
        <span>ℹ️</span>
        <span>{t('login.noticeTitle')}</span>
      </div>
      <p class="m-0 leading-relaxed font-semibold text-gray-800">
        {t('login.noticeBody')}
      </p>
    </div> -->

    {#if isAuthenticated && currentUser}
      <!-- Already logged in view -->
      <div class="flex flex-col gap-4 text-center py-4" data-testid="logged-in-profile">
        <div class="w-16 h-16 mx-auto rounded-full bg-nb-green border-3 border-nb-black shadow-nb flex items-center justify-center text-3xl">
          👤
        </div>
        <div>
          <h2 class="text-lg font-black text-nb-black m-0" data-testid="user-display-name">
            {currentUser.name}
          </h2>
          <p class="text-xs font-extrabold text-gray-500 m-0" data-testid="user-display-username">
            @{currentUser.username}
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
            onclick={handleLogout}
            data-testid="btn-logout"
          >
            🚪 {t('login.logout')}
          </button>
        </div>
      </div>
    {:else}
      <!-- Login Form -->
      <form onsubmit={handleLogin} class="flex flex-col gap-4" data-testid="login-form">
        {#if errorMessage}
          <div class="p-3 bg-red-100 border-2 border-nb-black rounded text-xs font-bold text-red-800 shadow-nb-xs" data-testid="login-error-alert">
            ⚠️ {errorMessage}
          </div>
        {/if}

        <div class="flex flex-col gap-1.5">
          <label for="input-username" class="text-xs font-black uppercase text-nb-black">
            {t('login.usernameLabel')}
          </label>
          <input
            id="input-username"
            type="text"
            bind:value={username}
            placeholder={t('login.usernamePlaceholder')}
            class="nb-input w-full text-sm font-bold"
            data-testid="input-username"
            autocomplete="username"
          />
        </div>

        <div class="flex flex-col gap-1.5">
          <label for="input-password" class="text-xs font-black uppercase text-nb-black">
            {t('login.passwordLabel')}
          </label>
          <div class="relative">
            <input
              id="input-password"
              type="password"
              bind:this={inputPassword}
              bind:value={password}
              placeholder={t('login.passwordPlaceholder')}
              class="nb-input w-full text-sm font-bold"
              data-testid="input-password"
              autocomplete="current-password"
            />
            <!-- button show pass -->
            <button
              type="button"
              class="absolute inset-y-0 right-0 cursor-pointer flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none nb-btn"
              onclick={togglePasswordVisibility}
              data-testid="btn-toggle-password"
            >
            {#if isPasswordVisible}
              <EyeOff size={18} />
            {:else}
              <Eye size={18} />
            {/if}
            </button>
          </div>
        </div>

        <button
          type="submit"
          class="nb-btn bg-nb-yellow hover:bg-yellow-400 text-black text-sm font-black py-2.5 px-4 shadow-nb-sm border-2 border-nb-black cursor-pointer mt-2 disabled:opacity-50"
          disabled={isSubmitting}
          data-testid="btn-login-submit"
        >
          {isSubmitting ? t('login.submitting') : t('login.submitButton')}
        </button>

        <div class="pt-4 border-t-2 border-dashed border-gray-300 text-center">
          <p class="text-xs font-bold text-gray-600 mb-2">
            {t('login.noAccount', 'Belum punya akun?')}
          </p>
          <button
            type="button"
            class="nb-btn bg-nb-blue hover:bg-blue-300 text-black text-xs font-black py-2 px-4 shadow-nb-xs border-2 border-nb-black cursor-pointer w-full"
            onclick={() => router.navigate('/register')}
            data-testid="btn-to-register"
          >
            📝 {t('login.registerHere', 'Daftar Akun Baru')}
          </button>
        </div>
      </form>
    {/if}
  </div>
</div>

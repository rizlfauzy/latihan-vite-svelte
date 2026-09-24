<script lang="ts">
  import { authStore } from '@/stores/authStore';
  import { router } from '@/router';
  import { i18nStore } from '@/stores/i18nStore';
  import { alertStore } from '@/stores/alertStore';
  import { Warning } from '@/exceptions/CustomError';
  import { Eye, EyeOff } from '@lucide/svelte';

  const t = $derived((key: string, defaultValue: string = ''): string => $i18nStore.t(key, defaultValue));

  let name = $state('');
  let username = $state('');
  let password = $state('');
  let isSubmitting = $state(false);
  let isPasswordVisible = $state(false);
  let inputPassword = $state<HTMLElement | null>(null);

  async function handleRegister(e: SubmitEvent) {
    e.preventDefault();

    isSubmitting = true;
    try {
      if (!name.trim() || !username.trim() || !password) {
        throw new Warning(t('register.errorEmpty', 'Nama, username, dan password wajib diisi!'));
      }
      if (password.length < 6) {
        throw new Warning(t('register.errorPasswordLength', 'Password minimal 6 karakter!'));
      }

      const res = await authStore.register(name, username, password);
      if (!res.success) {
        throw new Error(res.message || 'Pendaftaran gagal');
      }

      router.navigate('/profile');
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
      alertStore.throwAlert(e as Error);
    }
  }
</script>

<div class="w-full max-w-md mx-auto py-8 sm:py-16 px-4" data-testid="register-page">
  <!-- Card Container Neo-Brutalism -->
  <div class="nb-card bg-white p-6 sm:p-8 shadow-nb border-4">
    <!-- Header -->
    <div class="flex items-center justify-between gap-3 mb-6 pb-4 border-b-3 border-nb-black">
      <div class="flex items-center gap-2.5">
        <span class="w-10 h-10 rounded bg-nb-green border-2 border-nb-black shadow-nb-sm flex items-center justify-center text-xl font-black">
          📝
        </span>
        <div>
          <h1 class="text-xl sm:text-2xl font-black tracking-tight text-nb-black uppercase m-0">
            {t('register.title', 'DAFTAR AKUN')}
          </h1>
          <p class="text-xs font-bold text-gray-500 m-0">
            {t('register.subtitle', 'Buat akun baru (Role Viewer)')}
          </p>
        </div>
      </div>
      <button
        type="button"
        class="nb-btn bg-white hover:bg-gray-100 text-xs font-black px-2.5 py-1.5 cursor-pointer text-black"
        onclick={() => router.navigate('/login')}
        data-testid="btn-back-login"
      >
        ← {t('login.title', 'Masuk')}
      </button>
    </div>

    <!-- Register Form -->
    <form onsubmit={handleRegister} class="flex flex-col gap-4" data-testid="register-form">
      <div class="flex flex-col gap-1.5">
        <label for="input-register-name" class="text-xs font-black uppercase text-nb-black">
          {t('register.nameLabel', 'NAMA LENGKAP')}
        </label>
        <input
          id="input-register-name"
          type="text"
          bind:value={name}
          placeholder={t('register.namePlaceholder', 'Masukkan nama lengkap...')}
          class="nb-input w-full text-sm font-bold"
          data-testid="input-register-name"
          autocomplete="name"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="input-register-username" class="text-xs font-black uppercase text-nb-black">
          {t('register.usernameLabel', 'USERNAME')}
        </label>
        <input
          id="input-register-username"
          type="text"
          bind:value={username}
          placeholder={t('register.usernamePlaceholder', 'Masukkan username...')}
          class="nb-input w-full text-sm font-bold"
          data-testid="input-register-username"
          autocomplete="username"
        />
      </div>

      <div class="flex flex-col gap-1.5">
        <label for="input-register-password" class="text-xs font-black uppercase text-nb-black">
          {t('register.passwordLabel', 'PASSWORD')}
        </label>
        <div class="relative">
          <input
            id="input-register-password"
            type="password"
            bind:this={inputPassword}
            bind:value={password}
            placeholder={t('register.passwordPlaceholder', 'Minimal 6 karakter...')}
            class="nb-input w-full text-sm font-bold"
            data-testid="input-register-password"
            autocomplete="new-password"
          />
          <!-- button show pass -->
          <button
            type="button"
            class="absolute inset-y-0 right-0 cursor-pointer flex items-center px-3 text-gray-500 hover:text-gray-700 focus:outline-none nb-btn"
            onclick={togglePasswordVisibility}
            data-testid="btn-toggle-register-password"
            aria-label="Toggle password visibility"
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
        class="nb-btn bg-nb-green hover:bg-green-400 text-black text-sm font-black py-2.5 px-4 shadow-nb-sm border-2 border-nb-black cursor-pointer mt-2 disabled:opacity-50"
        disabled={isSubmitting}
        data-testid="btn-register-submit"
      >
        {isSubmitting ? t('register.submitting', 'MENDAFTAR...') : t('register.submitButton', 'DAFTAR SEKARANG ➔')}
      </button>

      <div class="pt-4 border-t-2 border-dashed border-gray-300 text-center">
        <p class="text-xs font-bold text-gray-600 mb-2">
          {t('register.hasAccount', 'Sudah punya akun?')}
        </p>
        <button
          type="button"
          class="nb-btn bg-white hover:bg-gray-100 text-black text-xs font-black py-2 px-4 shadow-nb-xs border-2 border-nb-black cursor-pointer w-full"
          onclick={() => router.navigate('/login')}
          data-testid="btn-link-login"
        >
          🔑 {t('register.loginHere', 'Masuk di Sini')}
        </button>
      </div>
    </form>
  </div>
</div>

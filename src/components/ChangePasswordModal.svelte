<script lang="ts">
  import { Warning } from "@/exceptions/CustomError";
  import { alertStore } from "@/stores/alertStore";
  import { authStore } from "@/stores/authStore";
  import { i18nStore } from "@/stores/i18nStore";
  import { Eye, EyeOff, Lock, X } from "@lucide/svelte";

  let {
    isOpen = $bindable(false),
    onSuccess,
    onClose,
  }: {
    isOpen: boolean;
    onSuccess?: () => void;
    onClose?: () => void;
  } = $props();

  const t = $derived((key: string, defaultValue: string = ""): string => $i18nStore.t(key, defaultValue));

  let oldPassword = $state("");
  let newPassword = $state("");
  let showOldPassword = $state(false);
  let showNewPassword = $state(false);
  let isSubmitting = $state(false);
  let inputOldPassword = $state<HTMLElement | null>(null);
  let inputNewPassword = $state<HTMLElement | null>(null);

  function resetForm() {
    oldPassword = "";
    newPassword = "";
    showOldPassword = false;
    showNewPassword = false;
    isSubmitting = false;
  }

  function handleClose() {
    resetForm();
    isOpen = false;
    onClose?.();
  }

  function handleBackdropClick(e: MouseEvent) {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === "Escape" && isOpen) {
      handleClose();
    }
  }

  async function handleSubmit(e: SubmitEvent) {
    e.preventDefault();

    try {
      if (!oldPassword.trim()) throw new Warning(t("auth.oldPasswordRequired", "Password lama wajib diisi!"));
      if (!newPassword.trim()) throw new Warning(t("auth.newPasswordRequired", "Password baru wajib diisi!"));
      if (newPassword.trim().length < 6) throw new Warning(t("auth.newPasswordMinLength", "Password baru minimal 6 karakter!"));

      isSubmitting = true;
      const res = await authStore.changePassword(oldPassword, newPassword);
      if (res.success) {
        handleClose();
        onSuccess?.();
      } else throw new Warning(res.message || t("auth.changePasswordFailed", "Gagal mengubah password"));
    } catch (e) {
      alertStore.throwAlert(e as Error);
    } finally {
      isSubmitting = false;
    }
  }
</script>

<svelte:window onkeydown={handleKeydown} />

{#if isOpen}
  <div class="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4 overflow-y-auto animate-in" onclick={handleBackdropClick} role="presentation" data-testid="change-password-modal-backdrop">
    <div
      class="nb-card bg-nb-surface text-nb-black w-full max-w-md p-6 my-8 border-4 border-nb-black shadow-nb-lg relative flex flex-col gap-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="change-password-title"
      data-testid="change-password-modal"
    >
      <!-- Header -->
      <div class="flex items-center justify-between border-b-3 border-nb-black pb-3">
        <div class="flex items-center gap-2">
          <div class="p-1.5 bg-nb-yellow border-2 border-nb-black rounded shadow-nb-xs">
            <Lock size={20} class="text-nb-black" />
          </div>
          <div>
            <h2 id="change-password-title" class="text-lg font-black uppercase text-nb-black m-0">
              {t("profile.changePasswordModalTitle", "GANTI PASSWORD")}
            </h2>
            <p class="text-[11px] text-gray-600 font-bold m-0">
              {t("profile.changePasswordModalSubtitle", "Perbarui password akun Anda")}
            </p>
          </div>
        </div>
        <button
          type="button"
          class="nb-btn bg-red-500 hover:bg-nb-pink text-xs font-black p-1.5 w-8 h-8 flex items-center justify-center text-nb-black cursor-pointer"
          onclick={handleClose}
          aria-label={t("layoutModal.close", "Tutup")}
          data-testid="btn-close-change-password"
        >
          <X size={16} />
        </button>
      </div>

      <!-- Form Body -->
      <form onsubmit={handleSubmit} class="flex flex-col gap-4 text-xs font-bold">
        <!-- Input Password Lama -->
        <div class="flex flex-col gap-1.5">
          <label for="old-password" class="text-xs font-black uppercase text-nb-black">
            {t("profile.oldPasswordLabel", "Password Lama *")}
          </label>
          <div class="relative flex items-center">
            <input
              id="old-password"
              type={showOldPassword ? "text" : "password"}
              bind:this={inputOldPassword}
              bind:value={oldPassword}
              placeholder={t("profile.oldPasswordPlaceholder", "Masukkan password saat ini")}
              class="nb-input w-full text-sm font-bold"
              data-testid="input-old-password"
            />
            <button
              type="button"
              class="absolute right-2 p-1 text-gray-700 hover:text-black cursor-pointer"
              onclick={() => {
                showOldPassword = !showOldPassword;
                inputOldPassword?.focus();
              }}
              aria-label={showOldPassword ? "Sembunyikan password" : "Lihat password"}
              data-testid="btn-toggle-old-password"
            >
              {#if showOldPassword}
                <EyeOff size={16} />
              {:else}
                <Eye size={16} />
              {/if}
            </button>
          </div>
        </div>

        <!-- Input Password Baru -->
        <div class="flex flex-col gap-1.5">
          <label for="new-password" class="text-xs font-black uppercase text-nb-black">
            {t("profile.newPasswordLabel", "Password Baru *")}
          </label>
          <div class="relative flex items-center">
            <input
              id="new-password"
              type={showNewPassword ? "text" : "password"}
              bind:this={inputNewPassword}
              bind:value={newPassword}
              placeholder={t("profile.newPasswordPlaceholder", "Minimal 6 karakter")}
              class="nb-input w-full text-sm font-bold"
              data-testid="input-new-password"
            />
            <button
              type="button"
              class="absolute right-2 p-1 text-gray-700 hover:text-black cursor-pointer"
              onclick={() => {
                showNewPassword = !showNewPassword;
                inputNewPassword?.focus();
              }}
              aria-label={showNewPassword ? "Sembunyikan password" : "Lihat password"}
              data-testid="btn-toggle-new-password"
            >
              {#if showNewPassword}
                <EyeOff size={16} />
              {:else}
                <Eye size={16} />
              {/if}
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-2.5 pt-3 border-t-2 border-dashed border-nb-black mt-2">
          <button type="button" class="nb-btn bg-white hover:bg-gray-100 text-xs px-4 py-2 border-2 border-nb-black text-black cursor-pointer" onclick={handleClose} data-testid="btn-cancel-change-password">
            {t("action.cancel", "BATAL")}
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            class="nb-btn bg-nb-yellow hover:bg-yellow-400 text-xs font-black px-4 py-2 border-2 border-nb-black text-black cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="btn-submit-change-password"
          >
            {isSubmitting ? t("common.saving", "Menyimpan...") : t("action.save", "💾 SIMPAN PERUBAHAN")}
          </button>
        </div>
      </form>
    </div>
  </div>
{/if}

<script lang="ts">
  import { onMount } from 'svelte';
  import { authStore, type User } from '@/stores/authStore';
  import { alertStore } from '@/stores/alertStore';
  import { i18nStore } from '@/stores/i18nStore';
  import ConfirmModal from '@/components/ConfirmModal.svelte';

  const t = $derived((key: string, defaultValue?: string): string => $i18nStore.t(key, defaultValue));

  let users = $state<User[]>([]);
  let isLoading = $state(true);
  let targetUserToToggle = $state<User | null>(null);

  const currentUser = $derived($authStore.user);
  const totalUsers = $derived(users.length);
  const superadminCount = $derived(
    users.filter((u) => u.role?.is_debug || u.roleId === 1 || u.role?.name === 'SUPERADMIN').length
  );
  const viewerCount = $derived(totalUsers - superadminCount);

  async function loadUsers() {
    isLoading = true;
    try {
      users = await authStore.fetchAllUsers();
    } catch (err) {
      alertStore.throwAlert(err as Error);
    } finally {
      isLoading = false;
    }
  }

  function promptToggleRole(u: User) {
    if (currentUser?.uuid === u.uuid && (u.roleId === 1 || u.role?.is_debug)) {
      alertStore.showError(t('users.cannotDemoteSelf', 'Tidak dapat menurunkan role akun sendiri yang sedang aktif!'));
      return;
    }
    targetUserToToggle = u;
  }

  async function confirmToggleRole() {
    if (!targetUserToToggle) return;
    const user = targetUserToToggle;
    targetUserToToggle = null;

    const isCurrentAdmin = user.role?.is_debug || user.roleId === 1 || user.role?.name === 'SUPERADMIN';
    const nextRoleId = isCurrentAdmin ? 2 : 1;

    try {
      const ok = await authStore.updateUserRole(user.uuid, nextRoleId);
      if (ok) {
        await loadUsers();
      }
    } catch (err) {
      alertStore.throwAlert(err as Error);
    }
  }

  onMount(() => {
    loadUsers();
  });
</script>

<div class="flex flex-col gap-6 w-full" data-testid="users-management-page">
  <!-- Page Header -->
  <div class="flex items-center justify-between flex-wrap gap-4">
    <div class="flex flex-col gap-1">
      <div class="inline-flex items-center gap-2.5 bg-nb-yellow px-4.5 py-2 border-3 border-nb-black shadow-nb rounded-md text-lg md:text-xl font-extrabold uppercase tracking-wide text-black w-fit">
        <span>👥</span>
        <span>{t('users.title', 'MANAJEMEN PENGGUNA')}</span>
      </div>
      <p class="text-sm font-bold text-gray-600 m-0">
        {t('users.subtitle', 'Kelola hak akses dan role akun terdaftar')}
      </p>
    </div>

    <div class="flex items-center gap-2">
      <button
        type="button"
        class="nb-btn bg-white hover:bg-nb-yellow text-xs font-black px-3.5 py-2 flex items-center gap-1.5 cursor-pointer text-black"
        onclick={loadUsers}
        disabled={isLoading}
        data-testid="btn-refresh-users"
      >
        <span>🔄</span>
        <span>{isLoading ? 'Memuat...' : 'Muat Ulang'}</span>
      </button>

      <a
        href="/"
        class="nb-btn bg-nb-yellow text-black text-xs font-black px-3.5 py-2 flex items-center gap-1.5"
        data-testid="btn-back-dashboard"
      >
        <span>←</span>
        <span>Kembali ke Dashboard</span>
      </a>
    </div>
  </div>

  <!-- Summary Stats -->
  <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
    <div class="nb-card bg-white p-4 flex flex-col gap-1 text-black">
      <span class="text-xs font-bold text-gray-500 uppercase">Total Pengguna</span>
      <span class="text-2xl font-black">{totalUsers}</span>
    </div>
    <div class="nb-card bg-nb-yellow p-4 flex flex-col gap-1 text-black">
      <span class="text-xs font-bold text-gray-800 uppercase">Superadmin (Debug)</span>
      <span class="text-2xl font-black">{superadminCount}</span>
    </div>
    <div class="nb-card bg-nb-surface p-4 flex flex-col gap-1 text-black">
      <span class="text-xs font-bold text-gray-500 uppercase">Viewer</span>
      <span class="text-2xl font-black">{viewerCount}</span>
    </div>
  </div>

  <!-- Users Table Card -->
  <div class="nb-card bg-white overflow-hidden p-0 text-black">
    <div class="p-4 border-b-2 border-nb-black bg-gray-50 flex items-center justify-between">
      <h2 class="text-base font-black uppercase m-0">{t('users.userList', 'DAFTAR PENGGUNA')}</h2>
      <span class="text-xs font-bold text-gray-500">{users.length} akun</span>
    </div>

    {#if isLoading}
      <div class="p-12 text-center text-gray-500 font-bold" data-testid="users-loading-state">
        <p class="m-0 animate-pulse">Memuat data pengguna...</p>
      </div>
    {:else if users.length === 0}
      <div class="p-12 text-center text-gray-500 font-bold" data-testid="users-empty-state">
        <p class="m-0">Belum ada data pengguna terdaftar.</p>
      </div>
    {:else}
      <div class="overflow-x-auto">
        <table class="w-full text-left border-collapse" data-testid="users-table">
          <thead>
            <tr class="border-b-2 border-nb-black bg-yellow-50 text-xs font-black uppercase text-nb-black">
              <th class="p-3.5">#</th>
              <th class="p-3.5">{t('users.name', 'Nama Lengkap')}</th>
              <th class="p-3.5">{t('users.username', 'Username')}</th>
              <th class="p-3.5">{t('users.role', 'Role & Akses')}</th>
              <th class="p-3.5 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {#each users as u, idx (u.uuid || u.username)}
              {@const isSuperadmin = u.role?.is_debug || u.roleId === 1 || u.role?.name === 'SUPERADMIN'}
              {@const isSelf = currentUser?.uuid === u.uuid}

              <tr
                class="border-b border-gray-200 hover:bg-gray-50 transition-colors text-sm font-semibold"
                data-testid={`user-row-${u.username}`}
              >
                <td class="p-3.5 font-bold text-gray-400">{idx + 1}</td>
                <td class="p-3.5 font-bold text-nb-black">
                  <div class="flex items-center gap-2">
                    <span>{u.name}</span>
                    {#if isSelf}
                      <span class="nb-badge bg-blue-100 text-blue-900 text-[10px] py-0 px-1.5 border border-nb-black">
                        Anda
                      </span>
                    {/if}
                  </div>
                </td>
                <td class="p-3.5 text-gray-600 font-mono text-xs">@{u.username}</td>
                <td class="p-3.5">
                  <span
                    class="nb-badge text-xs font-black {isSuperadmin ? 'bg-nb-yellow text-black' : 'bg-gray-200 text-gray-800'}"
                    data-testid={`user-role-badge-${u.username}`}
                  >
                    {isSuperadmin ? '⚡ SUPERADMIN' : '👁️ VIEWER'}
                  </span>
                </td>
                <td class="p-3.5 text-right">
                  <button
                    type="button"
                    class="nb-btn text-xs px-3 py-1.5 font-black border-2 border-nb-black shadow-nb-xs cursor-pointer transition-all {isSuperadmin ? 'bg-nb-red text-white hover:bg-red-600' : 'bg-nb-green text-black hover:bg-green-400'} {isSelf && isSuperadmin ? 'opacity-50 cursor-not-allowed' : ''}"
                    disabled={isSelf && isSuperadmin}
                    onclick={() => promptToggleRole(u)}
                    data-testid={`btn-toggle-role-${u.username}`}
                    title={isSelf && isSuperadmin ? t('users.cannotDemoteSelf', 'Tidak dapat menurunkan role akun sendiri yang sedang aktif!') : `Ubah role ke ${isSuperadmin ? 'VIEWER' : 'SUPERADMIN'}`}
                  >
                    {isSuperadmin ? '🔻 Turunkan ke Viewer' : '🔺 Naikkan ke Admin'}
                  </button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}
  </div>

  <!-- Role Toggle Confirmation Modal -->
  <ConfirmModal
    isOpen={targetUserToToggle !== null}
    title="Konfirmasi Perubahan Role"
    message={`Apakah Anda yakin ingin mengubah role akun @${targetUserToToggle?.username} (${targetUserToToggle?.name}) menjadi ${(targetUserToToggle?.role?.is_debug || targetUserToToggle?.roleId === 1) ? 'VIEWER' : 'SUPERADMIN'}?`}
    itemText={targetUserToToggle ? `${targetUserToToggle.name} (@${targetUserToToggle.username})` : ''}
    confirmText="Ya, Ubah Role"
    cancelText="Batal"
    onConfirm={confirmToggleRole}
    onCancel={() => { targetUserToToggle = null; }}
  />
</div>

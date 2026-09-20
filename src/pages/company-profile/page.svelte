<script lang="ts">
  import { env } from '@/lib/env';
  import { i18nStore } from '@/stores/i18nStore';
</script>

<div class="flex flex-col gap-8 w-full" data-testid="company-profile-container">
  <!-- Header / Hero Section -->
  <section id="profile" class="nb-card bg-nb-yellow p-6 sm:p-8 relative overflow-hidden scroll-mt-24">
    <div class="inline-flex items-center gap-2 bg-white px-3 py-1 border-2 border-nb-black shadow-nb-sm text-xs font-black uppercase mb-4">
      <span>🏢</span>
      <span data-testid="cp-badge">{$i18nStore.t('cp.badge')}</span>
    </div>

    <h1 class="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-tight text-nb-black mb-3" data-testid="cp-title">
      {$i18nStore.t('cp.title')}
    </h1>

    <p class="text-base sm:text-lg font-bold text-gray-800 max-w-2xl leading-relaxed mb-6" data-testid="cp-hero-desc">
      {$i18nStore.t('cp.heroDesc')}
    </p>

    <div class="flex flex-wrap items-center gap-3">
      <a href="/" class="nb-btn bg-white text-sm px-5 py-2.5" data-testid="cp-back-btn">
        {$i18nStore.t('cp.backDashboard')}
      </a>
      <a
        href="https://wa.me/6281234567890?text=Halo%20PIC%20Svelte%20Hub,%20saya%20tertarik%20dengan%20solusi%20perusahaan%20Anda."
        target="_blank"
        rel="noopener noreferrer"
        class="nb-btn bg-nb-green text-sm px-5 py-2.5 flex items-center gap-2"
        data-testid="cp-contact-wa"
      >
        <span>💬</span>
        <span>{$i18nStore.t('cp.contactWa')}</span>
      </a>
    </div>
  </section>

  <!-- Numbers / Highlights -->
  <section class="grid grid-cols-2 md:grid-cols-4 gap-4">
    <div class="nb-card bg-nb-pink p-4 text-center">
      <div class="text-3xl sm:text-4xl font-black text-nb-black">100%</div>
      <div class="text-xs sm:text-sm font-extrabold uppercase mt-1">NEO BRUTALISM</div>
    </div>
    <div class="nb-card bg-nb-blue p-4 text-center">
      <div class="text-3xl sm:text-4xl font-black text-nb-black">SVELTE 5</div>
      <div class="text-xs sm:text-sm font-extrabold uppercase mt-1">RUNES ARCHITECTURE</div>
    </div>
    <div class="nb-card bg-nb-green p-4 text-center">
      <div class="text-3xl sm:text-4xl font-black text-nb-black">&lt;100ms</div>
      <div class="text-xs sm:text-sm font-extrabold uppercase mt-1">{$i18nStore.t('cp.metricSpeed')}</div>
    </div>
    <div class="nb-card bg-nb-purple p-4 text-center">
      <div class="text-3xl sm:text-4xl font-black text-nb-black">24/7</div>
      <div class="text-xs sm:text-sm font-extrabold uppercase mt-1">{$i18nStore.t('cp.metricSupport')}</div>
    </div>
  </section>

  <!-- Visi & Misi -->
  <section id="vision-mission" class="grid grid-cols-1 md:grid-cols-2 gap-6 scroll-mt-24">
    <div class="nb-card bg-white p-6 flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <span class="text-2xl">🎯</span>
        <h2 class="text-xl font-black uppercase tracking-tight" data-testid="cp-vision-title">
          {$i18nStore.t('cp.visionTitle')}
        </h2>
      </div>
      <p class="text-sm font-bold text-gray-700 leading-relaxed" data-testid="cp-vision-desc">
        {$i18nStore.t('cp.visionDesc')}
      </p>
    </div>

    <div class="nb-card bg-white p-6 flex flex-col gap-3">
      <div class="flex items-center gap-2">
        <span class="text-2xl">🚀</span>
        <h2 class="text-xl font-black uppercase tracking-tight" data-testid="cp-mission-title">
          {$i18nStore.t('cp.missionTitle')}
        </h2>
      </div>
      <ul class="text-sm font-bold text-gray-700 space-y-2 list-disc list-inside">
        <li>{$i18nStore.t('cp.mission1')}</li>
        <li>{$i18nStore.t('cp.mission2')}</li>
        <li>{$i18nStore.t('cp.mission3')}</li>
      </ul>
    </div>
  </section>

  <!-- Core Services & Tech Stack -->
  <section id="services" class="nb-card bg-white p-6 sm:p-8 scroll-mt-24">
    <div class="inline-flex items-center gap-2 bg-nb-blue text-nb-black px-3 py-1 border-2 border-nb-black shadow-nb-sm text-xs font-black uppercase mb-5">
      <span>🛠️</span>
      <span>{$i18nStore.t('cp.servicesBadge')}</span>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      <div class="border-3 border-nb-black p-4 bg-nb-bg shadow-nb-sm">
        <div class="text-2xl mb-2">⚡</div>
        <h3 class="text-base font-black uppercase mb-1">{$i18nStore.t('cp.service1Title')}</h3>
        <p class="text-xs font-bold text-gray-700">{$i18nStore.t('cp.service1Desc')}</p>
      </div>

      <div class="border-3 border-nb-black p-4 bg-nb-bg shadow-nb-sm">
        <div class="text-2xl mb-2">🎨</div>
        <h3 class="text-base font-black uppercase mb-1">{$i18nStore.t('cp.service2Title')}</h3>
        <p class="text-xs font-bold text-gray-700">{$i18nStore.t('cp.service2Desc')}</p>
      </div>

      <div class="border-3 border-nb-black p-4 bg-nb-bg shadow-nb-sm">
        <div class="text-2xl mb-2">🛡️</div>
        <h3 class="text-base font-black uppercase mb-1">{$i18nStore.t('cp.service3Title')}</h3>
        <p class="text-xs font-bold text-gray-700">{$i18nStore.t('cp.service3Desc')}</p>
      </div>
    </div>
  </section>

  <!-- PIC & Leadership -->
  <section id="contact" class="nb-card bg-nb-purple p-6 sm:p-8 scroll-mt-24">
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div>
        <div class="inline-flex items-center gap-2 bg-white px-3 py-1 border-2 border-nb-black shadow-nb-sm text-xs font-black uppercase mb-2">
          <span>👑</span>
          <span>{$i18nStore.t('cp.leadBadge')}</span>
        </div>
        <h2 class="text-2xl sm:text-3xl font-black uppercase text-nb-black">
          Rizal Fauzi
        </h2>
        <p class="text-sm font-extrabold text-gray-900 mt-1">
          {$i18nStore.t('cp.leadRole')}
        </p>
        <p class="text-xs font-bold text-gray-800 mt-2 max-w-xl">
          {$i18nStore.t('cp.leadBio')}
        </p>
      </div>

      <a
        href="https://wa.me/6281234567890?text=Halo%20Rizal%20Fauzi,%20saya%20ingin%20berdiskusi%20terkait%20Svelte%20Hub."
        target="_blank"
        rel="noopener noreferrer"
        class="nb-btn bg-nb-green text-sm px-5 py-3 whitespace-nowrap flex items-center gap-2"
        data-testid="cp-lead-wa-btn"
      >
        <span>💬</span>
        <span>{$i18nStore.t('cp.leadWaBtn')}</span>
      </a>
    </div>
  </section>
</div>

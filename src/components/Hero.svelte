<script lang="ts">
  import { i18nStore } from '@/stores/i18nStore';

  const envTitle = import.meta.env.VITE_APP_TITLE || "SVELTE HUB";
  const envLogo = import.meta.env.VITE_APP_LOGO_URL || "/logo.svg";

  let {
    title = envTitle,
    subtitle,
    logoUrl = envLogo
  }: {
    title?: string;
    subtitle?: string;
    logoUrl?: string;
  } = $props();

  const resolvedSubtitle = $derived(subtitle ?? $i18nStore.t('hero.subtitle'));
</script>

<header class="w-full flex justify-center">
  <div class="nb-card w-full flex flex-col items-center text-center p-6 md:p-9 gap-5 relative overflow-hidden bg-nb-surface">
    <div class="inline-flex items-center justify-center p-2 transition-transform duration-200 hover:-rotate-3 hover:scale-105">
      <img src={logoUrl} alt="{title} Logo" class="w-24 h-24 md:w-28 md:h-28 block" />
    </div>
    
    <div class="flex flex-col items-center gap-3">
      <div class="flex gap-2 flex-wrap justify-center">
        <span class="nb-badge bg-nb-pink text-white">{$i18nStore.t('hero.badgeSvelte')}</span>
        <span class="nb-badge bg-nb-blue">{$i18nStore.t('hero.badgeVite')}</span>
        <span class="nb-badge bg-nb-green">{$i18nStore.t('hero.badgeDocker')}</span>
      </div>

      <h1 class="text-3xl md:text-5xl font-black tracking-tight uppercase m-0 leading-tight">
        {title}
      </h1>
      <p class="text-sm md:text-lg text-gray-700 font-semibold max-w-xl m-0 leading-snug">
        {resolvedSubtitle}
      </p>
    </div>
  </div>
</header>

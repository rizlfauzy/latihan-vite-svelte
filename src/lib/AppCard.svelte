<script lang="ts">
  import type { AppItem } from '../data/apps';

  let { app }: { app: AppItem } = $props();
</script>

<a
  href={app.url}
  target="_blank"
  rel="noopener noreferrer"
  class="nb-card nb-card-interactive group flex flex-col justify-between gap-4 no-underline text-inherit cursor-pointer bg-nb-surface"
>
  <div class="flex items-center justify-between gap-2.5">
    <div
      class="w-12 h-12 border-2 border-nb-black rounded-md shadow-[2px_2px_0px_#121212] flex items-center justify-center"
      style="background: {app.color};"
    >
      <span class="text-2xl leading-none">{app.icon}</span>
    </div>
    <span class="nb-badge" style="background: {app.color};">
      {app.category}
    </span>
  </div>

  <div class="flex flex-col gap-2 grow">
    <h3 class="text-xl font-extrabold m-0">{app.name}</h3>
    <p class="text-sm text-gray-600 font-medium leading-relaxed m-0">{app.description}</p>
  </div>

  <div class="pt-3 border-t-2 border-dashed border-gray-200">
    <span class="text-xs font-extrabold font-mono inline-flex items-center gap-1 tracking-wider">
      BUKA APLIKASI
      <span class="text-base transition-transform duration-150 group-hover:translate-x-1 group-hover:-translate-y-1">
        ↗
      </span>
    </span>
  </div>
</a>

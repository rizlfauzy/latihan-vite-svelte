<div class="flex flex-col gap-8 w-full" data-testid="company-profile-skeleton">
  <!-- Hero Section Skeleton -->
  <section class="nb-card bg-nb-yellow/30 dark:bg-zinc-800/40 p-6 sm:p-8 relative overflow-hidden border-3 border-nb-black shadow-nb">
    <!-- Badge -->
    <div class="h-6 w-32 nb-skeleton-box rounded-md mb-4"></div>
    <!-- Big Title -->
    <div class="h-10 sm:h-12 w-3/4 max-w-lg nb-skeleton-box rounded-md mb-3"></div>
    <!-- Description -->
    <div class="space-y-2 mb-6 max-w-2xl">
      <div class="h-4 w-full nb-skeleton-box rounded-sm"></div>
      <div class="h-4 w-5/6 nb-skeleton-box rounded-sm"></div>
    </div>
    <!-- Buttons -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="h-10 w-44 nb-skeleton-box rounded-md"></div>
      <div class="h-10 w-44 nb-skeleton-box rounded-md"></div>
    </div>
  </section>

  <!-- Highlights / Metrics Cards (4x) -->
  <section class="grid grid-cols-2 md:grid-cols-4 gap-4">
    {#each [1, 2, 3, 4] as idx (idx)}
      <div class="nb-card bg-white dark:bg-zinc-900 p-4 text-center border-3 border-nb-black shadow-nb flex flex-col items-center justify-center gap-2">
        <div class="h-9 w-20 nb-skeleton-box rounded-md"></div>
        <div class="h-4 w-28 nb-skeleton-box rounded-sm"></div>
      </div>
    {/each}
  </section>

  <!-- Vision & Mission Skeleton (2 cards) -->
  <section class="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div class="nb-card bg-white dark:bg-zinc-900 p-6 flex flex-col gap-3 border-3 border-nb-black shadow-nb">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 nb-skeleton-box rounded-md"></div>
        <div class="h-6 w-36 nb-skeleton-box rounded-md"></div>
      </div>
      <div class="space-y-2 mt-1">
        <div class="h-4 w-full nb-skeleton-box rounded-sm"></div>
        <div class="h-4 w-4/5 nb-skeleton-box rounded-sm"></div>
      </div>
    </div>

    <div class="nb-card bg-white dark:bg-zinc-900 p-6 flex flex-col gap-3 border-3 border-nb-black shadow-nb">
      <div class="flex items-center gap-2">
        <div class="w-7 h-7 nb-skeleton-box rounded-md"></div>
        <div class="h-6 w-36 nb-skeleton-box rounded-md"></div>
      </div>
      <div class="space-y-2 mt-1">
        <div class="h-4 w-5/6 nb-skeleton-box rounded-sm"></div>
        <div class="h-4 w-4/6 nb-skeleton-box rounded-sm"></div>
        <div class="h-4 w-3/4 nb-skeleton-box rounded-sm"></div>
      </div>
    </div>
  </section>

  <!-- Services Section Skeleton -->
  <section class="nb-card bg-white dark:bg-zinc-900 p-6 sm:p-8 border-3 border-nb-black shadow-nb">
    <div class="h-6 w-36 nb-skeleton-box rounded-md mb-5"></div>
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {#each [1, 2, 3] as idx (idx)}
        <div class="border-3 border-nb-black p-4 bg-nb-bg dark:bg-zinc-800 shadow-nb-sm flex flex-col gap-2">
          <div class="w-8 h-8 nb-skeleton-box rounded-md mb-1"></div>
          <div class="h-5 w-3/4 nb-skeleton-box rounded-sm"></div>
          <div class="h-3.5 w-full nb-skeleton-box rounded-sm"></div>
          <div class="h-3.5 w-4/5 nb-skeleton-box rounded-sm"></div>
        </div>
      {/each}
    </div>
  </section>

  <!-- Leadership / Contact Skeleton -->
  <section class="nb-card bg-nb-purple/30 dark:bg-zinc-800/40 p-6 sm:p-8 border-3 border-nb-black shadow-nb">
    <div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
      <div class="flex-1 w-full space-y-3">
        <div class="h-6 w-28 nb-skeleton-box rounded-md"></div>
        <div class="h-8 w-48 nb-skeleton-box rounded-md"></div>
        <div class="h-4 w-40 nb-skeleton-box rounded-sm"></div>
        <div class="h-4 w-3/4 max-w-lg nb-skeleton-box rounded-sm"></div>
      </div>
      <div class="h-11 w-44 nb-skeleton-box rounded-md"></div>
    </div>
  </section>
</div>

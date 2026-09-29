<script lang="ts">
  import Hero from '@/components/Hero.svelte';
  import AppGrid from '@/components/AppGrid.svelte';
  import TodoList from '@/components/TodoList.svelte';
  import { sectionStore } from '@/stores/sectionStore';

  let homeSections = $derived(
    $sectionStore.sections
      .filter((s) => s.page === 'home')
      .sort((a, b) => a.orderIndex - b.orderIndex)
  );
</script>

<div class="flex flex-col gap-10 w-full" data-testid="home-page-container">
  {#each homeSections as sec (sec.sectionKey)}
    {#if sec.visible}
      {#if sec.sectionKey === 'hero'}
        <div data-testid="section-wrapper-hero">
          <Hero />
        </div>
      {:else if sec.sectionKey === 'apps-hub'}
        <div id="apps-hub" class="scroll-mt-24" data-testid="section-wrapper-apps-hub">
          <AppGrid />
        </div>
      {:else if sec.sectionKey === 'todo-list'}
        <div id="todo-list" class="scroll-mt-24" data-testid="section-wrapper-todo-list">
          <TodoList />
        </div>
      {/if}
    {/if}
  {/each}
</div>

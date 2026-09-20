<script lang="ts">
  import Hero from '@/components/Hero.svelte';
  import AppGrid from '@/components/AppGrid.svelte';
  import TodoList from '@/components/TodoList.svelte';
</script>

<div class="flex flex-col gap-10 w-full">
  <Hero />
  <div id="apps-hub" class="scroll-mt-24">
    <AppGrid />
  </div>
  <div id="todo-list" class="scroll-mt-24">
    <TodoList />
  </div>
</div>

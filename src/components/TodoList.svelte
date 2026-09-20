<script lang="ts">
  import ConfirmModal from './ConfirmModal.svelte';
  import SkeletonTodo from './SkeletonTodo.svelte';
  import { alertStore } from '@/stores/alertStore';
  import { i18nStore } from '@/stores/i18nStore';
  import { todoStore, type Todo, type SubTask } from '@/stores/todoStore';

  type DeleteTarget =
    | { type: 'todo'; id: string; text: string }
    | { type: 'subtask'; todoId: string; subTaskId: string; text: string }
    | null;

  let newTodoText = $state('');
  let filter = $state<'all' | 'active' | 'done'>('all');

  // Track expanded state for each todo's sub-tasks
  let expandedTodoIds = $state<Record<string, boolean>>({
    '1': true,
    '2': true,
    '3': true
  });

  // Track input text for new sub-task per todo
  let subTaskInputs = $state<Record<string, string>>({});

  // Target item for deletion confirmation modal
  let deleteTarget = $state<DeleteTarget>(null);

  const todos = $derived($todoStore.todos);
  const isLoading = $derived($todoStore.isLoading);

  const remainingCount = $derived(todos.filter((t) => !t.done).length);
  const completedCount = $derived(todos.filter((t) => t.done).length);

  const filteredTodos = $derived(
    todos.filter((t) => {
      if (filter === 'active') return !t.done;
      if (filter === 'done') return t.done;
      return true;
    })
  );

  async function addTodo(e?: Event) {
    if (e) e.preventDefault();
    const trimmed = newTodoText.trim();
    try {
      if (!trimmed) throw new Error('Catatan tidak boleh kosong');
      const newTodo = await todoStore.addTodo(trimmed);
      expandedTodoIds[newTodo.id] = true;
      newTodoText = '';
    } catch (e) {
      console.error('Failed to add todo', e);
      alertStore.showError(`Gagal menambahkan catatan "${(e as Error).message}"!`);
    }
  }

  function handleTodoKeydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addTodo();
    }
  }

  function toggleTodo(id: string) {
    todoStore.toggleTodo(id);
  }

  function promptDeleteTodo(todo: Todo) {
    deleteTarget = {
      type: 'todo',
      id: todo.id,
      text: todo.text
    };
  }

  function deleteTodo(id: string) {
    todoStore.deleteTodo(id);
  }

  function promptDeleteSubTask(todoId: string, sub: SubTask) {
    deleteTarget = {
      type: 'subtask',
      todoId,
      subTaskId: sub.id,
      text: sub.text
    };
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'todo') {
      deleteTodo(deleteTarget.id);
    } else if (deleteTarget.type === 'subtask') {
      deleteSubTask(deleteTarget.todoId, deleteTarget.subTaskId);
    }
    deleteTarget = null;
  }

  function handleCancelDelete() {
    deleteTarget = null;
  }

  function clearCompleted() {
    todoStore.clearCompleted();
  }

  function toggleExpand(id: string) {
    expandedTodoIds[id] = !expandedTodoIds[id];
  }

  function addSubTask(todoId: string, e?: Event) {
    if (e) e.preventDefault();
    const inputVal = (subTaskInputs[todoId] || '').trim();
    if (!inputVal) return;

    todoStore.addSubTask(todoId, inputVal);
    subTaskInputs[todoId] = '';
    expandedTodoIds[todoId] = true;
  }

  function handleSubTaskKeydown(todoId: string, e: KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addSubTask(todoId);
    }
  }

  function toggleSubTask(todoId: string, subTaskId: string) {
    todoStore.toggleSubTask(todoId, subTaskId);
  }

  function deleteSubTask(todoId: string, subTaskId: string) {
    todoStore.deleteSubTask(todoId, subTaskId);
  }
</script>

<section class="w-full">
  <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
    <div class="inline-flex items-center gap-2.5 bg-nb-yellow px-4.5 py-2 border-3 border-nb-black shadow-nb rounded-md text-lg md:text-xl font-extrabold uppercase tracking-wide text-black">
      <span>📝</span>
      <span>{$i18nStore.t('todo.title')}</span>
    </div>

    <div class="flex gap-2">
      <span class="nb-badge bg-nb-yellow text-black">
        {remainingCount} {$i18nStore.t('todo.pending')}
      </span>
      {#if completedCount > 0}
        <span class="nb-badge bg-nb-green">
          {completedCount} {$i18nStore.t('todo.completed')}
        </span>
      {/if}
    </div>
  </div>

  <div class="nb-card flex flex-col gap-5 bg-nb-surface">
    <!-- Form Tambah Todo -->
    <form onsubmit={addTodo} class="flex flex-col gap-2">
      <div class="flex flex-col sm:flex-row gap-3 items-stretch">
        <textarea
          bind:value={newTodoText}
          onkeydown={handleTodoKeydown}
          placeholder={$i18nStore.t('todo.placeholder')}
          rows="2"
          class="nb-input grow resize-y min-h-14 leading-relaxed"
          data-testid="todo-input"
        ></textarea>
        <button
          type="submit"
          class="nb-btn bg-nb-pink whitespace-nowrap px-6 py-3 self-start sm:self-auto flex items-center justify-center gap-1.5"
          data-testid="todo-add-button"
        >
          <span>+</span>
          <span>{$i18nStore.t('todo.addButton')}</span>
        </button>
      </div>

      <!-- Shortcut Info Helper -->
      <div class="flex items-center gap-1.5 text-xs font-bold text-gray-500 select-none">
        <span>💡</span>
        <span>
          {$i18nStore.t('todo.shortcutPrefix')} <kbd class="px-1.5 py-0.5 border border-nb-black rounded bg-nb-yellow text-black font-mono text-[11px] shadow-nb-xs">Enter</kbd> {$i18nStore.t('todo.shortcutToSave')}, <kbd class="px-1.5 py-0.5 border border-nb-black rounded bg-gray-200 text-black font-mono text-[11px] shadow-nb-xs">Shift + Enter</kbd> {$i18nStore.t('todo.shortcutForNewLine')}
        </span>
      </div>
    </form>

    <!-- Filters & Action Toolbar -->
    <div class="flex justify-between items-center flex-wrap gap-3 pb-3 border-b-2 border-dashed border-gray-300">
      <div class="flex gap-2 flex-wrap">
        <button
          type="button"
          class="nb-btn text-xs px-3.5 py-1.5 {filter === 'all' ? 'bg-nb-yellow' : 'bg-white'}"
          onclick={() => (filter = 'all')}
          data-testid="filter-all"
        >
          {$i18nStore.t('todo.filterAll')} ({todos.length})
        </button>
        <button
          type="button"
          class="nb-btn text-xs px-3.5 py-1.5 {filter === 'active' ? 'bg-nb-yellow' : 'bg-white'}"
          onclick={() => (filter = 'active')}
          data-testid="filter-active"
        >
          {$i18nStore.t('todo.filterActive')} ({remainingCount})
        </button>
        <button
          type="button"
          class="nb-btn text-xs px-3.5 py-1.5 {filter === 'done' ? 'bg-nb-yellow' : 'bg-white'}"
          onclick={() => (filter = 'done')}
          data-testid="filter-done"
        >
          {$i18nStore.t('todo.filterDone')} ({completedCount})
        </button>
      </div>

      {#if completedCount > 0}
        <button
          type="button"
          class="nb-btn bg-nb-red text-white text-xs px-3.5 py-1.5"
          onclick={clearCompleted}
          data-testid="clear-completed-button"
        >
          {$i18nStore.t('todo.clearCompleted')}
        </button>
      {/if}
    </div>

    <!-- List Items -->
    <ul class="list-none flex flex-col gap-4 p-0 m-0">
      {#if isLoading}
        <div class="flex flex-col gap-3" data-testid="todos-skeleton-list">
          <SkeletonTodo />
          <SkeletonTodo />
          <SkeletonTodo />
        </div>
      {:else if filteredTodos.length === 0}
        <li class="p-9 text-center border-2 border-dashed border-gray-300 rounded-md text-gray-500 font-semibold">
          <p class="m-0">{$i18nStore.t('todo.emptyState')}</p>
        </li>
      {:else}
        {#each filteredTodos as todo (todo.id)}
          {@const subList = todo.subTasks || []}
          {@const subDoneCount = subList.filter((s) => s.done).length}
          {@const isExpanded = expandedTodoIds[todo.id] ?? false}

          <li
            class="flex flex-col border-2 border-nb-black rounded-md shadow-nb-sm overflow-hidden transition-all duration-100 {todo.done
              ? 'bg-gray-100 opacity-80'
              : 'bg-white'}"
            data-testid={`todo-item-${todo.id}`}
          >
            <!-- Parent Todo Row -->
            <div class="flex items-center justify-between gap-3 p-3.5 sm:px-4.5 bg-gray-50 border-b-2 border-nb-black">
              <!-- Expand / Collapse Button -->
              <button
                type="button"
                class="w-7 h-7 shrink-0 border-2 border-nb-black bg-white rounded flex items-center justify-center font-bold text-xs cursor-pointer shadow-nb-xs hover:bg-nb-yellow transition-colors"
                onclick={() => toggleExpand(todo.id)}
                title={isExpanded ? 'Tutup sub-tasks' : 'Buka sub-tasks'}
                aria-label={isExpanded ? 'Tutup sub-tasks' : 'Buka sub-tasks'}
              >
                {isExpanded ? '▼' : '▶'}
              </button>

              <!-- Checkbox & Text -->
              <label class="flex items-center gap-3 cursor-pointer grow select-none">
                <input
                  type="checkbox"
                  checked={todo.done}
                  onchange={() => toggleTodo(todo.id)}
                  class="nb-checkbox shrink-0"
                  data-testid={`checkbox-todo-${todo.id}`}
                />
                <span
                  class="text-base font-bold leading-snug wrap-break-word whitespace-pre-wrap {todo.done
                    ? 'line-through decoration-2 decoration-nb-black text-gray-500'
                    : 'text-nb-black'}"
                >
                  {todo.text}
                </span>
              </label>

              <!-- Sub-tasks Progress Badge -->
              {#if subList.length > 0}
                <button
                  type="button"
                  onclick={() => toggleExpand(todo.id)}
                  class="nb-badge shrink-0 cursor-pointer {subDoneCount === subList.length ? 'bg-nb-green' : 'bg-nb-yellow'}"
                  title={$i18nStore.t('todo.subtasksTitle')}
                >
                  {subDoneCount}/{subList.length} {$i18nStore.t('todo.subtasksCount')}
                </button>
              {/if}

              <!-- Delete Parent Button -->
              <button
                type="button"
                class="w-8 h-8 shrink-0 border-2 border-nb-black bg-nb-red text-white font-black text-sm rounded flex items-center justify-center cursor-pointer shadow-nb-sm hover:-translate-x-px hover:-translate-y-px hover:shadow-nb-md active:translate-x-px active:translate-y-px active:shadow-nb-xs transition-all duration-100"
                onclick={() => promptDeleteTodo(todo)}
                title={$i18nStore.t('todo.deleteNote')}
                aria-label={$i18nStore.t('todo.deleteNote')}
                data-testid={`delete-todo-${todo.id}`}
              >
                ✕
              </button>
            </div>

            <!-- Sub-tasks Section (Expandable) -->
            {#if isExpanded}
              <div class="p-3 sm:px-5 bg-[#faf8f5] flex flex-col gap-2.5 border-t border-dashed border-gray-300">
                <!-- Sub-tasks List -->
                {#if subList.length > 0}
                  <ul class="list-none flex flex-col gap-2 p-0 m-0 pl-4 sm:pl-6 border-l-3 border-nb-yellow">
                    {#each subList as sub (sub.id)}
                      <li
                        class="flex items-center justify-between gap-3 p-2 px-3 bg-white border border-nb-black rounded shadow-nb-xs {sub.done ? 'opacity-70 bg-gray-50' : ''}"
                        data-testid={`subtask-item-${sub.id}`}
                      >
                        <label class="flex items-center gap-2.5 cursor-pointer grow select-none">
                          <input
                            type="checkbox"
                            checked={sub.done}
                            onchange={() => toggleSubTask(todo.id, sub.id)}
                            class="w-4.5 h-4.5 border-2 border-nb-black rounded bg-white cursor-pointer accent-nb-green"
                            data-testid={`checkbox-subtask-${sub.id}`}
                          />
                          <span
                            class="text-sm font-semibold leading-tight wrap-break-word whitespace-pre-wrap {sub.done
                              ? 'line-through text-gray-500'
                              : 'text-nb-black'}"
                          >
                            {sub.text}
                          </span>
                        </label>

                        <button
                          type="button"
                          class="w-6 h-6 shrink-0 border border-nb-black bg-gray-100 hover:bg-nb-red hover:text-white text-gray-600 font-bold text-xs rounded flex items-center justify-center cursor-pointer transition-colors"
                          onclick={() => promptDeleteSubTask(todo.id, sub)}
                          title={$i18nStore.t('todo.deleteSubtask')}
                          aria-label={$i18nStore.t('todo.deleteSubtask')}
                          data-testid={`delete-subtask-${sub.id}`}
                        >
                          ✕
                        </button>
                      </li>
                    {/each}
                  </ul>
                {:else}
                  <p class="text-xs text-gray-500 font-semibold italic pl-4 sm:pl-6 m-0">
                    {$i18nStore.t('todo.subtasksEmpty')}
                  </p>
                {/if}

                <!-- Add Sub-task Input Form -->
                <form
                  onsubmit={(e) => addSubTask(todo.id, e)}
                  class="flex gap-2 pl-4 sm:pl-6 pt-1 items-stretch"
                >
                  <textarea
                    bind:value={subTaskInputs[todo.id]}
                    onkeydown={(e) => handleSubTaskKeydown(todo.id, e)}
                    placeholder={$i18nStore.t('todo.subtaskPlaceholder')}
                    rows="1"
                    class="w-full text-xs font-semibold px-3 py-1.5 border-2 border-nb-black rounded shadow-nb-xs bg-white outline-none focus:shadow-nb-sm resize-y min-h-8.5 leading-snug"
                    data-testid={`input-subtask-${todo.id}`}
                  ></textarea>
                  <button
                    type="submit"
                    class="nb-btn bg-nb-blue text-xs font-bold px-3 py-1.5 shadow-nb-xs border-2 border-nb-black shrink-0 self-start h-auto"
                    data-testid={`button-add-subtask-${todo.id}`}
                  >
                    {$i18nStore.t('todo.subtaskAddButton')}
                  </button>
                </form>
              </div>
            {/if}
          </li>
        {/each}
      {/if}
    </ul>
  </div>

  <!-- Deletion Confirmation Modal -->
  <ConfirmModal
    isOpen={deleteTarget !== null}
    title={deleteTarget?.type === 'todo' ? $i18nStore.t('todo.confirmModalDeleteNoteTitle') : $i18nStore.t('todo.confirmModalDeleteSubtaskTitle')}
    message={deleteTarget?.type === 'todo'
      ? $i18nStore.t('todo.confirmModalDeleteNoteMsg')
      : $i18nStore.t('todo.confirmModalDeleteSubtaskMsg')}
    itemText={deleteTarget?.text || ''}
    confirmText={$i18nStore.t('action.delete')}
    cancelText={$i18nStore.t('action.cancel')}
    onConfirm={handleConfirmDelete}
    onCancel={handleCancelDelete}
  />
</section>

<script lang="ts">
  import ConfirmModal from './ConfirmModal.svelte';

  interface SubTask {
    id: string;
    text: string;
    done: boolean;
    createdAt: number;
  }

  interface Todo {
    id: string;
    text: string;
    done: boolean;
    createdAt: number;
    subTasks?: SubTask[];
  }

  type DeleteTarget =
    | { type: 'todo'; id: string; text: string }
    | { type: 'subtask'; todoId: string; subTaskId: string; text: string }
    | null;

  const STORAGE_KEY = 'svelte_hub_todos';

  const defaultTodos: Todo[] = [
    {
      id: '1',
      text: 'Pelajari reaktivitas Runes di Svelte 5',
      done: true,
      createdAt: Date.now() - 3600000,
      subTasks: [
        { id: '1-1', text: 'Eksplorasi $state() untuk state lokal', done: true, createdAt: Date.now() - 3500000 },
        { id: '1-2', text: 'Gunakan $derived() untuk computed values', done: true, createdAt: Date.now() - 3400000 },
        { id: '1-3', text: 'Gunakan $effect() untuk sinkronisasi localStorage', done: true, createdAt: Date.now() - 3300000 }
      ]
    },
    {
      id: '2',
      text: 'Setup deployment Docker multi-stage dengan Nginx',
      done: false,
      createdAt: Date.now() - 1800000,
      subTasks: [
        { id: '2-1', text: 'Buat Dockerfile multi-stage dengan builder Bun', done: true, createdAt: Date.now() - 1700000 },
        { id: '2-2', text: 'Konfigurasi nginx.conf untuk SPA routing', done: true, createdAt: Date.now() - 1600000 },
        { id: '2-3', text: 'Uji container di port 8080 via docker compose', done: false, createdAt: Date.now() - 1500000 }
      ]
    },
    {
      id: '3',
      text: 'Tambahkan link proyek Svelte lama ke file apps.ts',
      done: false,
      createdAt: Date.now(),
      subTasks: [
        { id: '3-1', text: 'Kumpulkan URL repo dan live demo', done: false, createdAt: Date.now() },
        { id: '3-2', text: 'Tambahkan kontak WhatsApp PIC masing-masing apps', done: true, createdAt: Date.now() }
      ]
    }
  ];

  function loadTodos(): Todo[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.map((item) => ({
            ...item,
            subTasks: Array.isArray(item.subTasks) ? item.subTasks : []
          }));
        }
      }
    } catch (e) {
      console.error('Failed to load todos from localStorage', e);
    }
    return defaultTodos;
  }

  let todos = $state<Todo[]>(loadTodos());
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

  $effect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
    } catch (e) {
      console.error('Failed to save todos to localStorage', e);
    }
  });

  const remainingCount = $derived(todos.filter((t) => !t.done).length);
  const completedCount = $derived(todos.filter((t) => t.done).length);

  const filteredTodos = $derived(
    todos.filter((t) => {
      if (filter === 'active') return !t.done;
      if (filter === 'done') return t.done;
      return true;
    })
  );

  function addTodo(e?: SubmitEvent) {
    if (e) e.preventDefault();
    const trimmed = newTodoText.trim();
    if (!trimmed) return;

    const newId = Date.now().toString();
    todos = [
      {
        id: newId,
        text: trimmed,
        done: false,
        createdAt: Date.now(),
        subTasks: []
      },
      ...todos
    ];

    expandedTodoIds[newId] = true;
    newTodoText = '';
  }

  function toggleTodo(id: string) {
    todos = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  }

  function promptDeleteTodo(todo: Todo) {
    deleteTarget = {
      type: 'todo',
      id: todo.id,
      text: todo.text
    };
  }

  function deleteTodo(id: string) {
    todos = todos.filter((t) => t.id !== id);
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
    todos = todos.filter((t) => !t.done);
  }

  function toggleExpand(id: string) {
    expandedTodoIds[id] = !expandedTodoIds[id];
  }

  function addSubTask(todoId: string, e?: SubmitEvent) {
    if (e) e.preventDefault();
    const inputVal = (subTaskInputs[todoId] || '').trim();
    if (!inputVal) return;

    todos = todos.map((todo) => {
      if (todo.id !== todoId) return todo;
      const subTasks = todo.subTasks || [];
      const newSub: SubTask = {
        id: `${todoId}-${Date.now()}`,
        text: inputVal,
        done: false,
        createdAt: Date.now()
      };
      return {
        ...todo,
        subTasks: [...subTasks, newSub]
      };
    });

    subTaskInputs[todoId] = '';
    expandedTodoIds[todoId] = true;
  }

  function toggleSubTask(todoId: string, subTaskId: string) {
    todos = todos.map((todo) => {
      if (todo.id !== todoId) return todo;
      const subTasks = (todo.subTasks || []).map((st) =>
        st.id === subTaskId ? { ...st, done: !st.done } : st
      );
      return { ...todo, subTasks };
    });
  }

  function deleteSubTask(todoId: string, subTaskId: string) {
    todos = todos.map((todo) => {
      if (todo.id !== todoId) return todo;
      return {
        ...todo,
        subTasks: (todo.subTasks || []).filter((st) => st.id !== subTaskId)
      };
    });
  }
</script>

<section class="w-full">
  <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
    <div class="inline-flex items-center gap-2.5 bg-nb-yellow px-4.5 py-2 border-3 border-nb-black shadow-nb rounded-md text-lg md:text-xl font-extrabold uppercase tracking-wide">
      <span>📝</span>
      <span>CATATAN & TO-DO LIST</span>
    </div>

    <div class="flex gap-2">
      <span class="nb-badge bg-nb-yellow">
        {remainingCount} PENDING
      </span>
      {#if completedCount > 0}
        <span class="nb-badge bg-nb-green">
          {completedCount} SELESAI
        </span>
      {/if}
    </div>
  </div>

  <div class="nb-card flex flex-col gap-5 bg-nb-surface">
    <!-- Form Tambah Todo -->
    <form onsubmit={addTodo} class="flex flex-col sm:flex-row gap-3">
      <input
        type="text"
        bind:value={newTodoText}
        placeholder="Tulis tugas atau catatan baru di sini..."
        class="nb-input grow"
        data-testid="todo-input"
      />
      <button type="submit" class="nb-btn bg-nb-pink whitespace-nowrap px-6" data-testid="todo-add-button">
        <span>+</span>
        <span>TAMBAH</span>
      </button>
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
          SEMUA ({todos.length})
        </button>
        <button
          type="button"
          class="nb-btn text-xs px-3.5 py-1.5 {filter === 'active' ? 'bg-nb-yellow' : 'bg-white'}"
          onclick={() => (filter = 'active')}
          data-testid="filter-active"
        >
          BELUM ({remainingCount})
        </button>
        <button
          type="button"
          class="nb-btn text-xs px-3.5 py-1.5 {filter === 'done' ? 'bg-nb-yellow' : 'bg-white'}"
          onclick={() => (filter = 'done')}
          data-testid="filter-done"
        >
          SELESAI ({completedCount})
        </button>
      </div>

      {#if completedCount > 0}
        <button
          type="button"
          class="nb-btn bg-[#ff4757] text-white text-xs px-3.5 py-1.5"
          onclick={clearCompleted}
          data-testid="clear-completed-button"
        >
          HAPUS YANG SELESAI
        </button>
      {/if}
    </div>

    <!-- List Items -->
    <ul class="list-none flex flex-col gap-4 p-0 m-0">
      {#if filteredTodos.length === 0}
        <li class="p-9 text-center border-2 border-dashed border-gray-300 rounded-md text-gray-500 font-semibold">
          <p class="m-0">Belum ada catatan di kategori ini. Yuk tambah baru! ✨</p>
        </li>
      {:else}
        {#each filteredTodos as todo (todo.id)}
          {@const subList = todo.subTasks || []}
          {@const subDoneCount = subList.filter((s) => s.done).length}
          {@const isExpanded = expandedTodoIds[todo.id] ?? false}

          <li
            class="flex flex-col border-2 border-nb-black rounded-md shadow-[2px_2px_0px_#121212] overflow-hidden transition-all duration-100 {todo.done
              ? 'bg-gray-100 opacity-80'
              : 'bg-white'}"
            data-testid={`todo-item-${todo.id}`}
          >
            <!-- Parent Todo Row -->
            <div class="flex items-center justify-between gap-3 p-3.5 sm:px-4.5 bg-gray-50 border-b-2 border-nb-black">
              <!-- Expand / Collapse Button -->
              <button
                type="button"
                class="w-7 h-7 shrink-0 border-2 border-nb-black bg-white rounded flex items-center justify-center font-bold text-xs cursor-pointer shadow-[1px_1px_0px_#121212] hover:bg-nb-yellow transition-colors"
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
                  class="text-base font-bold leading-snug break-words {todo.done
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
                  title="Lihat sub-tasks"
                >
                  {subDoneCount}/{subList.length} SUB-TASKS
                </button>
              {/if}

              <!-- Delete Parent Button -->
              <button
                type="button"
                class="w-8 h-8 shrink-0 border-2 border-nb-black bg-[#ff4757] text-white font-black text-sm rounded flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#121212] hover:-translate-x-0.25 hover:-translate-y-0.25 hover:shadow-[3px_3px_0px_#121212] active:translate-x-0.25 active:translate-y-0.25 active:shadow-[1px_1px_0px_#121212] transition-all duration-100"
                onclick={() => promptDeleteTodo(todo)}
                title="Hapus catatan"
                aria-label="Hapus catatan"
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
                        class="flex items-center justify-between gap-3 p-2 px-3 bg-white border border-nb-black rounded shadow-[1px_1px_0px_#121212] {sub.done ? 'opacity-70 bg-gray-50' : ''}"
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
                            class="text-sm font-semibold leading-tight break-words {sub.done
                              ? 'line-through text-gray-500'
                              : 'text-nb-black'}"
                          >
                            {sub.text}
                          </span>
                        </label>

                        <button
                          type="button"
                          class="w-6 h-6 shrink-0 border border-nb-black bg-gray-100 hover:bg-[#ff4757] hover:text-white text-gray-600 font-bold text-xs rounded flex items-center justify-center cursor-pointer transition-colors"
                          onclick={() => promptDeleteSubTask(todo.id, sub)}
                          title="Hapus sub-task"
                          aria-label="Hapus sub-task"
                          data-testid={`delete-subtask-${sub.id}`}
                        >
                          ✕
                        </button>
                      </li>
                    {/each}
                  </ul>
                {:else}
                  <p class="text-xs text-gray-500 font-semibold italic pl-4 sm:pl-6 m-0">
                    Belum ada sub-task. Tambahkan langkah pengerjaan di bawah:
                  </p>
                {/if}

                <!-- Add Sub-task Input Form -->
                <form
                  onsubmit={(e) => addSubTask(todo.id, e)}
                  class="flex gap-2 pl-4 sm:pl-6 pt-1"
                >
                  <input
                    type="text"
                    bind:value={subTaskInputs[todo.id]}
                    placeholder="Tambah sub-task baru..."
                    class="w-full text-xs font-semibold px-3 py-1.5 border-2 border-nb-black rounded shadow-[1px_1px_0px_#121212] bg-white outline-none focus:shadow-[2px_2px_0px_#121212]"
                    data-testid={`input-subtask-${todo.id}`}
                  />
                  <button
                    type="submit"
                    class="nb-btn bg-nb-blue text-xs font-bold px-3 py-1.5 shadow-[1px_1px_0px_#121212] border-2 border-nb-black shrink-0"
                    data-testid={`button-add-subtask-${todo.id}`}
                  >
                    + SUB
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
    title={deleteTarget?.type === 'todo' ? 'HAPUS CATATAN' : 'HAPUS SUB-TASK'}
    message={deleteTarget?.type === 'todo'
      ? 'Apakah Anda yakin ingin menghapus catatan ini beserta seluruh sub-task di dalamnya?'
      : 'Apakah Anda yakin ingin menghapus sub-task ini?'}
    itemText={deleteTarget?.text || ''}
    confirmText="YA, HAPUS"
    cancelText="BATAL"
    onConfirm={handleConfirmDelete}
    onCancel={handleCancelDelete}
  />
</section>

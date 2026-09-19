<script lang="ts">
  interface Todo {
    id: string;
    text: string;
    done: boolean;
    createdAt: number;
  }

  const STORAGE_KEY = 'svelte_hub_todos';

  const defaultTodos: Todo[] = [
    {
      id: '1',
      text: 'Pelajari reaktivitas Runes di Svelte 5 ($state, $derived, $effect)',
      done: true,
      createdAt: Date.now() - 3600000
    },
    {
      id: '2',
      text: 'Setup deployment Docker multi-stage dengan Nginx',
      done: false,
      createdAt: Date.now() - 1800000
    },
    {
      id: '3',
      text: 'Tambahkan link proyek Svelte lama ke file apps.ts',
      done: false,
      createdAt: Date.now()
    }
  ];

  function loadTodos(): Todo[] {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load todos from localStorage', e);
    }
    return defaultTodos;
  }

  let todos = $state<Todo[]>(loadTodos());
  let newTodoText = $state('');
  let filter = $state<'all' | 'active' | 'done'>('all');

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

    todos = [
      {
        id: Date.now().toString(),
        text: trimmed,
        done: false,
        createdAt: Date.now()
      },
      ...todos
    ];

    newTodoText = '';
  }

  function toggleTodo(id: string) {
    todos = todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
  }

  function deleteTodo(id: string) {
    todos = todos.filter((t) => t.id !== id);
  }

  function clearCompleted() {
    todos = todos.filter((t) => !t.done);
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
      />
      <button type="submit" class="nb-btn bg-nb-pink whitespace-nowrap px-6">
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
        >
          SEMUA ({todos.length})
        </button>
        <button
          type="button"
          class="nb-btn text-xs px-3.5 py-1.5 {filter === 'active' ? 'bg-nb-yellow' : 'bg-white'}"
          onclick={() => (filter = 'active')}
        >
          BELUM ({remainingCount})
        </button>
        <button
          type="button"
          class="nb-btn text-xs px-3.5 py-1.5 {filter === 'done' ? 'bg-nb-yellow' : 'bg-white'}"
          onclick={() => (filter = 'done')}
        >
          SELESAI ({completedCount})
        </button>
      </div>

      {#if completedCount > 0}
        <button
          type="button"
          class="nb-btn bg-[#ff4757] text-white text-xs px-3.5 py-1.5"
          onclick={clearCompleted}
        >
          HAPUS YANG SELESAI
        </button>
      {/if}
    </div>

    <!-- List Items -->
    <ul class="list-none flex flex-col gap-3 p-0 m-0">
      {#if filteredTodos.length === 0}
        <li class="p-9 text-center border-2 border-dashed border-gray-300 rounded-md text-gray-500 font-semibold">
          <p class="m-0">Belum ada catatan di kategori ini. Yuk tambah baru! ✨</p>
        </li>
      {:else}
        {#each filteredTodos as todo (todo.id)}
          <li
            class="flex items-center justify-between gap-3.5 p-3.5 sm:px-4.5 border-2 border-nb-black rounded-md shadow-[2px_2px_0px_#121212] transition-all duration-100 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-nb {todo.done
              ? 'bg-gray-100 opacity-75'
              : 'bg-gray-50'}"
          >
            <label class="flex items-center gap-3 cursor-pointer grow select-none">
              <input
                type="checkbox"
                checked={todo.done}
                onchange={() => toggleTodo(todo.id)}
                class="nb-checkbox"
              />
              <span
                class="text-base font-semibold leading-snug break-words {todo.done
                  ? 'line-through decoration-2 decoration-nb-black text-gray-500'
                  : 'text-nb-black'}"
              >
                {todo.text}
              </span>
            </label>

            <button
              type="button"
              class="w-8 h-8 shrink-0 border-2 border-nb-black bg-[#ff4757] text-white font-black text-sm rounded flex items-center justify-center cursor-pointer shadow-[2px_2px_0px_#121212] hover:-translate-x-0.25 hover:-translate-y-0.25 hover:shadow-[3px_3px_0px_#121212] active:translate-x-0.25 active:translate-y-0.25 active:shadow-[1px_1px_0px_#121212] transition-all duration-100"
              onclick={() => deleteTodo(todo.id)}
              title="Hapus catatan"
              aria-label="Hapus catatan"
            >
              ✕
            </button>
          </li>
        {/each}
      {/if}
    </ul>
  </div>
</section>

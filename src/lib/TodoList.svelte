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

<section class="todo-section">
  <div class="section-header">
    <div class="section-title">
      <span>📝</span>
      <span>CATATAN & TO-DO LIST</span>
    </div>

    <div class="header-badges">
      <span class="nb-badge" style="background: var(--nb-yellow);">
        {remainingCount} PENDING
      </span>
      {#if completedCount > 0}
        <span class="nb-badge" style="background: var(--nb-green);">
          {completedCount} SELESAI
        </span>
      {/if}
    </div>
  </div>

  <div class="todo-card nb-card">
    <!-- Form Tambah Todo -->
    <form onsubmit={addTodo} class="todo-form">
      <input
        type="text"
        bind:value={newTodoText}
        placeholder="Tulis tugas atau catatan baru di sini..."
        class="nb-input todo-input"
      />
      <button type="submit" class="nb-btn nb-btn-pink add-btn">
        <span>+</span>
        <span>TAMBAH</span>
      </button>
    </form>

    <!-- Filters & Action Toolbar -->
    <div class="todo-toolbar">
      <div class="filter-group">
        <button
          type="button"
          class="nb-btn filter-btn {filter === 'all' ? 'active-filter' : 'nb-btn-white'}"
          onclick={() => (filter = 'all')}
        >
          SEMUA ({todos.length})
        </button>
        <button
          type="button"
          class="nb-btn filter-btn {filter === 'active' ? 'active-filter' : 'nb-btn-white'}"
          onclick={() => (filter = 'active')}
        >
          BELUM ({remainingCount})
        </button>
        <button
          type="button"
          class="nb-btn filter-btn {filter === 'done' ? 'active-filter' : 'nb-btn-white'}"
          onclick={() => (filter = 'done')}
        >
          SELESAI ({completedCount})
        </button>
      </div>

      {#if completedCount > 0}
        <button
          type="button"
          class="nb-btn nb-btn-danger clear-btn"
          onclick={clearCompleted}
        >
          HAPUS YANG SELESAI
        </button>
      {/if}
    </div>

    <!-- List Items -->
    <ul class="todo-list">
      {#if filteredTodos.length === 0}
        <li class="empty-state">
          <p>Belum ada catatan di kategori ini. Yuk tambah baru! ✨</p>
        </li>
      {:else}
        {#each filteredTodos as todo (todo.id)}
          <li class="todo-item {todo.done ? 'is-done' : ''}">
            <label class="todo-label">
              <input
                type="checkbox"
                checked={todo.done}
                onchange={() => toggleTodo(todo.id)}
                class="nb-checkbox"
              />
              <span class="todo-text">{todo.text}</span>
            </label>

            <button
              type="button"
              class="delete-btn"
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

<style>
  .todo-section {
    width: 100%;
  }

  .header-badges {
    display: flex;
    gap: 8px;
  }

  .todo-card {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .todo-form {
    display: flex;
    gap: 12px;
  }

  .todo-input {
    flex-grow: 1;
  }

  .add-btn {
    white-space: nowrap;
    padding-inline: 24px;
  }

  .todo-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    flex-wrap: wrap;
    gap: 12px;
    padding-bottom: 12px;
    border-bottom: 2px dashed #dddddd;
  }

  .filter-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .filter-btn {
    padding: 6px 14px;
    font-size: 13px;
  }

  .active-filter {
    background: var(--nb-yellow);
    box-shadow: var(--nb-shadow);
  }

  .clear-btn {
    padding: 6px 14px;
    font-size: 12px;
  }

  .todo-list {
    list-style: none;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .todo-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 14px;
    padding: 14px 18px;
    background: #fafafa;
    border: var(--nb-border-sm);
    border-radius: 6px;
    box-shadow: 2px 2px 0px var(--nb-black);
    transition: transform 0.1s ease, background-color 0.15s ease;
  }

  .todo-item:hover {
    transform: translate(-2px, -2px);
    box-shadow: 4px 4px 0px var(--nb-black);
  }

  .todo-item.is-done {
    background: #f0f0f0;
    opacity: 0.75;
  }

  .todo-item.is-done .todo-text {
    text-decoration: line-through 2px var(--nb-black);
    color: #666666;
  }

  .todo-label {
    display: flex;
    align-items: center;
    gap: 12px;
    cursor: pointer;
    flex-grow: 1;
  }

  .todo-text {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
    word-break: break-word;
  }

  .delete-btn {
    width: 32px;
    height: 32px;
    border: var(--nb-border-sm);
    background: #ff4757;
    color: #ffffff;
    font-weight: 900;
    font-size: 15px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    box-shadow: 2px 2px 0px var(--nb-black);
    transition: transform 0.1s ease;
  }

  .delete-btn:hover {
    transform: translate(-1px, -1px);
    box-shadow: 3px 3px 0px var(--nb-black);
  }

  .delete-btn:active {
    transform: translate(1px, 1px);
    box-shadow: 1px 1px 0px var(--nb-black);
  }

  .empty-state {
    padding: 36px 20px;
    text-align: center;
    border: 2px dashed #cccccc;
    border-radius: 6px;
    color: #666666;
    font-weight: 600;
  }

  @media (max-width: 640px) {
    .todo-form {
      flex-direction: column;
    }

    .add-btn {
      width: 100%;
    }
  }
</style>

<script lang="ts">
  import ConfirmModal from './ConfirmModal.svelte';
  import SkeletonTodo from './SkeletonTodo.svelte';
  import ImageUploadModal from './ImageUploadModal.svelte';
  import { alertStore } from '@/stores/alertStore';
  import { i18nStore } from '@/stores/i18nStore';
  import { authStore } from '@/stores/authStore';
  import { appStore } from '@/stores/appStore';
  import { todoStore, type Todo, type SubTask } from '@/stores/todoStore';
  import CustomSelect from './CustomSelect.svelte';
  import { Warning } from '@/exceptions/CustomError';
  import { GripVertical } from '@lucide/svelte';

  const t = $derived((key: string, defaultValue?: string): string => $i18nStore.t(key, defaultValue));
  let canManage = $derived($authStore.hasDebugAccess);

  type DeleteTarget =
    | { type: 'todo'; id: string; text: string }
    | { type: 'subtask'; todoId: string; subTaskId: string; text: string }
    | { type: 'all'; text: string }
    | null;

  let newTodoText = $state('');
  let newTodoImageUrls = $state<string[]>([]);
  let newTodoImageFiles = $state<File[]>([]);
  const newTodoImageUrl = $derived(newTodoImageUrls[0] || null);
  let activeImageTodo = $state<Todo | null>(null);
  let isImageModalOpen = $state(false);
  let imageModalMode = $state<'new' | 'existing'>('new');
  let searchQuery = $state('');
  let filter = $state<'all' | 'active' | 'done'>('all');
  let topicFilter = $state<string>('all');
  let selectedAppId = $state<string>('');

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
  const apps = $derived($appStore.apps);

  $effect(() => {
    // Keep selectedAppId synced to a valid app if not set
    if (!selectedAppId && apps.length > 0) {
      selectedAppId = apps[0].id;
    }
    // If selectedAppId is no longer in apps, fallback to first app
    if (selectedAppId && !apps.some((a) => a.id === selectedAppId)) {
      selectedAppId = apps[0]?.id || '';
    }
    // If topicFilter is no longer in apps, reset to all
    if (topicFilter !== 'all' && !apps.some((a) => a.id === topicFilter)) {
      topicFilter = 'all';
    }
  });

  const remainingCount = $derived(todos.filter((t) => !t.done).length);
  const completedCount = $derived(todos.filter((t) => t.done).length);
  const allTodosDone = $derived(todos.length > 0 && todos.every((t) => t.done));

  async function handleToggleAllTodos() {
    if (todos.length === 0) return;
    const targetDone = !allTodosDone;
    await todoStore.checkAllTodos(targetDone);
    if (targetDone) {
      alertStore.showSuccess(t('todo.checkAllDoneMsg'));
    }
  }

  const filteredTodos = $derived(
    todos.filter((t) => {
      if (filter === 'active' && t.done) return false;
      if (filter === 'done' && !t.done) return false;
      if (topicFilter !== 'all' && t.appId !== topicFilter) return false;

      if (searchQuery.trim().length > 0) {
        const query = searchQuery.trim().toLowerCase();
        const matchesText = t.text.toLowerCase().includes(query);
        const matchesSubtasks = (t.subTasks || []).some((s) => s.text.toLowerCase().includes(query));

        const linkedApp = apps.find((a) => a.id === t.appId);
        const matchesAppName = linkedApp ? linkedApp.name.toLowerCase().includes(query) : false;
        const matchesCategory = linkedApp ? (linkedApp.category || '').toLowerCase().includes(query) : false;

        if (!matchesText && !matchesSubtasks && !matchesAppName && !matchesCategory) {
          return false;
        }
      }

      return true;
    })
  );

  function openNewTodoImageModal() {
    imageModalMode = 'new';
    isImageModalOpen = true;
  }

  function openTodoImageModal(todo: Todo) {
    imageModalMode = 'existing';
    activeImageTodo = todo;
    isImageModalOpen = true;
  }

  async function handleImageModalSave(urls: string[], files: File[]) {
    if (imageModalMode === 'new') {
      newTodoImageUrls = urls;
      newTodoImageFiles = files;
    } else if (imageModalMode === 'existing' && activeImageTodo) {
      try {
        let finalUrls = urls.filter((u) => !u.startsWith('blob:'));
        if (files.length > 0) {
          const uploadedUrls = await todoStore.uploadTodoImages(files);
          finalUrls = [...finalUrls, ...uploadedUrls];
        }
        await todoStore.updateTodoImages(activeImageTodo.id, finalUrls);
      } catch (err) {
        alertStore.throwAlert(err as Error);
      }
      activeImageTodo = null;
    }
  }

  async function handleImageModalRemove() {
    if (imageModalMode === 'new') {
      newTodoImageUrls = [];
      newTodoImageFiles = [];
    } else if (imageModalMode === 'existing' && activeImageTodo) {
      try {
        await todoStore.updateTodoImages(activeImageTodo.id, []);
      } catch (err) {
        alertStore.throwAlert(err as Error);
      }
      activeImageTodo = null;
    }
  }

  function handleImageModalClose() {
    isImageModalOpen = false;
    activeImageTodo = null;
  }

  async function addTodo(e?: Event) {
    if (e) e.preventDefault();
    const trimmed = newTodoText.trim();
    try {
      if (!trimmed) throw new Warning(t('todo.textTodoRequired', "Catatan Tidak Boleh Kosong"));

      let finalUrls = newTodoImageUrls.filter((u) => !u.startsWith('blob:'));
      if (newTodoImageFiles.length > 0) {
        const uploadedUrls = await todoStore.uploadTodoImages(newTodoImageFiles);
        finalUrls = [...finalUrls, ...uploadedUrls];
      }

      newTodoText = '';
      newTodoImageUrls = [];
      newTodoImageFiles = [];
      const chosenAppId = selectedAppId || (apps.length > 0 ? apps[0].id : null);
      const newTodo = await todoStore.addTodo(trimmed, chosenAppId, finalUrls);
      expandedTodoIds[newTodo.id] = true;
    } catch (e) {
      alertStore.throwAlert(e as Error);
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

  function promptDeleteAllCompleted(){
    deleteTarget = {
      type: 'all',
      text: 'Semua Catatan yang Selesai'
    }
  }

  function handleConfirmDelete() {
    if (!deleteTarget) return;
    if (deleteTarget.type === 'todo') {
      deleteTodo(deleteTarget.id);
    } else if (deleteTarget.type === 'subtask') {
      deleteSubTask(deleteTarget.todoId, deleteTarget.subTaskId);
    } else if (deleteTarget.type === 'all') {
      clearCompleted();
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
    try {
      if (!inputVal) throw new Warning(t('todo.textSubTaskRequired', "Isi sub task tidak boleh kosong !!!"));
      todoStore.addSubTask(todoId, inputVal);
      subTaskInputs[todoId] = '';
      expandedTodoIds[todoId] = true;
    } catch (e) {
      alertStore.throwAlert(e as Error);
    }
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

  // --- Drag and Drop Logic for Todos ---
  let draggedTodo = $state<Todo | null>(null);
  let dragOverTodoId = $state<string | null>(null);
  let isTodoDragReady = $state<Record<string, boolean>>({});
  let todoLongPressTimer: any = null;

  function handleTodoPointerDown(id: string, e: PointerEvent) {
    if (!canManage) return;
    if ((e.target as HTMLElement).closest('button, input, textarea, a, label')) return;
    todoLongPressTimer = setTimeout(() => {
      isTodoDragReady[id] = true;
    }, 150);
  }

  function handleTodoPointerUp() {
    if (todoLongPressTimer) {
      clearTimeout(todoLongPressTimer);
      todoLongPressTimer = null;
    }
  }

  function handleTodoDragStart(todo: Todo, e: DragEvent) {
    if (!canManage) {
      e.preventDefault();
      return;
    }
    draggedTodo = todo;
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'todo', id: todo.id }));
    }
  }

  function handleTodoDragOver(todo: Todo, e: DragEvent) {
    if (draggedTodo && draggedTodo.id !== todo.id) {
      e.preventDefault();
      dragOverTodoId = todo.id;
    } else if (draggedSubTask) {
      e.preventDefault();
      dragOverTodoId = todo.id;
    }
  }

  function handleTodoDragLeave(todo: Todo, e: DragEvent) {
    if (dragOverTodoId === todo.id) {
      dragOverTodoId = null;
    }
  }

  async function handleTodoDrop(targetTodo: Todo, e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();

    if (draggedSubTask) {
      const source = draggedSubTask;
      draggedSubTask = null;
      dragOverTodoId = null;
      dragOverSubTaskId = null;
      dragOverSubTodoContainerId = null;
      isSubDragReady = {};

      const currentList = [...todos];
      const targetIndex = currentList.findIndex((t) => t.id === targetTodo.id);
      const newIndex = targetIndex !== -1 ? targetIndex : 0;

      await todoStore.convertSubTaskToTodo(source.sub.id, source.sourceTodoId, newIndex);
      return;
    }

    const source = draggedTodo;
    draggedTodo = null;
    dragOverTodoId = null;
    isTodoDragReady = {};

    if (!source || source.id === targetTodo.id) return;

    const currentList = [...todos];
    const sourceIndex = currentList.findIndex((t) => t.id === source.id);
    const targetIndex = currentList.findIndex((t) => t.id === targetTodo.id);

    if (sourceIndex === -1 || targetIndex === -1) return;

    currentList.splice(sourceIndex, 1);
    currentList.splice(targetIndex, 0, source);

    const newOrderedIds = currentList.map((t) => t.id);
    await todoStore.reorderTodos(newOrderedIds);
  }

  function handleListDragOver(e: DragEvent) {
    if (draggedSubTask) {
      e.preventDefault();
    }
  }

  async function handleListDrop(e: DragEvent) {
    if (!draggedSubTask) return;
    e.preventDefault();
    const source = draggedSubTask;
    draggedSubTask = null;
    dragOverTodoId = null;
    dragOverSubTaskId = null;
    dragOverSubTodoContainerId = null;
    isSubDragReady = {};

    await todoStore.convertSubTaskToTodo(source.sub.id, source.sourceTodoId);
  }

  function handleTodoDragEnd() {
    draggedTodo = null;
    dragOverTodoId = null;
    dragOverSubTaskId = null;
    dragOverSubTodoContainerId = null;
    isTodoDragReady = {};
  }

  // --- Drag and Drop Logic for Sub-Tasks ---
  let draggedSubTask = $state<{ sub: SubTask; sourceTodoId: string } | null>(null);
  let dragOverSubTaskId = $state<string | null>(null);
  let dragOverSubTodoContainerId = $state<string | null>(null);
  let isSubDragReady = $state<Record<string, boolean>>({});
  let subLongPressTimer: any = null;

  function handleSubPointerDown(id: string, e: PointerEvent) {
    if (!canManage) return;
    if ((e.target as HTMLElement).closest('button, input, textarea, a, label')) return;
    subLongPressTimer = setTimeout(() => {
      isSubDragReady[id] = true;
    }, 150);
  }

  function handleSubPointerUp() {
    if (subLongPressTimer) {
      clearTimeout(subLongPressTimer);
      subLongPressTimer = null;
    }
  }

  function handleSubDragStart(sub: SubTask, sourceTodoId: string, e: DragEvent) {
    if (!canManage) {
      e.preventDefault();
      return;
    }
    e.stopPropagation();
    draggedSubTask = { sub, sourceTodoId };
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('application/json', JSON.stringify({ type: 'subtask', id: sub.id, sourceTodoId }));
    }
  }

  function handleSubDragOver(targetSub: SubTask, targetTodoId: string, e: DragEvent) {
    if (draggedSubTask && draggedSubTask.sub.id !== targetSub.id) {
      e.preventDefault();
      e.stopPropagation();
      dragOverSubTaskId = targetSub.id;
      dragOverTodoId = null;
    } else if (draggedTodo && draggedTodo.id !== targetTodoId) {
      e.preventDefault();
      e.stopPropagation();
      dragOverSubTaskId = targetSub.id;
    }
  }

  function handleSubDragLeave(targetSub: SubTask, e: DragEvent) {
    if (dragOverSubTaskId === targetSub.id) {
      dragOverSubTaskId = null;
    }
  }

  async function handleSubDrop(targetSub: SubTask, targetTodoId: string, e: DragEvent) {
    if (!draggedSubTask && !draggedTodo) return;
    e.preventDefault();
    e.stopPropagation();

    if (draggedTodo) {
      const source = draggedTodo;
      draggedTodo = null;
      dragOverTodoId = null;
      dragOverSubTaskId = null;
      dragOverSubTodoContainerId = null;
      isTodoDragReady = {};

      if (source.id === targetTodoId) return;

      const targetTodo = todos.find((t) => t.id === targetTodoId);
      const targetSubs = targetTodo?.subTasks || [];
      const targetIdx = targetSubs.findIndex((s) => s.id === targetSub.id);
      const newIndex = targetIdx !== -1 ? targetIdx : targetSubs.length;

      await todoStore.convertTodoToSubTask(source.id, targetTodoId, newIndex);
      expandedTodoIds[targetTodoId] = true;
      return;
    }

    const source = draggedSubTask;
    draggedSubTask = null;
    dragOverSubTaskId = null;
    dragOverSubTodoContainerId = null;
    isSubDragReady = {};

    if (!source || source.sub.id === targetSub.id) return;

    if (source.sourceTodoId === targetTodoId) {
      const parentTodo = todos.find((t) => t.id === targetTodoId);
      if (!parentTodo || !parentTodo.subTasks) return;
      const subList = [...parentTodo.subTasks];
      const sourceIdx = subList.findIndex((s) => s.id === source.sub.id);
      const targetIdx = subList.findIndex((s) => s.id === targetSub.id);
      if (sourceIdx === -1 || targetIdx === -1) return;

      subList.splice(sourceIdx, 1);
      subList.splice(targetIdx, 0, source.sub);
      await todoStore.reorderSubTasks(targetTodoId, subList.map((s) => s.id));
    } else {
      const targetTodo = todos.find((t) => t.id === targetTodoId);
      const targetSubs = targetTodo?.subTasks || [];
      const targetIdx = targetSubs.findIndex((s) => s.id === targetSub.id);
      const newIndex = targetIdx !== -1 ? targetIdx : targetSubs.length;

      await todoStore.moveSubTaskToParent(source.sub.id, source.sourceTodoId, targetTodoId, newIndex);
      expandedTodoIds[targetTodoId] = true;
    }
  }

  function handleSubContainerDragOver(targetTodoId: string, e: DragEvent) {
    if (draggedSubTask) {
      e.preventDefault();
      e.stopPropagation();
      dragOverSubTodoContainerId = targetTodoId;
      dragOverTodoId = null;
    } else if (draggedTodo && draggedTodo.id !== targetTodoId) {
      e.preventDefault();
      e.stopPropagation();
      dragOverSubTodoContainerId = targetTodoId;
    }
  }

  function handleSubContainerDragLeave(targetTodoId: string, e: DragEvent) {
    if (dragOverSubTodoContainerId === targetTodoId) {
      dragOverSubTodoContainerId = null;
    }
  }

  async function handleSubContainerDrop(targetTodoId: string, e: DragEvent) {
    if (!draggedSubTask && !draggedTodo) return;
    e.preventDefault();
    e.stopPropagation();

    if (draggedTodo) {
      const source = draggedTodo;
      draggedTodo = null;
      dragOverTodoId = null;
      dragOverSubTaskId = null;
      dragOverSubTodoContainerId = null;
      isTodoDragReady = {};

      if (source.id === targetTodoId) return;

      const targetTodo = todos.find((t) => t.id === targetTodoId);
      const targetSubs = targetTodo?.subTasks || [];
      await todoStore.convertTodoToSubTask(source.id, targetTodoId, targetSubs.length);
      expandedTodoIds[targetTodoId] = true;
      return;
    }

    const source = draggedSubTask;
    draggedSubTask = null;
    dragOverTodoId = null;
    dragOverSubTaskId = null;
    dragOverSubTodoContainerId = null;
    isSubDragReady = {};

    if (!source) return;

    if (source.sourceTodoId === targetTodoId) {
      return;
    }

    const targetTodo = todos.find((t) => t.id === targetTodoId);
    const targetSubs = targetTodo?.subTasks || [];
    await todoStore.moveSubTaskToParent(source.sub.id, source.sourceTodoId, targetTodoId, targetSubs.length);
    expandedTodoIds[targetTodoId] = true;
  }

  function handleSubDragEnd() {
    draggedSubTask = null;
    dragOverTodoId = null;
    dragOverSubTaskId = null;
    dragOverSubTodoContainerId = null;
    isSubDragReady = {};
  }
</script>

<section class="w-full">
  <div class="flex items-center justify-between mb-5 flex-wrap gap-3">
    <div class="inline-flex items-center gap-2.5 bg-nb-yellow px-4.5 py-2 border-3 border-nb-black shadow-nb rounded-md text-lg md:text-xl font-extrabold uppercase tracking-wide text-black">
      <span>📝</span>
      <span>{t('todo.title')}</span>
    </div>

    <div class="flex gap-2">
      <span class="nb-badge bg-nb-yellow text-black">
        {remainingCount} {t('todo.pending')}
      </span>
      {#if completedCount > 0}
        <span class="nb-badge bg-nb-green">
          {completedCount} {t('todo.completed')}
        </span>
      {/if}
    </div>
  </div>

  <div class="nb-card flex flex-col gap-5 bg-nb-surface">
    <!-- Form Tambah Todo -->
    <form onsubmit={addTodo} class="flex flex-col gap-2.5">
      <!-- Topic App Selector -->
      {#if apps.length > 0}
        <div class="flex items-center gap-2 flex-wrap text-xs">
          <label for="todo-app-topic-select" class="font-extrabold text-nb-black flex items-center gap-1.5 select-none">
            <span>🎯</span>
            <span>{t('todo.appTopic')}:</span>
          </label>
          <div class="grow max-w-xs">
            <CustomSelect
              id="todo-app-topic-select"
              options={apps.map(app => ({ label: `${app.icon} ${app.name}`, value: app.id }))}
              bind:value={selectedAppId}
              dataTestId="todo-app-topic-select"
              placeholder={t('todo.selectAppTopic')}
              searchPlaceholder={t('todo.searchAppTopic')}
            />
          </div>
        </div>
      {/if}

      <div class="flex flex-col sm:flex-row gap-3 items-stretch">
        <textarea
          bind:value={newTodoText}
          onkeydown={handleTodoKeydown}
          placeholder={t('todo.placeholder')}
          rows="2"
          class="nb-input grow resize-y min-h-14 leading-relaxed"
          data-testid="todo-input"
        ></textarea>
        <div class="flex sm:flex-col gap-2 shrink-0">
          <button
            type="submit"
            class="nb-btn bg-nb-pink whitespace-nowrap px-6 py-3 flex items-center justify-center gap-1.5 grow sm:grow-0"
            data-testid="todo-add-button"
          >
            <span>+</span>
            <span>{t('todo.addButton')}</span>
          </button>
          <button
            type="button"
            class="nb-btn text-xs px-3 py-2 border-2 border-nb-black shadow-nb-xs cursor-pointer flex items-center justify-center gap-1.5 {newTodoImageUrls.length > 0 ? 'bg-nb-green text-white' : 'bg-white hover:bg-gray-100 text-black'}"
            onclick={openNewTodoImageModal}
            data-testid="btn-open-image-modal"
            title={newTodoImageUrls.length > 0 ? (newTodoImageUrls.length > 1 ? `${newTodoImageUrls.length} ${t('todo.imagesAttached', 'Gambar Terlampir')}` : t('todo.imageAttached', 'Gambar Terlampir')) : t('todo.attachImage', 'Lampirkan Gambar')}
          >
            <span>📷</span>
            <span>{newTodoImageUrls.length > 0 ? (newTodoImageUrls.length > 1 ? `${newTodoImageUrls.length} ${t('todo.imagesAttached', 'Gambar Terlampir')}` : t('todo.imageAttached', 'Gambar Terlampir')) : t('todo.attachImage', 'Lampirkan Gambar')}</span>
          </button>
        </div>
      </div>

      {#if newTodoImageUrls.length > 0}
        <div class="flex items-center gap-2 p-1.5 px-2 bg-yellow-50 border-2 border-nb-black rounded shadow-nb-xs w-fit" data-testid="new-todo-image-preview-badge">
          <div class="flex -space-x-2">
            {#each newTodoImageUrls.slice(0, 3) as url}
              <img src={url} alt="Lampiran" class="w-7 h-7 object-cover rounded border border-nb-black shadow-nb-xs" />
            {/each}
          </div>
          <span class="text-xs font-bold text-gray-700">
            {newTodoImageUrls.length > 1 ? `${newTodoImageUrls.length} ${t('todo.imagesAttached', 'Gambar Terlampir')}` : t('todo.imageAttached', 'Gambar Terlampir')}
          </span>
          <button
            type="button"
            class="text-nb-red font-black text-xs hover:underline cursor-pointer ml-1"
            onclick={() => { newTodoImageUrls = []; newTodoImageFiles = []; }}
            title="Hapus lampiran"
            data-testid="btn-remove-new-todo-image"
          >
            ✕
          </button>
        </div>
      {/if}

      <!-- Shortcut Info Helper -->
      <div class="flex items-center gap-1.5 text-xs font-bold text-gray-500 select-none">
        <span>💡</span>
        <span>
          {t('todo.shortcutPrefix')} <kbd class="px-1.5 py-0.5 border border-nb-black rounded bg-nb-yellow text-black font-mono text-[11px] shadow-nb-xs">Enter</kbd> {t('todo.shortcutToSave')}, <kbd class="px-1.5 py-0.5 border border-nb-black rounded bg-gray-200 text-black font-mono text-[11px] shadow-nb-xs">Shift + Enter</kbd> {t('todo.shortcutForNewLine')}
        </span>
      </div>
    </form>

    <!-- Filters & Action Toolbar -->
    <div class="flex flex-col gap-3 pb-3 border-b-2 border-dashed border-gray-300">
      <!-- Search Input Container -->
      <div class="relative w-full">
        <span class="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 font-bold select-none text-base pointer-events-none z-10">
          🔍
        </span>
        <input
          type="text"
          bind:value={searchQuery}
          placeholder={t('todo.searchPlaceholder')}
          class="nb-input pl-10 pr-10 py-2 text-sm font-bold w-full"
          data-testid="search-todo-input"
        />
        {#if searchQuery.trim().length > 0}
          <button
            type="button"
            class="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-gray-200 hover:bg-nb-pink text-xs font-black flex items-center justify-center cursor-pointer border border-nb-black shadow-nb-xs text-black"
            onclick={() => (searchQuery = '')}
            title={t('todo.clearSearch')}
            aria-label={t('todo.clearSearch')}
            data-testid="btn-clear-todo-search"
          >
            ✕
          </button>
        {/if}
      </div>

      <div class="flex justify-between items-center flex-wrap gap-3">
        <div class="flex gap-2 flex-wrap items-center">
          <button
            type="button"
            class="nb-btn text-xs px-3.5 py-1.5 {filter === 'all' ? 'bg-nb-yellow' : 'bg-white'}"
            onclick={() => (filter = 'all')}
            data-testid="filter-all"
          >
            {t('todo.filterAll')} ({todos.length})
          </button>
          <button
            type="button"
            class="nb-btn text-xs px-3.5 py-1.5 {filter === 'active' ? 'bg-nb-yellow' : 'bg-white'}"
            onclick={() => (filter = 'active')}
            data-testid="filter-active"
          >
            {t('todo.filterActive')} ({remainingCount})
          </button>
          <button
            type="button"
            class="nb-btn text-xs px-3.5 py-1.5 {filter === 'done' ? 'bg-nb-yellow' : 'bg-white'}"
            onclick={() => (filter = 'done')}
            data-testid="filter-done"
          >
            {t('todo.filterDone')} ({completedCount})
          </button>

          {#if apps.length > 0}
            <div class="flex items-center gap-1.5 ml-1">
              <span class="text-xs font-extrabold text-nb-black select-none">🎯</span>
              <CustomSelect
                width="min-w-[15dvw]"
                options={[{ label: t('todo.allTopics'), value: 'all' }, ...apps.map(app => ({ label: `${app.icon} ${app.name}`, value: app.id }))]}
                bind:value={topicFilter}
                dataTestId="todo-topic-filter"
                placeholder={t('todo.allTopics')}
                searchPlaceholder={t('todo.searchTopics')}
              />
            </div>
          {/if}
        </div>

        <div class="flex items-center gap-2 flex-wrap">
          {#if todos.length > 0}
            <button
              type="button"
              class="nb-btn text-xs px-3.5 py-1.5 {allTodosDone ? 'bg-nb-yellow text-black' : 'bg-white hover:bg-gray-100 text-black'} border-2 border-nb-black shadow-nb-xs cursor-pointer flex items-center gap-1.5"
              onclick={handleToggleAllTodos}
              data-testid="btn-check-all-todos"
              title={allTodosDone ? t('todo.uncheckAll') : t('todo.checkAll')}
            >
              <span class="text-sm">{allTodosDone ? '☑' : '☐'}</span>
              <span>{allTodosDone ? t('todo.uncheckAll') : t('todo.checkAll')}</span>
            </button>
          {/if}

          {#if completedCount > 0}
            <button
              type="button"
              class="nb-btn bg-nb-red text-white text-xs px-3.5 py-1.5 cursor-pointer"
              onclick={promptDeleteAllCompleted}
              data-testid="clear-completed-button"
            >
              {t('todo.clearCompleted')}
            </button>
          {/if}
        </div>
      </div>
    </div>

    <!-- List Items -->
    <ul
      class="list-none flex flex-col gap-4 p-0 m-0"
      ondragover={handleListDragOver}
      ondrop={handleListDrop}
    >
      {#if isLoading}
        <div class="flex flex-col gap-3" data-testid="todos-skeleton-list">
          <SkeletonTodo />
          <SkeletonTodo />
          <SkeletonTodo />
        </div>
      {:else if filteredTodos.length === 0}
        <li class="p-9 text-center border-2 border-dashed border-gray-300 rounded-md text-gray-500 font-semibold" data-testid="todo-empty-state">
          <p class="m-0">
            {searchQuery.trim().length > 0
              ? t('todo.emptySearch')
              : t('todo.emptyState')}
          </p>
        </li>
      {:else}
        {#each filteredTodos as todo (todo.id)}
          {@const subList = todo.subTasks || []}
          {@const subDoneCount = subList.filter((s) => s.done).length}
          {@const isExpanded = expandedTodoIds[todo.id] ?? false}

          <li
            class="flex flex-col border-2 border-nb-black rounded-md shadow-nb-sm overflow-hidden transition-all duration-100 {todo.done
              ? 'bg-gray-100 opacity-80'
              : 'bg-white'}
              {isTodoDragReady[todo.id] ? 'ring-4 ring-nb-yellow shadow-nb-lg scale-[1.01] cursor-grab active:cursor-grabbing' : ''}
              {draggedTodo?.id === todo.id ? 'opacity-40 border-dashed scale-95' : ''}
              {dragOverTodoId === todo.id ? (draggedSubTask ? 'border-nb-green ring-4 ring-nb-green bg-green-50' : 'border-nb-blue ring-4 ring-nb-blue bg-blue-50') : ''}"
            draggable={canManage && Boolean(isTodoDragReady[todo.id])}
            onpointerdown={(e) => handleTodoPointerDown(todo.id, e)}
            onpointerup={handleTodoPointerUp}
            onpointercancel={handleTodoPointerUp}
            ondragstart={(e) => handleTodoDragStart(todo, e)}
            ondragover={(e) => handleTodoDragOver(todo, e)}
            ondragleave={(e) => handleTodoDragLeave(todo, e)}
            ondrop={(e) => handleTodoDrop(todo, e)}
            ondragend={handleTodoDragEnd}
            data-testid={`todo-item-${todo.id}`}
            data-drag-ready={isTodoDragReady[todo.id] ? 'true' : 'false'}
          >
            <!-- Hint saat Sub-Task di-drag ke atas Todo item -->
            {#if draggedSubTask && dragOverTodoId === todo.id}
              <div class="p-1.5 border-b-2 border-nb-green bg-green-100 text-center" data-testid="drop-subtask-to-todo-hint">
                <p class="text-xs text-green-900 font-bold m-0 flex items-center justify-center gap-1">
                  <span>🚀</span> {t('todo.dropSubtaskAsTodo', 'Lepaskan di sini untuk mengubah menjadi catatan mandiri')}
                </p>
              </div>
            {/if}

            <!-- Parent Todo Row -->
            <div class="flex items-center justify-between gap-3 p-3.5 sm:px-4.5 bg-gray-50 border-b-2 border-nb-black">
              <div class="flex items-center gap-1.5 shrink-0">
                {#if canManage}
                  <button
                    type="button"
                    class="cursor-grab active:cursor-grabbing p-1 text-gray-500 hover:text-black transition-colors"
                    title={t('todo.dragHandleTooltip', 'Tekan lama catatan atau drag handle ini untuk mengubah posisi')}
                    onpointerdown={() => (isTodoDragReady[todo.id] = true)}
                    data-testid={`drag-handle-todo-${todo.id}`}
                    aria-label={`Drag to rearrange todo ${todo.text}`}
                  >
                    <GripVertical size={16} />
                  </button>
                {/if}

                <!-- Expand / Collapse Button -->
                <button
                  type="button"
                  class="w-7 h-7 shrink-0 border-2 border-nb-black bg-white rounded flex items-center justify-center font-bold text-xs cursor-pointer shadow-nb-xs hover:bg-nb-yellow transition-colors"
                  onclick={() => toggleExpand(todo.id)}
                  ondragover={() => { if ((draggedTodo && draggedTodo.id !== todo.id) || draggedSubTask) expandedTodoIds[todo.id] = true; }}
                  title={isExpanded ? 'Tutup sub-tasks' : 'Buka sub-tasks'}
                  aria-label={isExpanded ? 'Tutup sub-tasks' : 'Buka sub-tasks'}
                >
                  {isExpanded ? '▼' : '▶'}
                </button>
              </div>

              <!-- Checkbox & Text -->
              <label class="flex items-center gap-3 cursor-pointer grow select-none">
                <input
                  type="checkbox"
                  checked={todo.done}
                  onchange={() => toggleTodo(todo.id)}
                  class="nb-checkbox shrink-0"
                  data-testid={`checkbox-todo-${todo.id}`}
                />
                <div class="flex flex-col sm:flex-row sm:items-center gap-2 grow">
                  {#if todo.appId}
                    {@const linkedApp = apps.find((a) => a.id === todo.appId)}
                    {#if linkedApp}
                      <span
                        class="inline-flex items-center gap-1 px-2 py-0.5 border-2 border-nb-black text-[11px] font-black uppercase rounded shadow-nb-xs shrink-0 self-start sm:self-auto"
                        style="background-color: {linkedApp.color || 'var(--color-nb-yellow)'}; color: #121212;"
                        data-testid={`todo-topic-badge-${todo.id}`}
                        title={linkedApp.name}
                      >
                        <span>{linkedApp.icon}</span>
                        <span>{linkedApp.name}</span>
                      </span>
                    {/if}
                  {/if}
                  <div class="flex flex-col gap-1 grow">
                    <span
                      class="text-base font-bold leading-snug wrap-break-word whitespace-pre-wrap {todo.done
                        ? 'line-through decoration-2 decoration-nb-black text-gray-500'
                        : 'text-nb-black'}"
                    >
                      {todo.text}
                    </span>
                    {#if (todo.imageUrls && todo.imageUrls.length > 0) || todo.imageUrl}
                      {@const imgCount = todo.imageUrls?.length || (todo.imageUrl ? 1 : 0)}
                      <div class="flex items-center gap-2 mt-0.5">
                        <button
                          type="button"
                          class="inline-flex items-center gap-1.5 px-2 py-0.5 border-2 border-nb-black text-[11px] font-black uppercase rounded shadow-nb-xs bg-blue-100 hover:bg-blue-200 text-nb-black cursor-pointer transition-colors"
                          onclick={() => openTodoImageModal(todo)}
                          data-testid={`btn-view-image-todo-${todo.id}`}
                          title={t('todo.viewImage', 'Lihat Gambar')}
                        >
                          <span>📷</span>
                          <span>{t('todo.viewImage', 'Lihat Gambar')}{imgCount > 1 ? ` (${imgCount})` : ''}</span>
                        </button>
                      </div>
                    {/if}
                  </div>
                </div>
              </label>

              <!-- Upload Image Button for Todo -->
              <button
                type="button"
                class="w-8 h-8 shrink-0 border-2 border-nb-black {(todo.imageUrls && todo.imageUrls.length > 0) || todo.imageUrl ? 'bg-blue-100 text-blue-900' : 'bg-white hover:bg-nb-yellow text-black'} font-bold text-xs rounded flex items-center justify-center cursor-pointer shadow-nb-sm hover:-translate-x-px hover:-translate-y-px hover:shadow-nb-md active:translate-x-px active:translate-y-px active:shadow-nb-xs transition-all duration-100"
                onclick={() => openTodoImageModal(todo)}
                title={(todo.imageUrls && todo.imageUrls.length > 0) || todo.imageUrl ? t('todo.viewImage', 'Lihat / Ubah Gambar') : t('todo.uploadImage', 'Upload Gambar')}
                aria-label={(todo.imageUrls && todo.imageUrls.length > 0) || todo.imageUrl ? t('todo.viewImage', 'Lihat / Ubah Gambar') : t('todo.uploadImage', 'Upload Gambar')}
                data-testid={`btn-upload-image-todo-${todo.id}`}
              >
                📷
              </button>

              <!-- Sub-tasks Progress Badge -->
              {#if subList.length > 0}
                <button
                  type="button"
                  onclick={() => toggleExpand(todo.id)}
                  class="nb-badge shrink-0 cursor-pointer {subDoneCount === subList.length ? 'bg-nb-green' : 'bg-nb-yellow'}"
                  title={t('todo.subtasksTitle')}
                >
                  {subDoneCount}/{subList.length} {t('todo.subtasksCount')}
                </button>
              {/if}

              <!-- Delete Parent Button -->
              <button
                type="button"
                class="w-8 h-8 shrink-0 border-2 border-nb-black bg-nb-red text-white font-black text-sm rounded flex items-center justify-center cursor-pointer shadow-nb-sm hover:-translate-x-px hover:-translate-y-px hover:shadow-nb-md active:translate-x-px active:translate-y-px active:shadow-nb-xs transition-all duration-100"
                onclick={() => promptDeleteTodo(todo)}
                title={t('todo.deleteNote')}
                aria-label={t('todo.deleteNote')}
                data-testid={`delete-todo-${todo.id}`}
              >
                ✕
              </button>
            </div>

            <!-- Sub-tasks Section (Expandable) -->
            {#if isExpanded}
              <div
                role="region"
                aria-label={t('todo.subtasksTitle', 'Sub-tasks')}
                class="p-3 sm:px-5 bg-[#faf8f5] flex flex-col gap-2.5 border-t border-dashed border-gray-300 transition-colors {dragOverSubTodoContainerId === todo.id ? 'bg-green-50 ring-2 ring-nb-green' : ''} {draggedTodo && draggedTodo.id !== todo.id ? 'border-2 border-dashed border-nb-green bg-green-50/20' : ''}"
                ondragover={(e) => handleSubContainerDragOver(todo.id, e)}
                ondragleave={(e) => handleSubContainerDragLeave(todo.id, e)}
                ondrop={(e) => handleSubContainerDrop(todo.id, e)}
                data-testid={`subtasks-container-${todo.id}`}
              >
                <!-- Indicator Drop Todo ke Sub-task -->
                {#if draggedTodo && draggedTodo.id !== todo.id}
                  <div class="p-1.5 border border-dashed border-nb-green bg-green-100 rounded text-center">
                    <p class="text-xs text-green-900 font-bold m-0 flex items-center justify-center gap-1">
                      <span>✨</span> {t('todo.dropTodoAsSubtask', 'Lepaskan di sini untuk mengubah menjadi sub-task')}
                    </p>
                  </div>
                {/if}

                <!-- Sub-tasks List -->
                {#if subList.length > 0}
                  <ul class="list-none flex flex-col gap-2 p-0 m-0 pl-4 sm:pl-6 border-l-3 border-nb-yellow">
                    {#each subList as sub (sub.id)}
                      <li
                        class="flex items-center justify-between gap-3 p-2 px-3 bg-white border border-nb-black rounded shadow-nb-xs transition-all {sub.done ? 'opacity-70 bg-gray-50' : ''}
                          {isSubDragReady[sub.id] ? 'ring-2 ring-nb-yellow scale-[1.01] cursor-grab active:cursor-grabbing' : ''}
                          {draggedSubTask?.sub.id === sub.id ? 'opacity-40 border-dashed scale-95' : ''}
                          {dragOverSubTaskId === sub.id ? 'border-nb-blue ring-2 ring-nb-blue bg-blue-50' : ''}"
                        draggable={canManage && Boolean(isSubDragReady[sub.id])}
                        onpointerdown={(e) => handleSubPointerDown(sub.id, e)}
                        onpointerup={handleSubPointerUp}
                        onpointercancel={handleSubPointerUp}
                        ondragstart={(e) => handleSubDragStart(sub, todo.id, e)}
                        ondragover={(e) => handleSubDragOver(sub, todo.id, e)}
                        ondragleave={(e) => handleSubDragLeave(sub, e)}
                        ondrop={(e) => handleSubDrop(sub, todo.id, e)}
                        ondragend={handleSubDragEnd}
                        data-testid={`subtask-item-${sub.id}`}
                        data-drag-ready={isSubDragReady[sub.id] ? 'true' : 'false'}
                      >
                        <div class="flex items-center gap-1.5 grow">
                          {#if canManage}
                            <button
                              type="button"
                              class="cursor-grab active:cursor-grabbing p-0.5 text-gray-500 hover:text-black transition-colors shrink-0"
                              title={t('todo.dragSubtaskTooltip', 'Tekan lama sub-task atau drag handle ini untuk mengubah posisi atau memindahkan ke catatan lain')}
                              onpointerdown={() => (isSubDragReady[sub.id] = true)}
                              data-testid={`drag-handle-subtask-${sub.id}`}
                              aria-label={`Drag to rearrange subtask ${sub.text}`}
                            >
                              <GripVertical size={14} />
                            </button>
                          {/if}

                          <label class="flex items-center gap-2.5 cursor-pointer grow select-none">
                            <input
                              type="checkbox"
                              checked={sub.done}
                              onchange={() => toggleSubTask(todo.id, sub.id)}
                              class="w-4.5 h-4.5 border-2 border-nb-black rounded bg-white cursor-pointer accent-nb-green shrink-0"
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
                        </div>

                        <button
                          type="button"
                          class="w-6 h-6 shrink-0 border border-nb-black bg-gray-100 hover:bg-nb-red hover:text-white text-gray-600 font-bold text-xs rounded flex items-center justify-center cursor-pointer transition-colors"
                          onclick={() => promptDeleteSubTask(todo.id, sub)}
                          title={t('todo.deleteSubtask')}
                          aria-label={t('todo.deleteSubtask')}
                          data-testid={`delete-subtask-${sub.id}`}
                        >
                          ✕
                        </button>
                      </li>
                    {/each}
                  </ul>
                {:else}
                  <div
                    class="p-2 border-2 border-dashed border-gray-300 rounded text-center {draggedSubTask || (draggedTodo && draggedTodo.id !== todo.id) ? 'border-nb-blue bg-blue-50/50' : ''}"
                  >
                    <p class="text-xs text-gray-500 font-semibold italic m-0">
                      {draggedTodo && draggedTodo.id !== todo.id
                        ? t('todo.dropTodoAsSubtask', 'Lepaskan di sini untuk mengubah menjadi sub-task')
                        : (draggedSubTask
                          ? t('todo.dropSubtaskHere', 'Lepaskan sub-task di sini...')
                          : t('todo.subtasksEmpty'))}
                    </p>
                  </div>
                {/if}

                <!-- Add Sub-task Input Form -->
                <form
                  onsubmit={(e) => addSubTask(todo.id, e)}
                  class="flex gap-2 pl-4 sm:pl-6 pt-1 items-stretch"
                >
                  <textarea
                    bind:value={subTaskInputs[todo.id]}
                    onkeydown={(e) => handleSubTaskKeydown(todo.id, e)}
                    placeholder={t('todo.subtaskPlaceholder')}
                    rows="1"
                    class="w-full text-xs font-semibold px-3 py-1.5 border-2 border-nb-black rounded shadow-nb-xs bg-white outline-none focus:shadow-nb-sm resize-y min-h-8.5 leading-snug"
                    data-testid={`input-subtask-${todo.id}`}
                  ></textarea>
                  <button
                    type="submit"
                    class="nb-btn bg-nb-blue text-xs font-bold px-3 py-1.5 shadow-nb-xs border-2 border-nb-black shrink-0 self-start h-auto"
                    data-testid={`button-add-subtask-${todo.id}`}
                  >
                    {t('todo.subtaskAddButton')}
                  </button>
                </form>
              </div>
            {/if}
          </li>
        {/each}
        {#if draggedSubTask}
          <li
            class="p-3 border-2 border-dashed border-nb-green bg-green-50 rounded-md text-center cursor-pointer transition-all animate-pulse"
            ondragover={(e) => { e.preventDefault(); }}
            ondrop={handleListDrop}
            data-testid="subtask-to-todo-dropzone"
          >
            <p class="text-sm text-green-900 font-extrabold m-0 flex items-center justify-center gap-2">
              <span>🚀</span> {t('todo.dropSubtaskAsTodo', 'Lepaskan di sini untuk mengubah menjadi catatan mandiri')}
            </p>
          </li>
        {/if}
      {/if}
    </ul>
  </div>

  <!-- Deletion Confirmation Modal -->
  <ConfirmModal
    isOpen={deleteTarget !== null}
    title={deleteTarget?.type === 'todo' ? t('todo.confirmModalDeleteNoteTitle') : deleteTarget?.type === 'subtask' ? t('todo.confirmModalDeleteSubtaskTitle') : t('todo.confirmModalDeleteAllTitle')}
    message={deleteTarget?.type === 'todo'
      ? t('todo.confirmModalDeleteNoteMsg')
      : deleteTarget?.type == 'subtask' ? t('todo.confirmModalDeleteSubtaskMsg') : t('todo.confirmModalDeleteAllMsg')}
    itemText={deleteTarget?.text || ''}
    confirmText={t('action.delete')}
    cancelText={t('action.cancel')}
    onConfirm={handleConfirmDelete}
    onCancel={handleCancelDelete}
  />

  <!-- Image Upload & Preview Modal -->
  <ImageUploadModal
    isOpen={isImageModalOpen}
    initialImageUrls={imageModalMode === 'new' ? newTodoImageUrls : (activeImageTodo?.imageUrls || (activeImageTodo?.imageUrl ? [activeImageTodo.imageUrl] : []))}
    initialImageUrl={imageModalMode === 'new' ? newTodoImageUrl : (activeImageTodo?.imageUrl || null)}
    title={imageModalMode === 'new' ? t('imageModal.title', 'UPLOAD & PREVIEW GAMBAR') : `${t('imageModal.title', 'UPLOAD & PREVIEW GAMBAR')}: ${activeImageTodo?.text || ''}`}
    onClose={handleImageModalClose}
    onSave={handleImageModalSave}
    onRemove={handleImageModalRemove}
  />
</section>

import { createStore as createZustandStore, type StoreApi } from 'zustand/vanilla';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';

export interface SubTask {
  id: string;
  text: string;
  done: boolean;
  createdAt: number;
}

export interface Todo {
  id: string;
  appId?: string | null;
  text: string;
  done: boolean;
  createdAt: number;
  subTasks?: SubTask[];
}

export interface TodoStoreState {
  todos: Todo[];
  isLoading: boolean;
  fetchTodos: () => Promise<void>;
  addTodo: (text: string, appId?: string | null) => Promise<Todo>;
  toggleTodo: (id: string) => Promise<void>;
  deleteTodo: (id: string) => Promise<void>;
  deleteTodosByAppId: (appId: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
  addSubTask: (todoId: string, text: string) => Promise<void>;
  toggleSubTask: (todoId: string, subTaskId: string) => Promise<void>;
  deleteSubTask: (todoId: string, subTaskId: string) => Promise<void>;
  resetTodos: () => void;
}

const STORAGE_KEY = 'svelte_hub_todos';

const defaultTodos: Todo[] = [
  {
    id: '1',
    appId: 'todo-svelte',
    text: 'Pelajari reaktivitas Runes di Svelte 5',
    done: true,
    createdAt: Date.now() - 3600000,
    subTasks: [
      { id: '1-1', text: 'Eksplorasi $state() untuk state lokal', done: true, createdAt: Date.now() - 3500000 },
      { id: '1-2', text: 'Gunakan $derived() untuk computed values', done: true, createdAt: Date.now() - 3400000 },
      { id: '1-3', text: 'Gunakan $effect() untuk sinkronisasi localStorage', done: true, createdAt: Date.now() - 3300000 },
    ],
  },
  {
    id: '2',
    appId: 'code-snippets',
    text: 'Setup deployment Docker multi-stage dengan Nginx',
    done: false,
    createdAt: Date.now() - 1800000,
    subTasks: [
      { id: '2-1', text: 'Buat Dockerfile multi-stage dengan builder Bun', done: true, createdAt: Date.now() - 1700000 },
      { id: '2-2', text: 'Konfigurasi nginx.conf untuk SPA routing', done: true, createdAt: Date.now() - 1600000 },
      { id: '2-3', text: 'Uji container di port 8080 via docker compose', done: false, createdAt: Date.now() - 1500000 },
    ],
  },
  {
    id: '3',
    appId: 'portfolio',
    text: 'Tambahkan link proyek Svelte lama ke file apps.ts',
    done: false,
    createdAt: Date.now(),
    subTasks: [
      { id: '3-1', text: 'Kumpulkan URL repo dan live demo', done: false, createdAt: Date.now() },
      { id: '3-2', text: 'Tambahkan kontak WhatsApp PIC masing-masing apps', done: true, createdAt: Date.now() },
    ],
  },
];

function loadLocalTodos(): Todo[] {
  if (typeof window === 'undefined') return defaultTodos;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => ({
          ...item,
          appId: item.appId || item.app_id || null,
          subTasks: Array.isArray(item.subTasks) ? item.subTasks : [],
        }));
      }
    }
  } catch (e) {
    console.error('[todoStore] Failed to load todos from localStorage', e);
  }
  return defaultTodos;
}

function saveLocalTodos(todos: Todo[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch (e) {
    console.error('[todoStore] Failed to save todos to localStorage', e);
  }
}

function mapRowToTodo(row: any): Todo {
  return {
    id: row.id,
    appId: row.app_id || row.appId || null,
    text: row.text,
    done: Boolean(row.done),
    createdAt: Number(row.created_at) || Date.now(),
    subTasks: Array.isArray(row.sub_tasks) ? row.sub_tasks : [],
  };
}

function mapTodoToRow(todo: Todo) {
  return {
    id: todo.id,
    app_id: todo.appId || null,
    text: todo.text,
    done: todo.done,
    created_at: todo.createdAt,
    sub_tasks: todo.subTasks || [],
  };
}

const rawStore: StoreApi<TodoStoreState> = createZustandStore<TodoStoreState>((set, get) => ({
  todos: loadLocalTodos(),
  isLoading: false,

  fetchTodos: async () => {
    if (!isSupabaseEnabled || !supabase) return;
    set({ isLoading: true });
    try {
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data && data.length > 0) {
        const fetched = data.map(mapRowToTodo);
        set({ todos: fetched });
        saveLocalTodos(fetched);
      }
    } catch (err) {
      console.warn('[todoStore] Failed to fetch todos from Supabase, using local todos', err);
    } finally {
      set({ isLoading: false });
    }
  },

  resetTodos: () => {
    set({ todos: [...defaultTodos], isLoading: false });
    saveLocalTodos(defaultTodos);
  },

  addTodo: async (text: string, appId?: string | null) => {
    const newTodo: Todo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      appId: appId || null,
      text: text.trim(),
      done: false,
      createdAt: Date.now(),
      subTasks: [],
    };

    const updated = [newTodo, ...get().todos];
    set({ todos: updated, isLoading: false });
    saveLocalTodos(updated);

    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('todos').insert([mapTodoToRow(newTodo)]);
      } catch (err) {
        console.error('[todoStore] Failed to insert todo into Supabase', err);
      }
    }

    return newTodo;
  },

  toggleTodo: async (id: string) => {
    const target = get().todos.find((t) => t.id === id);
    if (!target) return;

    const updated = get().todos.map((t) => (t.id === id ? { ...t, done: !t.done } : t));
    set({ todos: updated });
    saveLocalTodos(updated);

    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('todos').update({ done: !target.done }).eq('id', id);
      } catch (err) {
        console.error('[todoStore] Failed to toggle todo in Supabase', err);
      }
    }
  },

  deleteTodo: async (id: string) => {
    const updated = get().todos.filter((t) => t.id !== id);
    set({ todos: updated });
    saveLocalTodos(updated);

    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('todos').delete().eq('id', id);
      } catch (err) {
        console.error('[todoStore] Failed to delete todo in Supabase', err);
      }
    }
  },

  deleteTodosByAppId: async (appId: string) => {
    const updated = get().todos.filter((t) => t.appId !== appId);
    set({ todos: updated });
    saveLocalTodos(updated);

    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('todos').delete().eq('app_id', appId);
      } catch (err) {
        console.error('[todoStore] Failed to delete todos by app_id in Supabase', err);
      }
    }
  },

  clearCompleted: async () => {
    const completedIds = get().todos.filter((t) => t.done).map((t) => t.id);

    if (isSupabaseEnabled && supabase && completedIds.length > 0) {
      try {
        await supabase.from('todos').delete().in('id', completedIds);
      } catch (err) {
        console.error('[todoStore] Failed to clear completed todos in Supabase', err);
      }
    }
    const updated = get().todos.filter((t) => !t.done);
    set({ todos: updated });
    saveLocalTodos(updated);
  },

  addSubTask: async (todoId: string, text: string) => {
    const target = get().todos.find((t) => t.id === todoId);
    if (!target) return;

    const newSub: SubTask = {
      id: `${todoId}-${Date.now()}`,
      text: text.trim(),
      done: false,
      createdAt: Date.now(),
    };

    const currentSubs = target.subTasks || [];
    const updatedSubs = [...currentSubs, newSub];

    const updated = get().todos.map((t) => (t.id === todoId ? { ...t, subTasks: updatedSubs } : t));
    set({ todos: updated });
    saveLocalTodos(updated);

    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('todos').update({ sub_tasks: updatedSubs }).eq('id', todoId);
      } catch (err) {
        console.error('[todoStore] Failed to add subtask in Supabase', err);
      }
    }
  },

  toggleSubTask: async (todoId: string, subTaskId: string) => {
    const target = get().todos.find((t) => t.id === todoId);
    if (!target) return;

    const updatedSubs = (target.subTasks || []).map((s) =>
      s.id === subTaskId ? { ...s, done: !s.done } : s
    );

    const updated = get().todos.map((t) => (t.id === todoId ? { ...t, subTasks: updatedSubs } : t));
    set({ todos: updated });
    saveLocalTodos(updated);

    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('todos').update({ sub_tasks: updatedSubs }).eq('id', todoId);
      } catch (err) {
        console.error('[todoStore] Failed to toggle subtask in Supabase', err);
      }
    }
  },

  deleteSubTask: async (todoId: string, subTaskId: string) => {
    const target = get().todos.find((t) => t.id === todoId);
    if (!target) return;

    const updatedSubs = (target.subTasks || []).filter((s) => s.id !== subTaskId);

    const updated = get().todos.map((t) => (t.id === todoId ? { ...t, subTasks: updatedSubs } : t));
    set({ todos: updated });
    saveLocalTodos(updated);

    if (isSupabaseEnabled && supabase) {
      try {
        await supabase.from('todos').update({ sub_tasks: updatedSubs }).eq('id', todoId);
      } catch (err) {
        console.error('[todoStore] Failed to delete subtask in Supabase', err);
      }
    }
  },
}));

if (typeof window !== 'undefined' && isSupabaseEnabled) {
  rawStore.getState().fetchTodos();
}

export const todoStore = {
  ...rawStore,
  fetchTodos: () => rawStore.getState().fetchTodos(),
  addTodo: (text: string, appId?: string | null) => rawStore.getState().addTodo(text, appId),
  toggleTodo: (id: string) => rawStore.getState().toggleTodo(id),
  deleteTodo: (id: string) => rawStore.getState().deleteTodo(id),
  deleteTodosByAppId: (appId: string) => rawStore.getState().deleteTodosByAppId(appId),
  clearCompleted: () => rawStore.getState().clearCompleted(),
  addSubTask: (todoId: string, text: string) => rawStore.getState().addSubTask(todoId, text),
  toggleSubTask: (todoId: string, subTaskId: string) => rawStore.getState().toggleSubTask(todoId, subTaskId),
  deleteSubTask: (todoId: string, subTaskId: string) => rawStore.getState().deleteSubTask(todoId, subTaskId),
  resetTodos: () => rawStore.getState().resetTodos(),
  subscribe(run: (state: TodoStoreState) => void) {
    run(rawStore.getState());
    return rawStore.subscribe((state) => run(state));
  },
};

if (typeof window !== 'undefined') {
  (window as any).__todoStore = todoStore;
}

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
  deleteTodosByAppIds: (appIds: string[]) => Promise<void>;
  checkAllTodos: (done?: boolean) => Promise<void>;
  clearCompleted: () => Promise<void>;
  addSubTask: (todoId: string, text: string) => Promise<void>;
  toggleSubTask: (todoId: string, subTaskId: string) => Promise<void>;
  deleteSubTask: (todoId: string, subTaskId: string) => Promise<void>;
  resetTodos: () => void;
}

const STORAGE_KEY = 'svelte_hub_todos';

const defaultTodos: Todo[] = [];

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
  let subTasks: SubTask[] = [];

  // 1. Cek relasi dari tabel subtodos
  if (Array.isArray(row.subtodos)) {
    subTasks = row.subtodos
      .map((s: any) => ({
        id: s.id,
        text: s.text,
        done: Boolean(s.done),
        createdAt: Number(s.created_at) || Date.now(),
      }))
      .sort((a: SubTask, b: SubTask) => a.createdAt - b.createdAt);
  } else if (Array.isArray(row.sub_tasks)) {
    // Fallback legacy JSON array
    subTasks = row.sub_tasks;
  }

  return {
    id: row.id,
    appId: row.appId || row.app_id || null,
    text: row.text,
    done: Boolean(row.done),
    createdAt: Number(row.created_at) || Date.now(),
    subTasks,
  };
}

function mapTodoToRow(todo: Todo) {
  return {
    id: todo.id,
    appId: todo.appId || null,
    text: todo.text,
    done: todo.done,
    created_at: todo.createdAt,
  };
}

const rawStore: StoreApi<TodoStoreState> = createZustandStore<TodoStoreState>((set, get) => ({
  todos: loadLocalTodos(),
  isLoading: isSupabaseEnabled,

  fetchTodos: async () => {
    if (!isSupabaseEnabled || !supabase) return;
    set({ isLoading: true });
    try {
      // Query todos bersama dengan relasi tabel subtodos
      let { data, error } = await supabase
        .from('todos')
        .select('*, subtodos(*)')
        .order('created_at', { ascending: false });

      if (error) {
        // Fallback jika relasi tabel subtodos belum diaktifkan di schema
        const fallback = await supabase
          .from('todos')
          .select('*')
          .order('created_at', { ascending: false });
        if (fallback.error) throw fallback.error;
        data = fallback.data;
      }

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
        const payload = mapTodoToRow(newTodo);
        const { error } = await supabase.from('todos').insert([payload]);
        if (error && error.code === 'PGRST204') {
          const { appId: _, ...fallbackPayload } = payload;
          await supabase.from('todos').insert([fallbackPayload]);
        }
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
        // Hapus subtodos terkait terlebih dahulu atau cascade via postgres
        await supabase.from('subtodos').delete().eq('todo_id', id);
        await supabase.from('todos').delete().eq('id', id);
      } catch (err) {
        console.error('[todoStore] Failed to delete todo in Supabase', err);
      }
    }
  },

  deleteTodosByAppId: async (appId: string) => {
    const removedTodos = get().todos.filter((t) => t.appId === appId);
    const removedIds = removedTodos.map((t) => t.id);

    const updated = get().todos.filter((t) => t.appId !== appId);
    set({ todos: updated });
    saveLocalTodos(updated);

    if (isSupabaseEnabled && supabase) {
      try {
        if (removedIds.length > 0) {
          await supabase.from('subtodos').delete().in('todo_id', removedIds);
        }
        const { error } = await supabase.from('todos').delete().eq('appId', appId);
        if (error) {
          await supabase.from('todos').delete().eq('app_id', appId);
        }
      } catch (err) {
        console.error('[todoStore] Failed to delete todos by appId in Supabase', err);
      }
    }
  },

  deleteTodosByAppIds: async (appIds: string[]) => {
    if (appIds.length === 0) return;
    const appIdSet = new Set(appIds);
    const removedTodos = get().todos.filter((t) => t.appId && appIdSet.has(t.appId));
    const removedIds = removedTodos.map((t) => t.id);

    const updated = get().todos.filter((t) => !t.appId || !appIdSet.has(t.appId));
    set({ todos: updated });
    saveLocalTodos(updated);

    if (isSupabaseEnabled && supabase) {
      try {
        if (removedIds.length > 0) {
          await supabase.from('subtodos').delete().in('todo_id', removedIds);
        }
        const { error } = await supabase.from('todos').delete().in('appId', appIds);
        if (error) {
          await supabase.from('todos').delete().in('app_id', appIds);
        }
      } catch (err) {
        console.error('[todoStore] Failed to bulk delete todos by appIds in Supabase', err);
      }
    }
  },

  checkAllTodos: async (done: boolean = true) => {
    const allTodos = get().todos;
    if (allTodos.length === 0) return;

    const updated = allTodos.map((t) => ({ ...t, done }));
    set({ todos: updated });
    saveLocalTodos(updated);

    if (isSupabaseEnabled && supabase) {
      try {
        const allIds = allTodos.map((t) => t.id);
        const { error } = await supabase.from('todos').update({ done }).in('id', allIds);
        if (error) throw error;
      } catch (err) {
        console.error('[todoStore] Failed to update all todos in Supabase', err);
      }
    }
  },

  clearCompleted: async () => {
    const completedTodos = get().todos.filter((t) => t.done);
    const completedIds = completedTodos.map((t) => t.id);

    if (isSupabaseEnabled && supabase && completedIds.length > 0) {
      try {
        await supabase.from('subtodos').delete().in('todo_id', completedIds);
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
        // Simpan ke tabel relasional subtodos
        const { error } = await supabase.from('subtodos').insert([{
          id: newSub.id,
          todo_id: todoId,
          text: newSub.text,
          done: false,
          created_at: newSub.createdAt,
        }]);

        if (error) {
          // Fallback ke kolom JSON jika tabel subtodos belum tersedia
          await supabase.from('todos').update({ sub_tasks: updatedSubs }).eq('id', todoId);
        }
      } catch (err) {
        console.error('[todoStore] Failed to add subtask into subtodos table', err);
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
        const targetSub = updatedSubs.find((s) => s.id === subTaskId);
        const { error } = await supabase
          .from('subtodos')
          .update({ done: targetSub ? targetSub.done : false })
          .eq('id', subTaskId);

        if (error) {
          await supabase.from('todos').update({ sub_tasks: updatedSubs }).eq('id', todoId);
        }
      } catch (err) {
        console.error('[todoStore] Failed to toggle subtask in subtodos table', err);
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
        const { error } = await supabase.from('subtodos').delete().eq('id', subTaskId);
        if (error) {
          await supabase.from('todos').update({ sub_tasks: updatedSubs }).eq('id', todoId);
        }
      } catch (err) {
        console.error('[todoStore] Failed to delete subtask from subtodos table', err);
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
  deleteTodosByAppIds: (appIds: string[]) => rawStore.getState().deleteTodosByAppIds(appIds),
  checkAllTodos: (done?: boolean) => rawStore.getState().checkAllTodos(done),
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

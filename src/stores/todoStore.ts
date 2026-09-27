import { createStore as createZustandStore, type StoreApi } from 'zustand/vanilla';
import { supabase, isSupabaseEnabled } from '@/lib/supabase';
import { i18nStore } from '@/stores/i18nStore';
import { env } from '@/lib/env';

const t = i18nStore.t;

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
  imageUrl?: string | null;
  imageUrls?: string[];
  subTasks?: SubTask[];
}

export function parseImageUrls(raw: any): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()));
  }
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()));
        }
      } catch {
        // fallback
      }
    }
    if (trimmed) return [trimmed];
  }
  return [];
}

export function extractStoragePath(imageUrl: string, bucketName: string = 'todo-images'): string | null {
  if (!imageUrl) return null;
  const marker = `/${bucketName}/`;
  const index = imageUrl.indexOf(marker);
  if (index !== -1) {
    return decodeURIComponent(imageUrl.substring(index + marker.length).split('?')[0]);
  }
  if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://') && !imageUrl.startsWith('data:')) {
    return imageUrl;
  }
  return null;
}

export function extractStoragePaths(imageUrls: string[], bucketName: string = 'todo-images'): string[] {
  return imageUrls
    .map((url) => extractStoragePath(url, bucketName))
    .filter((path): path is string => Boolean(path));
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export interface TodoStoreState {
  todos: Todo[];
  isLoading: boolean;
  fetchTodos: () => Promise<void>;
  addTodo: (text: string, appId?: string | null, imageUrlOrUrls?: string | string[] | null) => Promise<Todo>;
  updateTodoImage: (id: string, imageUrl: string | null) => Promise<void>;
  updateTodoImages: (id: string, imageUrls: string[]) => Promise<void>;
  uploadTodoImage: (file: File) => Promise<string>;
  uploadTodoImages: (files: File[]) => Promise<string[]>;
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
        return parsed.map((item) => {
          const urls = parseImageUrls(item.imageUrls || item.imageUrl || item.image_urls || item.image_url);
          return {
            ...item,
            appId: item.appId || item.app_id || null,
            imageUrl: urls[0] || null,
            imageUrls: urls,
            subTasks: Array.isArray(item.subTasks) ? item.subTasks : [],
          };
        });
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

  const urls = parseImageUrls(row.image_urls || row.imageUrls || row.image_url || row.imageUrl);

  return {
    id: row.id,
    appId: row.appId || row.app_id || null,
    text: row.text,
    done: Boolean(row.done),
    createdAt: Number(row.created_at) || Date.now(),
    imageUrl: urls[0] || null,
    imageUrls: urls,
    subTasks,
  };
}

function mapTodoToRow(todo: Todo) {
  const urls = todo.imageUrls || (todo.imageUrl ? [todo.imageUrl] : []);
  return {
    id: todo.id,
    appId: todo.appId || null,
    text: todo.text,
    done: todo.done,
    created_at: todo.createdAt,
    image_url: urls.length > 1 ? JSON.stringify(urls) : (urls[0] || null),
  };
}

async function removeImagesForTodos(todos: Todo[]) {
  if (!isSupabaseEnabled || !supabase) return;
  const allUrls: string[] = [];
  for (const t of todos) {
    if (t.imageUrls && t.imageUrls.length > 0) {
      allUrls.push(...t.imageUrls);
    } else if (t.imageUrl) {
      allUrls.push(t.imageUrl);
    }
  }
  const paths = extractStoragePaths(allUrls, 'todo-images');
  if (paths.length > 0) {
    try {
      await supabase.storage.from('todo-images').remove(paths);
    } catch (err) {
      console.error('[todoStore] Failed to batch remove images from storage', err);
    }
  }
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

  uploadTodoImage: async (file: File): Promise<string> => {
    const allowedExtensions = ['jpg', 'jpeg', 'png', 'svg'];
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!ext || !allowedExtensions.includes(ext)) {
      throw new Error(t("imageModal.errFormat", "Ekstensi file tidak didukung! Hanya .jpg, .jpeg, .png, dan .svg yang diperbolehkan."));
    }

    const maxMb = env.maxImageSizeMb || 5;
    const MAX_SIZE = maxMb * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      throw new Error(t('imageModal.errSize', `Ukuran file melebihi batas maksimal ${maxMb} MB!`));
    }

    if (isSupabaseEnabled && supabase) {
      try {
        const fileName = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}.${ext}`;
        const filePath = `todos/${fileName}`;
        const { data, error } = await supabase.storage
          .from('todo-images')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: true,
          });

        if (error) {
          console.warn('[todoStore] Storage upload failed, fallback to Data URL', error);
          return await fileToDataUrl(file);
        }

        const { data: urlData } = supabase.storage
          .from('todo-images')
          .getPublicUrl(filePath);

        return urlData.publicUrl;
      } catch (err) {
        console.warn('[todoStore] Storage upload exception, fallback to Data URL', err);
        return await fileToDataUrl(file);
      }
    }

    return await fileToDataUrl(file);
  },

  uploadTodoImages: async (files: File[]): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of files) {
      const url = await get().uploadTodoImage(file);
      urls.push(url);
    }
    return urls;
  },

  updateTodoImages: async (id: string, imageUrls: string[]) => {
    const target = get().todos.find((t) => t.id === id);
    if (!target) return;

    const oldUrls = target.imageUrls || (target.imageUrl ? [target.imageUrl] : []);
    const removedUrls = oldUrls.filter((oldUrl) => !imageUrls.includes(oldUrl));

    if (removedUrls.length > 0 && isSupabaseEnabled && supabase) {
      try {
        const paths = extractStoragePaths(removedUrls, 'todo-images');
        if (paths.length > 0) {
          await supabase.storage.from('todo-images').remove(paths);
        }
      } catch (err) {
        console.error('[todoStore] Failed to remove previous images from Supabase storage', err);
      }
    }

    const updated = get().todos.map((t) =>
      t.id === id
        ? {
            ...t,
            imageUrl: imageUrls[0] || null,
            imageUrls: [...imageUrls],
          }
        : t
    );
    set({ todos: updated });
    saveLocalTodos(updated);

    if (isSupabaseEnabled && supabase) {
      try {
        const dbImageUrl = imageUrls.length > 1 ? JSON.stringify(imageUrls) : (imageUrls[0] || null);
        await supabase.from('todos').update({ image_url: dbImageUrl }).eq('id', id);
      } catch (err) {
        console.error('[todoStore] Failed to update todo image in Supabase', err);
      }
    }
  },

  updateTodoImage: async (id: string, imageUrl: string | null) => {
    await get().updateTodoImages(id, imageUrl ? [imageUrl] : []);
  },

  addTodo: async (text: string, appId?: string | null, imageUrlOrUrls?: string | string[] | null) => {
    const urls = Array.isArray(imageUrlOrUrls)
      ? imageUrlOrUrls
      : (imageUrlOrUrls ? [imageUrlOrUrls] : []);

    const newTodo: Todo = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      appId: appId || null,
      text: text.trim(),
      done: false,
      createdAt: Date.now(),
      imageUrl: urls[0] || null,
      imageUrls: urls,
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
    const target = get().todos.find((t) => t.id === id);
    const updated = get().todos.filter((t) => t.id !== id);
    set({ todos: updated });
    saveLocalTodos(updated);

    if (target && isSupabaseEnabled && supabase) {
      const targetUrls = target.imageUrls || (target.imageUrl ? [target.imageUrl] : []);
      const paths = extractStoragePaths(targetUrls, 'todo-images');
      if (paths.length > 0) {
        try {
          await supabase.storage.from('todo-images').remove(paths);
        } catch (err) {
          console.error('[todoStore] Failed to remove image from Supabase storage', err);
        }
      }
    }

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

    await removeImagesForTodos(removedTodos);

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

    await removeImagesForTodos(removedTodos);

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

    await removeImagesForTodos(completedTodos);

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
  addTodo: (text: string, appId?: string | null, imageUrlOrUrls?: string | string[] | null) => rawStore.getState().addTodo(text, appId, imageUrlOrUrls),
  updateTodoImage: (id: string, imageUrl: string | null) => rawStore.getState().updateTodoImage(id, imageUrl),
  updateTodoImages: (id: string, imageUrls: string[]) => rawStore.getState().updateTodoImages(id, imageUrls),
  uploadTodoImage: (file: File) => rawStore.getState().uploadTodoImage(file),
  uploadTodoImages: (files: File[]) => rawStore.getState().uploadTodoImages(files),
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

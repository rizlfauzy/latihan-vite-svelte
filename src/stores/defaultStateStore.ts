import { createStore as createZustandStore, type StoreApi } from "zustand/vanilla";
import { i18nStore } from "@/stores/i18nStore";

const { t } = i18nStore;

export interface DefaultStateStore {
  priority: {
    label: string;
    value: string;
  }[];
  setPriority: (priority: {
    label: string;
    value: string;
  }[]) => void;
}

export const rawDefaultStateStore: StoreApi<DefaultStateStore> = createZustandStore<DefaultStateStore>((set) => ({
  priority: [
    { label: `🚨 ${t("todo.priorityUrgent", "Urgent")}`, value: "urgent" },
    { label: `⚡ ${t("todo.priorityHigh", "High")}`, value: "high" },
    { label: `🔵 ${t("todo.priorityNormal", "Normal")}`, value: "normal" },
    { label: `🟢 ${t("todo.priorityLow", "Low")}`, value: "low" },
  ],
  setPriority: (priority) => set({ priority }),
}));

export const defaultStateStore = {
  ...rawDefaultStateStore,
  setPriority: (priority: {
    label: string;
    value: string;
  }[]) => rawDefaultStateStore.getState().setPriority(priority),
  subscribe(run: (state: DefaultStateStore) => void) {
    run(rawDefaultStateStore.getState());
    return rawDefaultStateStore.subscribe((state) => run(state));
  },
};
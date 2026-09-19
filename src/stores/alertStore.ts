import { createStore as createZustandStore, type StoreApi } from 'zustand/vanilla';

export interface AlertItem {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
  duration?: number;
}

export interface AlertStoreState {
  alerts: AlertItem[];
  addAlert: (alert: Omit<AlertItem, 'id'>) => string;
  removeAlert: (id: string) => void;
  showSuccess: (message: string, duration?: number) => string;
  showError: (message: string, duration?: number) => string;
  showInfo: (message: string, duration?: number) => string;
  clearAlerts: () => void;
}

const rawAlertStore: StoreApi<AlertStoreState> = createZustandStore<AlertStoreState>((set, get) => ({
  alerts: [],

  addAlert: (alert: Omit<AlertItem, 'id'>) => {
    const id = `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const duration = alert.duration ?? 3500;
    const newAlert: AlertItem = { ...alert, id, duration };

    set({ alerts: [...get().alerts, newAlert] });

    if (duration > 0 && typeof window !== 'undefined') {
      setTimeout(() => {
        get().removeAlert(id);
      }, duration);
    }

    return id;
  },

  removeAlert: (id: string) => {
    set({ alerts: get().alerts.filter((a) => a.id !== id) });
  },

  showSuccess: (message: string, duration = 3500) => {
    return get().addAlert({ type: 'success', message, duration });
  },

  showError: (message: string, duration = 4000) => {
    return get().addAlert({ type: 'error', message, duration });
  },

  showInfo: (message: string, duration = 3500) => {
    return get().addAlert({ type: 'info', message, duration });
  },

  clearAlerts: () => {
    set({ alerts: [] });
  },
}));

// Provide Svelte store contract `subscribe` and direct helper methods
export const alertStore = {
  ...rawAlertStore,
  addAlert: (alert: Omit<AlertItem, 'id'>) => rawAlertStore.getState().addAlert(alert),
  removeAlert: (id: string) => rawAlertStore.getState().removeAlert(id),
  showSuccess: (message: string, duration?: number) => rawAlertStore.getState().showSuccess(message, duration),
  showError: (message: string, duration?: number) => rawAlertStore.getState().showError(message, duration),
  showInfo: (message: string, duration?: number) => rawAlertStore.getState().showInfo(message, duration),
  clearAlerts: () => rawAlertStore.getState().clearAlerts(),
  subscribe(run: (state: AlertStoreState) => void) {
    run(rawAlertStore.getState());
    return rawAlertStore.subscribe((state) => run(state));
  },
};

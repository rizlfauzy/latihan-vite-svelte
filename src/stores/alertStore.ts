import { createStore as createZustandStore, type StoreApi } from 'zustand/vanilla';

export interface AlertItem {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info' | 'skeleton';
  message: string;
  duration?: number;
  remainingTime?: number;
  lastStartedAt?: number;
  isPaused?: boolean;
}

export interface AlertStoreState {
  alerts: AlertItem[];
  addAlert: (alert: Omit<AlertItem, 'id'>) => string;
  removeAlert: (id: string) => void;
  pauseAlert: (id: string) => void;
  resumeAlert: (id: string) => void;
  showSuccess: (message: string, duration?: number) => string;
  showError: (message: string, duration?: number) => string;
  showWarning: (message: string, duration?: number) => string;
  showInfo: (message: string, duration?: number) => string;
  showSkeleton: (duration?: number) => string;
  clearAlerts: () => void;
}

const timerMap = new Map<string, ReturnType<typeof setTimeout>>();

const rawAlertStore: StoreApi<AlertStoreState> = createZustandStore<AlertStoreState>((set, get) => ({
  alerts: [],

  addAlert: (alert: Omit<AlertItem, 'id'>) => {
    const id = `alert_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const duration = alert.duration ?? 3500;
    const newAlert: AlertItem = {
      ...alert,
      id,
      duration,
      remainingTime: duration,
      lastStartedAt: Date.now(),
      isPaused: false,
    };

    set({ alerts: [...get().alerts, newAlert] });

    if (duration > 0 && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        get().removeAlert(id);
      }, duration);
      timerMap.set(id, timer);
    }

    return id;
  },

  removeAlert: (id: string) => {
    const timer = timerMap.get(id);
    if (timer) {
      clearTimeout(timer);
      timerMap.delete(id);
    }
    set({ alerts: get().alerts.filter((a) => a.id !== id) });
  },

  pauseAlert: (id: string) => {
    const target = get().alerts.find((a) => a.id === id);
    if (!target || target.isPaused) return;

    const timer = timerMap.get(id);
    if (timer) {
      clearTimeout(timer);
      timerMap.delete(id);
    }

    const elapsed = Date.now() - (target.lastStartedAt || Date.now());
    const remainingTime = Math.max(300, (target.remainingTime ?? target.duration ?? 3500) - elapsed);

    set({
      alerts: get().alerts.map((a) => (a.id === id ? { ...a, isPaused: true, remainingTime } : a)),
    });
  },

  resumeAlert: (id: string) => {
    const target = get().alerts.find((a) => a.id === id);
    if (!target || !target.isPaused) return;

    const remainingTime = target.remainingTime ?? target.duration ?? 3500;
    const lastStartedAt = Date.now();

    if (remainingTime > 0 && typeof window !== 'undefined') {
      const timer = setTimeout(() => {
        get().removeAlert(id);
      }, remainingTime);
      timerMap.set(id, timer);
    }

    set({
      alerts: get().alerts.map((a) =>
        a.id === id ? { ...a, isPaused: false, lastStartedAt } : a
      ),
    });
  },

  showSuccess: (message: string, duration = 3500) => {
    return get().addAlert({ type: 'success', message, duration });
  },

  showError: (message: string, duration = 4000) => {
    return get().addAlert({ type: 'error', message, duration });
  },

  showWarning: (message: string, duration = 3500) => {
    return get().addAlert({ type: 'warning', message, duration });
  },

  showInfo: (message: string, duration = 3500) => {
    return get().addAlert({ type: 'info', message, duration });
  },

  showSkeleton: (duration = 3500) => {
    return get().addAlert({ type: 'skeleton', message: 'Loading...', duration });
  },

  clearAlerts: () => {
    timerMap.forEach((timer) => clearTimeout(timer));
    timerMap.clear();
    set({ alerts: [] });
  },
}));

// Provide Svelte store contract `subscribe` and direct helper methods
export const alertStore = {
  ...rawAlertStore,
  addAlert: (alert: Omit<AlertItem, 'id'>) => rawAlertStore.getState().addAlert(alert),
  removeAlert: (id: string) => rawAlertStore.getState().removeAlert(id),
  pauseAlert: (id: string) => rawAlertStore.getState().pauseAlert(id),
  resumeAlert: (id: string) => rawAlertStore.getState().resumeAlert(id),
  showSuccess: (message: string, duration?: number) => rawAlertStore.getState().showSuccess(message, duration),
  showError: (message: string, duration?: number) => rawAlertStore.getState().showError(message, duration),
  showWarning: (message: string, duration?: number) => rawAlertStore.getState().showWarning(message, duration),
  showInfo: (message: string, duration?: number) => rawAlertStore.getState().showInfo(message, duration),
  showSkeleton: (duration?: number) => rawAlertStore.getState().showSkeleton(duration),
  clearAlerts: () => rawAlertStore.getState().clearAlerts(),
  subscribe(run: (state: AlertStoreState) => void) {
    run(rawAlertStore.getState());
    return rawAlertStore.subscribe((state) => run(state));
  },
};

if (typeof window !== 'undefined') {
  (window as any).alertStore = alertStore;
}

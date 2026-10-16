export type AppStatus = 'online' | 'maintenance' | 'beta';

export interface AppItem {
  id: string;
  name: string;
  description: string;
  url: string;
  icon: string;
  category: string;
  color: string;
  picName: string;
  picWhatsapp: string;
  imageUrl?: string | null;
  heroImageUrl?: string | null;
  orderIndex?: number;
  status?: AppStatus;
  isPinned?: boolean;
}

export const svelteApps: AppItem[] = [];

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
}

export const svelteApps: AppItem[] = [];

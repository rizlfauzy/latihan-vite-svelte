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
}

export const svelteApps: AppItem[] = [
  {
    id: "portfolio",
    name: "Personal Portfolio",
    description: "Portofolio interaktif dan showcase karya berbasis Svelte.",
    url: "https://github.com/rizlfauzy",
    icon: "💼",
    category: "Portfolio",
    color: "var(--color-nb-yellow)",
    picName: "Rizal Fauzi",
    picWhatsapp: "6281234567890"
  },
  {
    id: "todo-svelte",
    name: "Todo & Task Master",
    description: "Aplikasi manajemen tugas harian dengan reaktivitas Svelte 5.",
    url: "https://svelte.dev",
    icon: "✅",
    category: "Productivity",
    color: "var(--color-nb-green)",
    picName: "Rizal (Core Dev)",
    picWhatsapp: "6281234567890"
  },
  {
    id: "weather-app",
    name: "Weather Radar",
    description: "Dashboard prakiraan cuaca real-time dengan visualisasi grafis.",
    url: "https://vite.dev",
    icon: "🌤️",
    category: "Utility",
    color: "var(--color-nb-blue)",
    picName: "Rizal (Maintainer)",
    picWhatsapp: "6281234567890"
  },
  {
    id: "markdown-editor",
    name: "Neo Note Editor",
    description: "Markdown editor minimalis dengan live preview instan.",
    url: "https://github.com",
    icon: "📝",
    category: "Writing",
    color: "var(--color-nb-pink)",
    picName: "Rizal Fauzi",
    picWhatsapp: "6281234567890"
  },
  {
    id: "finance-tracker",
    name: "Pocket Budget",
    description: "Pencatat keuangan harian dengan kalkulasi otomatis.",
    url: "https://svelte.dev/docs/svelte/overview",
    icon: "💰",
    category: "Finance",
    color: "var(--color-nb-purple)",
    picName: "Rizal (Finance Lead)",
    picWhatsapp: "6281234567890"
  },
  {
    id: "code-snippets",
    name: "Snippet Vault",
    description: "Koleksi snippet kode favorit siap copy-paste.",
    url: "https://vitejs.dev",
    icon: "⚡",
    category: "DevTools",
    color: "var(--color-nb-orange)",
    picName: "Rizal Fauzi",
    picWhatsapp: "6281234567890"
  }
];

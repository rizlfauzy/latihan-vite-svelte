import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, type Plugin } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

function appsApiPlugin(): Plugin {
  const filePath = path.resolve(import.meta.dirname, 'src/data/apps.ts');

  function readApps() {
    if (!fs.existsSync(filePath)) return [];
    const content = fs.readFileSync(filePath, 'utf-8');
    const start = content.indexOf('[');
    const end = content.lastIndexOf(']');
    if (start === -1 || end === -1) return [];
    try {
      return new Function('return ' + content.slice(start, end + 1))();
    } catch {
      return [];
    }
  }

  function writeApps(apps: any[]) {
    const fileContent = `export interface AppItem {
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

export const svelteApps: AppItem[] = ${JSON.stringify(apps, null, 2)};
`;
    fs.writeFileSync(filePath, fileContent, 'utf-8');
  }

  const defaultAppsContent = `export interface AppItem {
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
`;

  function handleApi(req: any, res: any) {
    const url = new URL(req.url || '', 'http://localhost:8888');
    const pathname = url.pathname;

    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET' && pathname === '/api/apps') {
      const apps = readApps();
      res.statusCode = 200;
      res.end(JSON.stringify(apps));
      return;
    }

    if (req.method === 'POST' && pathname === '/api/apps') {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const newApp = JSON.parse(body);
          const apps = readApps();
          const updated = [newApp, ...apps.filter((a: any) => a.id !== newApp.id)];
          writeApps(updated);
          res.statusCode = 201;
          res.end(JSON.stringify({ success: true, app: newApp }));
        } catch (err: any) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    if (req.method === 'POST' && pathname === '/api/apps/reset') {
      fs.writeFileSync(filePath, defaultAppsContent, 'utf-8');
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
      return;
    }

    if (req.method === 'PUT' && pathname.startsWith('/api/apps')) {
      let body = '';
      req.on('data', (chunk: any) => {
        body += chunk;
      });
      req.on('end', () => {
        try {
          const updatedApp = JSON.parse(body);
          const apps = readApps();
          const index = apps.findIndex((a: any) => a.id === updatedApp.id);
          if (index === -1) {
            res.statusCode = 404;
            res.end(JSON.stringify({ error: 'App not found' }));
            return;
          }
          apps[index] = { ...apps[index], ...updatedApp };
          writeApps(apps);
          res.statusCode = 200;
          res.end(JSON.stringify({ success: true, app: apps[index] }));
        } catch (err: any) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
      return;
    }

    if (req.method === 'DELETE' && pathname.startsWith('/api/apps')) {
      const parts = pathname.split('/');
      const id = parts[parts.length - 1];
      if (id && id !== 'apps') {
        const apps = readApps();
        const updated = apps.filter((a: any) => a.id !== id);
        writeApps(updated);
        res.statusCode = 200;
        res.end(JSON.stringify({ success: true, id }));
        return;
      }
      res.statusCode = 400;
      res.end(JSON.stringify({ error: 'App ID required' }));
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  }

  return {
    name: 'dev-apps-api',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/apps')) {
          handleApi(req, res);
        } else {
          next();
        }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith('/api/apps')) {
          handleApi(req, res);
        } else {
          next();
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte(), tailwindcss(), appsApiPlugin()],
  server: {
    port: 8888,
    strictPort: true,
  },
});

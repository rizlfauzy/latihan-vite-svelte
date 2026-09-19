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

  const initialContent = fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf-8') : '';

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
      if (initialContent) {
        fs.writeFileSync(filePath, initialContent, 'utf-8');
      }
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true }));
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

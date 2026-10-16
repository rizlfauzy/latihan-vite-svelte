import { svelte } from '@sveltejs/vite-plugin-svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';
import path from 'node:path';

// https://vite.dev/config/
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  plugins: [svelte(), tailwindcss()],
  server: {
    port: 8888,
    strictPort: true,
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('@supabase') || id.includes('@supabase/supabase-js')) {
            return 'vendor-supabase';
          }
          if (id.includes('@lucide') || id.includes('lucide-svelte')) {
            return 'vendor-lucide';
          }
          if (id.includes('node_modules/svelte/') || id.includes('node_modules/svelte-') || id.includes('node_modules/zustand')) {
            return 'vendor-framework';
          }
        },
      },
    },
  },
});

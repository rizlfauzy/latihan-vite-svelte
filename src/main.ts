import { mount } from 'svelte'
import './app.css'
import App from './App.svelte'

// Register Progressive Web App (PWA) Service Worker
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('PWA ServiceWorker registration failed:', err);
    });
  });
}

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app

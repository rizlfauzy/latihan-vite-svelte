 /// <reference types="svelte" />
/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_TITLE?: string;
  readonly VITE_APP_LOGO_URL?: string;
  readonly VITE_APP_FAVICON_URL?: string;
  readonly VITE_APP_ENV?: string;
  readonly VITE_ENABLE_DEBUG?: string;
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

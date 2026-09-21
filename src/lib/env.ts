export interface AppEnv {
  mode: string;
  appEnv: 'development' | 'production' | string;
  isDev: boolean;
  isProd: boolean;
  enableDebug: boolean;
  apiBaseUrl: string;
  appTitle: string;
  logoUrl: string;
  faviconUrl: string;
  supabaseUrl: string;
  supabaseAnonKey: string;
  isSupabaseConfigured: boolean;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const env: AppEnv = {
  mode: import.meta.env.MODE,
  appEnv: import.meta.env.VITE_APP_ENV || (import.meta.env.DEV ? 'development' : 'production'),
  isDev: import.meta.env.DEV || import.meta.env.VITE_APP_ENV === 'development',
  isProd: import.meta.env.PROD || import.meta.env.VITE_APP_ENV === 'production',
  enableDebug: import.meta.env.VITE_ENABLE_DEBUG === 'true',
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || '',
  appTitle: import.meta.env.VITE_APP_TITLE || '⚡ Svelte Hub',
  logoUrl: import.meta.env.VITE_APP_LOGO_URL || '/logo.svg',
  faviconUrl: import.meta.env.VITE_APP_FAVICON_URL || '/favicon.svg',
  supabaseUrl,
  supabaseAnonKey,
  isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey),
};

if (env.enableDebug && typeof window !== 'undefined') {
  console.log('[Svelte Hub] Env initialized:', {
    appEnv: env.appEnv,
    mode: env.mode,
    debug: env.enableDebug,
    supabase: env.isSupabaseConfigured ? 'Enabled' : 'Disabled (Local Mode)',
  });
}

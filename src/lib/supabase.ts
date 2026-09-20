import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/lib/env';

export const isSupabaseEnabled = env.isSupabaseConfigured;

export const supabase: SupabaseClient | null = isSupabaseEnabled
  ? createClient(env.supabaseUrl, env.supabaseAnonKey)
  : null;

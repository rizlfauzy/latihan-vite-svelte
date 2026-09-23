-- ==========================================================
-- Migration: 20260923000002_seed_defaults.sql
-- Seed default roles and default users
-- ==========================================================

-- Pastikan pgcrypto aktif di schema extensions
create extension if not exists "pgcrypto" with schema extensions;

-- Pastikan search_path mencakup public dan extensions
set search_path to public, extensions;

-- 1. SEED DEFAULT ROLE (SUPERADMIN dengan is_debug: true)
insert into public.roles (id, name, is_debug, created_at, updated_at, created_by, updated_by)
values (
  1,
  'SUPERADMIN',
  true,
  timezone('utc'::text, now()),
  timezone('utc'::text, now()),
  'system',
  'system'
)
on conflict (id) do update
set
  name = excluded.name,
  is_debug = excluded.is_debug,
  updated_at = timezone('utc'::text, now()),
  updated_by = 'system';

-- Pastikan sequence roles id tersinkronisasi jika menggunakan identity
select setval(pg_get_serial_sequence('public.roles', 'id'), coalesce(max(id), 1)) from public.roles;

-- 2. SEED DEFAULT USER (rizlfauzy / Rizal Fauzi, password default: admin123, role: SUPERADMIN)
insert into public.users (
  uuid,
  username,
  name,
  password,
  role_id,
  created_at,
  created_by,
  updated_at,
  updated_by
)
values (
  'a0000000-0000-0000-0000-000000000001',
  'rizlfauzy',
  'Rizal Fauzi',
  extensions.crypt('admin123', extensions.gen_salt('bf', 10)),
  1,
  timezone('utc'::text, now()),
  'system',
  timezone('utc'::text, now()),
  'system'
)
on conflict (username) do update
set
  name = excluded.name,
  password = excluded.password,
  role_id = excluded.role_id,
  updated_at = timezone('utc'::text, now()),
  updated_by = 'system';

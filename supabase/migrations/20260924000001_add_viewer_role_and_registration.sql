-- ==========================================================
-- Migration: 20260924000001_add_viewer_role_and_registration.sql
-- Seed VIEWER role and create register_user RPC function
-- ==========================================================

-- Pastikan pgcrypto aktif di schema extensions
create extension if not exists "pgcrypto" with schema extensions;
set search_path to public, extensions;

-- 1. SEED ROLE: VIEWER (Role default untuk user terdaftar dengan is_debug = false)
insert into public.roles (name, is_debug, created_at, updated_at, created_by, updated_by)
values (
  'VIEWER',
  false,
  timezone('utc'::text, now()),
  timezone('utc'::text, now()),
  'system',
  'system'
)
on conflict (name) do update
set
  is_debug = false,
  updated_at = timezone('utc'::text, now()),
  updated_by = 'system';

-- Pastikan sequence roles id tersinkronisasi jika menggunakan identity
select setval(pg_get_serial_sequence('public.roles', 'id'), coalesce(max(id), 1)) from public.roles;

-- 2. RPC: Register User (Daftar Pengguna Baru dengan Hak Akses VIEWER & is_debug false)
create or replace function public.register_user(
  p_username text,
  p_name text,
  p_password text
)
returns table (
  uuid uuid,
  username text,
  name text,
  role_id bigint,
  role_name text,
  is_debug boolean
)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_role_id bigint;
  v_role_name text;
  v_is_debug boolean;
  v_new_uuid uuid;
  v_clean_username text;
  v_clean_name text;
begin
  v_clean_username := lower(trim(p_username));
  v_clean_name := trim(p_name);

  -- Validasi input
  if coalesce(v_clean_username, '') = '' then
    raise exception 'Username wajib diisi!';
  end if;
  if coalesce(v_clean_name, '') = '' then
    raise exception 'Nama lengkap wajib diisi!';
  end if;
  if coalesce(p_password, '') = '' or length(p_password) < 6 then
    raise exception 'Password minimal 6 karakter!';
  end if;

  -- Cek apakah username sudah terdaftar
  if exists (select 1 from public.users where lower(users.username) = v_clean_username) then
    raise exception 'Username sudah digunakan!';
  end if;

  -- Ambil role VIEWER
  select id, name, is_debug into v_role_id, v_role_name, v_is_debug
  from public.roles
  where upper(roles.name) = 'VIEWER'
  limit 1;

  if v_role_id is null then
    insert into public.roles (name, is_debug, created_by, updated_by)
    values ('VIEWER', false, 'system', 'system')
    returning id, name, is_debug into v_role_id, v_role_name, v_is_debug;
  end if;

  -- Insert user baru dengan password yang dienkripsi menggunakan bcrypt
  insert into public.users (
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
    v_clean_username,
    v_clean_name,
    crypt(p_password, gen_salt('bf', 10)),
    v_role_id,
    timezone('utc'::text, now()),
    'register',
    timezone('utc'::text, now()),
    'register'
  )
  returning users.uuid into v_new_uuid;

  return query
  select
    v_new_uuid,
    v_clean_username,
    v_clean_name,
    v_role_id,
    v_role_name,
    coalesce(v_is_debug, false);
end;
$$;

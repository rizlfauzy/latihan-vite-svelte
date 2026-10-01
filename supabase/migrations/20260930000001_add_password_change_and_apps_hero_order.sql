-- ==========================================================
-- Migration: 20260930000001_add_password_change_and_apps_hero_order.sql
-- 1. Create change_user_password RPC
-- 2. Add hero_image_url and order_index to apps table
-- ==========================================================

-- Pastikan pgcrypto aktif di schema extensions
create extension if not exists "pgcrypto" with schema extensions;
set search_path to public, extensions;

-- 1. RPC: Ganti Password Pengguna
create or replace function public.change_user_password(
  p_username text,
  p_old_password text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_user_uuid uuid;
  v_clean_username text;
begin
  v_clean_username := lower(trim(p_username));

  if coalesce(v_clean_username, '') = '' then
    raise exception 'Username wajib diisi!';
  end if;

  if coalesce(p_old_password, '') = '' then
    raise exception 'Password lama wajib diisi!';
  end if;

  if coalesce(p_new_password, '') = '' or length(p_new_password) < 6 then
    raise exception 'Password baru minimal 6 karakter!';
  end if;

  -- Verifikasi keberadaan user dan kecocokan password lama
  select uuid into v_user_uuid
  from public.users
  where lower(users.username) = v_clean_username
    and users.password = crypt(p_old_password, users.password)
  limit 1;

  if v_user_uuid is null then
    raise exception 'Password lama tidak sesuai!';
  end if;

  -- Update ke password baru yang di-hash dengan bcrypt
  update public.users
  set
    password = crypt(p_new_password, gen_salt('bf', 10)),
    updated_at = timezone('utc'::text, now()),
    updated_by = v_clean_username
  where uuid = v_user_uuid;

  return true;
end;
$$;

-- 2. Tambah kolom hero_image_url pada tabel apps (opsional, banner/cover)
alter table public.apps add column if not exists hero_image_url text;

-- 3. Tambah kolom order_index pada tabel apps (untuk rearrange drag-and-drop)
alter table public.apps add column if not exists order_index integer not null default 0;

-- Inisialisasi order_index berdasarkan created_at untuk data yang sudah ada
with ordered_apps as (
  select id, row_number() over (order by created_at asc) - 1 as seq
  from public.apps
)
update public.apps a
set order_index = oa.seq
from ordered_apps oa
where a.id = oa.id;

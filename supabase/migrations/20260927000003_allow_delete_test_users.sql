-- ==========================================================
-- Migration: 20260927000003_allow_delete_test_users.sql
-- Izinkan penghapusan user pengetesan (yang mengandung kata 'test')
-- untuk pembersihan otomatis (test.afterAll / E2E test cleanup).
-- ==========================================================

-- 1. Policy RLS untuk menghapus test user dari public.users
drop policy if exists "Allow delete test users" on public.users;
create policy "Allow delete test users"
  on public.users for delete
  to anon, authenticated
  using (lower(username) like '%test%');

-- 2. Policy RLS untuk membaca username test user agar bisa difilter
drop policy if exists "Allow select test users" on public.users;
create policy "Allow select test users"
  on public.users for select
  to anon, authenticated
  using (lower(username) like '%test%');

-- 3. RPC Function aman untuk menghapus single test user (security definer)
create or replace function public.delete_test_user(p_username text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_clean_username text;
begin
  v_clean_username := lower(trim(p_username));
  -- Validasi keamanan: hanya username yang mengandung kata 'test' yang boleh dihapus
  if v_clean_username not like '%test%' then
    raise exception 'Hanya test user (mengandung kata test) yang diizinkan untuk dihapus!';
  end if;

  delete from public.users where lower(users.username) = v_clean_username;
  return true;
end;
$$;

-- 4. RPC Function aman untuk membersihkan semua test user sekaligus (security definer)
create or replace function public.cleanup_test_users()
returns integer
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_deleted integer;
begin
  delete from public.users where lower(users.username) like '%test%';
  get diagnostics v_deleted = row_count;
  return v_deleted;
end;
$$;

-- ==========================================================
-- Migration: 20261016000001_add_advanced_features.sql
-- 1. Add status and is_pinned to apps table
-- 2. Add priority and due_date to todos table
-- 3. Enable supabase_realtime publication for apps, todos, subtodos
-- 4. Create get_users_list and update_user_role RPC functions
-- ==========================================================

-- 1. Kolom status dan is_pinned pada tabel apps
alter table public.apps add column if not exists status text not null default 'online';
alter table public.apps add column if not exists is_pinned boolean not null default false;
create index if not exists idx_apps_is_pinned on public.apps(is_pinned);

-- 2. Kolom priority dan due_date pada tabel todos
alter table public.todos add column if not exists priority text not null default 'normal';
alter table public.todos add column if not exists due_date text;
create index if not exists idx_todos_priority on public.todos(priority);

-- 3. Aktifkan Supabase Realtime publication
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    begin
      alter publication supabase_realtime add table public.apps;
    exception when duplicate_object then
      null;
    end;
    begin
      alter publication supabase_realtime add table public.todos;
    exception when duplicate_object then
      null;
    end;
    begin
      alter publication supabase_realtime add table public.subtodos;
    exception when duplicate_object then
      null;
    end;
  end if;
end $$;

-- 4. RPC: Ambil daftar seluruh user untuk manajemen superadmin
create or replace function public.get_users_list()
returns table (
  uuid uuid,
  username text,
  name text,
  role_id bigint,
  role_name text,
  is_debug boolean,
  created_at timestamp with time zone
)
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  return query
  select
    u.uuid,
    u.username,
    u.name,
    u.role_id,
    coalesce(r.name, 'VIEWER') as role_name,
    coalesce(r.is_debug, false) as is_debug,
    u.created_at
  from public.users u
  left join public.roles r on u.role_id = r.id
  order by u.created_at desc;
end;
$$;

-- 5. RPC: Perbarui role user oleh superadmin
create or replace function public.update_user_role(
  p_target_uuid uuid,
  p_role_id bigint
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
begin
  update public.users
  set role_id = p_role_id,
      updated_at = timezone('utc'::text, now())
  where users.uuid = p_target_uuid;
  return true;
end;
$$;

grant execute on function public.get_users_list() to anon, authenticated;
grant execute on function public.update_user_role(uuid, bigint) to anon, authenticated;

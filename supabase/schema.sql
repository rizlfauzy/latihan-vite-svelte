-- ==========================================================
-- Svelte Hub - Supabase Database Schema & RLS Policies
-- ==========================================================
-- Jalankan skrip ini di SQL Editor dashboard Supabase Anda.

-- 1. TABEL: apps (List Aplikasi Hub)
create table if not exists public.apps (
  id text primary key,
  name text not null,
  description text not null,
  url text not null,
  icon text not null default '⚡',
  category text not null default 'General',
  color text not null default 'var(--color-nb-yellow)',
  pic_name text not null,
  pic_whatsapp text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. TABEL: todos (To-Do List & Sub-Tasks with App Topic Reference)
create table if not exists public.todos (
  id text primary key,
  "appId" text references public.apps(id) on delete cascade,
  text text not null,
  done boolean not null default false,
  created_at bigint not null,
  sub_tasks jsonb default '[]'::jsonb not null
);

-- Migration script for existing databases:
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'todos' and column_name = 'app_id'
  ) then
    alter table public.todos rename column app_id to "appId";
  else
    alter table public.todos add column if not exists "appId" text references public.apps(id) on delete cascade;
  end if;
end $$;


-- 3. ROW LEVEL SECURITY (RLS)
alter table public.apps enable row level security;
alter table public.todos enable row level security;

-- Kebijakan Akses Publik (Anon Role) untuk Frontend SPA
-- Izinkan SELECT, INSERT, UPDATE, DELETE untuk publik/anon
drop policy if exists "Allow public read access to apps" on public.apps;
create policy "Allow public read access to apps"
  on public.apps for select
  to anon
  using (true);

drop policy if exists "Allow public write access to apps" on public.apps;
create policy "Allow public write access to apps"
  on public.apps for all
  to anon
  using (true)
  with check (true);

drop policy if exists "Allow public access to todos" on public.todos;
create policy "Allow public access to todos"
  on public.todos for all
  to anon
  using (true)
  with check (true);

-- 4. SEED DATA AWAL (Opsional - Data aplikasi awal)
insert into public.apps (id, name, description, url, icon, category, color, pic_name, pic_whatsapp)
values
  ('portfolio-v1', 'Personal Portfolio', 'Website portofolio pribadi modern berbasis Svelte dengan showcase project.', 'https://rizalfauzi.my.id', '🌐', 'Portfolio', 'var(--color-nb-yellow)', 'Rizal Fauzi', '6281234567890'),
  ('todo-app', 'Todo & Task Master', 'Aplikasi manajemen tugas harian dengan checklist interaktif dan filter status.', 'https://todo.rizalfauzi.my.id', '📝', 'Productivity', 'var(--color-nb-green)', 'Admin PIC', '6281234567891'),
  ('notes-vault', 'Notes Vault', 'Catatan markdown offline-first dengan enkripsi lokal dan pencarian cepat.', 'https://notes.rizalfauzi.my.id', '🔒', 'Utility', 'var(--color-nb-blue)', 'Admin PIC', '6281234567892'),
  ('expense-tracker', 'Budget & Expense Tracker', 'Pencatat pengeluaran dan pemasukan harian dengan grafik visual ringkas.', 'https://finance.rizalfauzi.my.id', '💰', 'Finance', 'var(--color-nb-pink)', 'Admin PIC', '6281234567893'),
  ('tech-blog', 'Dev Journey Blog', 'Artikel tutorial seputar frontend development, Svelte, TypeScript, dan DevOps.', 'https://blog.rizalfauzi.my.id', '✍️', 'Writing', 'var(--color-nb-purple)', 'Rizal Fauzi', '6281234567890'),
  ('weather-radar', 'Weather Radar ID', 'Prakiraan cuaca real-time wilayah Indonesia dengan data BMKG.', 'https://weather.rizalfauzi.my.id', '⛅', 'Utility', 'var(--color-nb-orange)', 'Admin PIC', '6281234567894')
on conflict (id) do nothing;

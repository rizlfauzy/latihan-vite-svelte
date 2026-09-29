-- ==========================================================
-- Migration: 20260929000002_create_section_settings_table.sql
-- Create section_settings table and seed default sections
-- ==========================================================

create table if not exists public.section_settings (
  id text primary key default gen_random_uuid()::text,
  page text not null,
  section_key text not null,
  title text not null,
  order_index integer not null default 0,
  visible boolean not null default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  updated_by text,
  constraint uq_section_settings_page_section unique (page, section_key)
);

-- Enable RLS
alter table public.section_settings enable row level security;

-- Policies: section_settings (Public Read & Manageable)
drop policy if exists "Allow public read access to section_settings" on public.section_settings;
create policy "Allow public read access to section_settings"
  on public.section_settings for select
  to anon, authenticated
  using (true);

drop policy if exists "Allow public write access to section_settings" on public.section_settings;
create policy "Allow public write access to section_settings"
  on public.section_settings for all
  to anon, authenticated
  using (true)
  with check (true);

-- Seed default sections for Home and Company Profile
insert into public.section_settings (page, section_key, title, order_index, visible)
values
  ('home', 'hero', 'Hero Banner', 0, true),
  ('home', 'apps-hub', 'Apps Hub', 1, true),
  ('home', 'todo-list', 'To-Do List', 2, true),
  ('company-profile', 'profile', 'Header & Hero Profile', 0, true),
  ('company-profile', 'highlights', 'Company Highlights', 1, true),
  ('company-profile', 'vision-mission', 'Visi & Misi', 2, true),
  ('company-profile', 'services', 'Layanan & Servis', 3, true),
  ('company-profile', 'contact', 'PIC & Leadership', 4, true)
on conflict (page, section_key) do nothing;

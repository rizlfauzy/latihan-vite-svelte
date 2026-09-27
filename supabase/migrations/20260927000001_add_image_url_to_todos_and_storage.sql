-- ==========================================================
-- Migration: 20260927000001_add_image_url_to_todos_and_storage.sql
-- Add image_url column to todos table and configure todo-images storage bucket
-- ==========================================================

-- 1. Tambah kolom image_url pada tabel todos jika belum ada
alter table public.todos add column if not exists image_url text;

-- 2. Konfigurasi Bucket Storage untuk todo-images
insert into storage.buckets (id, name, public)
values ('todo-images', 'todo-images', true)
on conflict (id) do update set public = true;

-- 3. Storage Policies (RLS) untuk bucket todo-images
-- Izinkan SELECT / akses baca publik
create policy "Public Access to todo-images"
on storage.objects for select
using (bucket_id = 'todo-images');

-- Izinkan INSERT (Upload) ke todo-images
create policy "Allow uploads to todo-images"
on storage.objects for insert
with check (bucket_id = 'todo-images');

-- Izinkan UPDATE di todo-images
create policy "Allow updates to todo-images"
on storage.objects for update
using (bucket_id = 'todo-images');

-- Izinkan DELETE di todo-images
create policy "Allow deletes from todo-images"
on storage.objects for delete
using (bucket_id = 'todo-images');

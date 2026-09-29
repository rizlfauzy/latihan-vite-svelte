-- ==========================================================
-- Migration: 20260929000001_add_image_url_to_apps_and_storage.sql
-- Add image_url column to apps table and configure app-images storage bucket
-- ==========================================================

-- 1. Tambah kolom image_url pada tabel apps jika belum ada
alter table public.apps add column if not exists image_url text;

-- 2. Konfigurasi Bucket Storage untuk app-images
insert into storage.buckets (id, name, public)
values ('app-images', 'app-images', true)
on conflict (id) do update set public = true;

-- 3. Storage Policies (RLS) untuk bucket app-images
-- Izinkan SELECT / akses baca publik
drop policy if exists "Public Access to app-images" on storage.objects;
create policy "Public Access to app-images"
on storage.objects for select
using (bucket_id = 'app-images');

-- Izinkan INSERT (Upload) ke app-images
drop policy if exists "Allow uploads to app-images" on storage.objects;
create policy "Allow uploads to app-images"
on storage.objects for insert
with check (bucket_id = 'app-images');

-- Izinkan UPDATE di app-images
drop policy if exists "Allow updates to app-images" on storage.objects;
create policy "Allow updates to app-images"
on storage.objects for update
using (bucket_id = 'app-images');

-- Izinkan DELETE di app-images
drop policy if exists "Allow deletes from app-images" on storage.objects;
create policy "Allow deletes from app-images"
on storage.objects for delete
using (bucket_id = 'app-images');

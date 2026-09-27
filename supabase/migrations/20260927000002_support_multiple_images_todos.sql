-- ==========================================================
-- Migration: 20260927000002_support_multiple_images_todos.sql
-- Mendukung multiple images upload untuk To-Do item.
-- Kolom image_url dapat menampung single public URL string
-- ataupun JSON-encoded array string berisi kumpulan URL gambar.
-- ==========================================================

-- Pastikan kolom image_url bertipe text ada di tabel todos
alter table public.todos add column if not exists image_url text;

-- Keterangan dokumentasi kolom
comment on column public.todos.image_url is 'Menyimpan URL tunggal atau JSON string array kumpulan URL gambar lampiran';

-- ==========================================================
-- Migration: 20261001000001_add_todo_subtodo_order.sql
-- 1. Add order_index column to todos table
-- 2. Add order_index column to subtodos table
-- 3. Initialize order_index from created_at
-- ==========================================================

-- 1. Tambah kolom order_index pada tabel todos
alter table public.todos add column if not exists order_index integer not null default 0;

-- 2. Tambah kolom order_index pada tabel subtodos
alter table public.subtodos add column if not exists order_index integer not null default 0;

-- 3. Inisialisasi order_index pada todos berdasarkan created_at
with ordered_todos as (
  select id, row_number() over (order by created_at desc) - 1 as seq
  from public.todos
)
update public.todos t
set order_index = ot.seq
from ordered_todos ot
where t.id = ot.id;

-- 4. Inisialisasi order_index pada subtodos berdasarkan todo_id dan created_at
with ordered_subtodos as (
  select id, row_number() over (partition by todo_id order by created_at asc) - 1 as seq
  from public.subtodos
)
update public.subtodos s
set order_index = os.seq
from ordered_subtodos os
where s.id = os.id;

-- 5. Indexing untuk optimasi query sorting
create index if not exists idx_todos_order_index on public.todos(order_index);
create index if not exists idx_subtodos_order_index on public.subtodos(order_index);

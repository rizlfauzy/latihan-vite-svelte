# Issues — Svelte Hub App

Daftar issue high-level untuk implementasi Svelte Hub App.
Setiap issue bisa di-assign sebagai task mandiri oleh programmer/model.

---

## Issue #1: Setup GitHub Repository

**Label:** `setup`, `infra`

Buat repository GitHub baru pakai `gh` CLI.

**Tasks:**
- Jalankan `gh repo create latihan-vite-svelte --public --source=. --push`
- Pastikan `.gitignore` sudah mencakup `node_modules`, `dist`, dll
- Update `README.md` dengan instruksi dasar: cara install, dev, build, dan docker

---

## Issue #2: Neo Brutalism Design System

**Label:** `design`, `css`

Overhaul seluruh styling ke Neo Brutalism aesthetic.

**Tasks:**
- Buat CSS variables / design tokens untuk Neo Brutalism (warna cerah, border tebal, hard shadow)
- Ganti `app.css` dengan style Neo Brutalism:
  - Border: `2-4px solid black` pada semua card/container
  - Shadow: `box-shadow: 4px 4px 0px #000` (hard offset, no blur)
  - Warna: palette cerah — kuning `#FFD700`, pink `#FF6B9D`, biru `#00D4FF`, hijau mint `#7CFC00`
  - Background: warna pastel atau putih bersih
  - Font: bold sans-serif, accent pakai monospace
- Pastikan button, input, card semua konsisten dengan style ini

---

## Issue #3: Hero Section — Logo & App Title

**Label:** `feature`, `ui`

Buat hero section di tengah halaman dengan logo aplikasi.

**Tasks:**
- Buat/ganti logo app (bisa SVG sederhana atau gambar custom)
- Set sebagai favicon di `index.html` (`<link rel="icon" ...>`)
- Tampilkan logo di hero section, centered, dengan judul app di bawahnya
- Styling hero section sesuai Neo Brutalism (border tebal, shadow, background cerah)

---

## Issue #4: App Hub — Grid Link ke Aplikasi Lain

**Label:** `feature`, `core`

Buat grid/card layout yang menampilkan daftar link ke semua aplikasi Svelte.

**Tasks:**
- Buat file config `src/data/apps.json` (atau TS file) yang isinya list apps:
  ```json
  [
    { "name": "App Name", "url": "https://...", "description": "Short desc", "icon": "🚀" }
  ]
  ```
- Buat component `AppGrid.svelte` yang render grid of cards dari data di atas
- Setiap card tampilkan: icon/emoji, nama app, deskripsi singkat
- Card bisa diklik → buka URL app di tab baru
- Styling card: Neo Brutalism (thick border, hard shadow, hover effect)

---

## Issue #5: To-Do List / Quick Notes

**Label:** `feature`, `core`

Tambahkan fitur to-do list sederhana di halaman.

**Tasks:**
- Buat component `TodoList.svelte` dengan fitur:
  - Input field + button untuk tambah item baru
  - List item yang bisa di-toggle (done/undone) via checkbox
  - Button hapus per item
  - Counter berapa item yang belum selesai
- Data persist di `localStorage` — load saat mount, save saat ada perubahan
- Styling konsisten Neo Brutalism (input tebal bordernya, checkbox custom, button bold)

---

## Issue #6: Docker Setup

**Label:** `infra`, `docker`

Containerize aplikasi agar bisa jalan di Docker.

**Tasks:**
- Buat `Dockerfile` multi-stage:
  - Stage 1: `node` image → `bun install` + `bun run build`
  - Stage 2: `nginx:alpine` → copy `dist/` ke nginx html folder
- Buat `docker-compose.yml`:
  ```yaml
  services:
    app:
      build: .
      ports:
        - "8080:80"
  ```
- Buat `nginx.conf` sederhana (SPA fallback ke `index.html`)
- Tambahkan `.dockerignore` (`node_modules`, `.git`, dll)
- Test: `docker compose up --build` → buka `localhost:8080`

---

## Issue #7: Update README.md

**Label:** `docs`

Update README agar jelas dan informatif.

**Tasks:**
- Section: Deskripsi singkat project
- Section: Tech stack
- Section: Getting started (dev mode)
  - `bun install` → `bun run dev`
- Section: Build for production
  - `bun run build`
- Section: Run via Docker
  - `docker compose up --build`
- Section: Screenshot / preview (bisa ditambahkan nanti)

---

## Urutan Implementasi (Recommended)

```
#1 Setup GitHub Repo
  ↓
#2 Neo Brutalism Design System
  ↓
#3 Hero Section (Logo + Favicon)
  ↓
#4 App Hub Grid
  ↓
#5 To-Do List
  ↓
#6 Docker Setup
  ↓
#7 Update README
```

> **Note:** Issue #2 (Design System) sebaiknya dikerjakan duluan karena semua component setelahnya akan pakai style ini.

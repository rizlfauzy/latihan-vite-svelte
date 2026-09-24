# ⚡ Apps Hub — CV Sukses Gemilang

> **Portal Aplikasi & Dashboard Operasional Terpadu** untuk **CV Sukses Gemilang** (Pusat Hiburan Keluarga & Game Center Arcade). Dilengkapi manajemen aplikasi terhubung ke database cloud Supabase, sistem autentikasi & Role-Based Access Control (RBAC), halaman registrasi mandiri (`/register` dengan role otomatis `VIEWER` & `is_debug: false`), fitur *WhatsApp PIC Preview Modal* dengan integrasi to-do list pending, tabel relasional mandiri untuk subtask (*subtodos*), fitur aksi massal (*Select All & Bulk Delete* bagi user dengan hak akses debug), relasi tugas To-Do dengan modul aplikasi (*app association & cascading deletion*), fitur *Check All* pada To-Do list, komponen dropdown interaktif kustom (*CustomSelect*), sistem navigasi SPA, sticky navbar, catatan tugas bertingkat (*sub-tasks*), sistem notifikasi toast, Progressive Web App (PWA) dengan Service Worker caching, dukungan Dark Mode, lokalisasi dwibahasa (ID & EN), rangkaian pengujian otomatis E2E Playwright (39 skenario), serta pipeline CI/CD terotomatisasi dengan migrasi database.

![Svelte 5](https://img.shields.io/badge/Svelte-5.x_Runes-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![RBAC](https://img.shields.io/badge/Auth-RBAC_Ready-blueviolet?style=for-the-badge)
![GitLab CI](https://img.shields.io/badge/CI%2FCD-GitLab_Pipeline-FC6D26?style=for-the-badge&logo=gitlab&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-39_E2E_Tests-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![i18n](https://img.shields.io/badge/i18n-EN_%26_ID-1d76db?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Design](https://img.shields.io/badge/Style-Neo_Brutalism-FFD000?style=for-the-badge)

---

## 🎨 Fitur Utama

- 🚀 **Enterprise App Hub Grid**: Menampilkan modul aplikasi operasional game center dalam tata letak kartu responsif dengan hard-shadow dan border tegas khas Neo Brutalism.
- 🔐 **Autentikasi & Registrasi Mandiri (RBAC)**:
  - **Akses Publik Bebas**: Pengunjung dan staf umum dapat mengakses portal tanpa kewajiban login.
  - **Halaman Login Khusus**: Tersedia di rute `/login` dengan toggle show/hide password untuk otentikasi akun.
  - **Halaman Registrasi Baru (`/register`)**: Tautan ke halaman registrasi hanya tersedia di halaman login. Form mencakup kolom `name`, `username`, dan `password` dengan fitur show/hide password.
  - **Penugasan Role Otomatis**: Setiap pengguna baru yang mendaftar otomatis diberikan peran `VIEWER` dengan flag `is_debug: false`.
  - **Proteksi Akses Mutasi**: Aksi Tambah, Edit, Hapus, dan Hapus Massal pada modul aplikasi hanya diizinkan untuk pengguna dengan role yang memiliki flag `is_debug: true`.
- 💬 **Enhanced WhatsApp PIC Preview Modal**: Setiap kartu aplikasi dilengkapi tombol WhatsApp yang memunculkan pop-up modal preview sebelum membuka WhatsApp. Pesan dapat diedit secara langsung dan otomatis merangkum catatan to-do list belum selesai (*not done*) untuk aplikasi yang bersangkutan.
- ⚡ **Supabase Cloud Database & Relasi Subtodos**:
  - Persistensi data aplikasi, pengguna, peran, dan to-do list ke PostgreSQL Supabase.
  - Subtask dikelola dalam tabel relasional mandiri (`subtodos`) dengan *foreign key* `todo_id` dan *cascading deletion*.
- 🔄 **Automated CI/CD Database Migration**: Skrip migrasi DDL di `supabase/migrations/` dieksekusi secara otomatis ke remote database pada pipeline deployment GitLab CI.
- 🔗 **To-Do App Association & Cascading Deletion**: Setiap item to-do dapat dikaitkan dengan aplikasi spesifik (`app_id`). Jika suatu aplikasi dihapus, seluruh tugas to-do dan subtask yang terafiliasi akan ikut terhapus secara otomatis.
- 🗑️ **Select All & Bulk Delete**: Memilih seluruh modul aplikasi atau aplikasi tertentu sekaligus via checkbox dan mengeksekusi penghapusan massal terhubung cloud dengan dialog konfirmasi khusus bagi pengguna berwenang.
- ☑️ **Check All pada To-Do List**: Tombol cepat untuk menandai semua tugas aktif menjadi selesai secara instan dan mempermudah pembersihan via tombol *Clear Completed*.
- 🎛️ **Custom Neo Brutalism Select (`CustomSelect`)**: Komponen dropdown interaktif yang dapat diakses penuh via keyboard tanpa bergantung pada elemen native `<select>`.
- 🌙 **Dark Mode & Theming**: Dukungan peralihan tema terang dan gelap dengan kontras tinggi yang tersimpan di `localStorage`.
- 📱 **Progressive Web App (PWA)**: Dilengkapi Service Worker caching (`sw.js`) dan App Manifest (`manifest.json`) agar dapat diinstal di perangkat desktop maupun mobile.
- 🏢 **Profil Perusahaan (CV Sukses Gemilang)**: Halaman company profile interaktif (`/company-profile`) yang memaparkan visi, layanan wahana game center (Arcade & VR, Redemption & Prize Center, Event & Tournament Hall), serta konsultasi WhatsApp.
- 🔔 **Global Toast Alert System**: Komponen notifikasi mengambang di sudut kanan atas dengan status *success*, *error*, dan *info*.
- 🌐 **Sistem Multibahasa Modular (i18n)**: Dukungan penuh Bahasa Indonesia (`id`) dan Bahasa Inggris (`en`) yang tersimpan rapi dalam file JSON modular ([`src/i18n/id.json`](src/i18n/id.json) & [`src/i18n/en.json`](src/i18n/en.json)).
- 🎭 **Automated E2E Testing**: Suite pengujian komprehensif Playwright dengan 39 skenario test end-to-end yang memvalidasi seluruh alur kerja sistem.

---

## 🛠️ Tech Stack

| Komponen | Teknologi | Deskripsi |
|---|---|---|
| **Framework** | Svelte 5 | Frontend framework reaktif dengan Runes (`$state`, `$derived`, `$effect`) |
| **Bundler & Runtime** | Vite 8 + Bun | Lightning-fast development server, bundler, dan runtime |
| **Database** | Supabase (PostgreSQL) | Cloud database relasional untuk `roles`, `users`, `apps`, `todos`, dan `subtodos` |
| **Autentikasi & RBAC** | Supabase RPC + Bcrypt | Verifikasi kredensial aman (`pgcrypto`) dan kontrol hak akses berbasis peran |
| **Database Migrations** | Supabase CLI | Pelacakan dan eksekusi migrasi DDL berkas di `supabase/migrations/` |
| **State Management** | Zustand (Vanilla) | Global reactive state untuk auth, apps, todos, alerts, i18n, dan theme |
| **Routing** | `sv-router` | Client-side Single Page Application (SPA) routing |
| **Styling** | Tailwind CSS v4 | Utility-first CSS dengan custom theme tokens Neo Brutalism |
| **Localization** | JSON-based i18n | Kamus kata modular dwibahasa di `src/i18n/*.json` |
| **Testing** | Playwright | E2E browser automation & UI regression test suite (36 tests) |
| **CI/CD** | GitLab CI | Pipeline otomasi: Test, Build, Supabase Migration, dan Deploy ke VPS |
| **PWA** | Service Worker | Offline caching dan instalasi web app |
| **Container** | Docker + Nginx | Multi-stage builder & production web server |

---

## ⚙️ Konfigurasi Environment Variables

Salin template file `.env.example`:

```bash
cp .env.example .env
```

### Variabel Aplikasi Lokal (`.env`)

| Variabel | Default | Deskripsi |
|---|---|---|
| `VITE_APP_TITLE` | `⚡ Apps Hub — CV Sukses Gemilang` | Judul aplikasi di browser tab & header |
| `VITE_APP_LOGO_URL` | `/logo.svg` | Path/URL logo utama |
| `VITE_APP_FAVICON_URL` | `/favicon.svg` | Path/URL favicon tab browser |
| `VITE_APP_ENV` | `development` / `production` | Penanda environment aplikasi |
| `VITE_ENABLE_DEBUG` | `true` / `false` | Fallback flag mode debug client-side |
| `VITE_API_BASE_URL` | `http://localhost:8888/api` | Base URL endpoint API |
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | URL instance Supabase |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-key` | Public anon key Supabase |

### Variabel CI/CD (GitLab Settings -> CI/CD -> Variables)

Untuk kebutuhan deployment otomatis, pastikan variabel berikut telah dikonfigurasi di GitLab repository:

- `SUPABASE_DB_URL`: Postgres connection string (gunakan host Session Pooler port 5432 untuk dukungan IPv4).
- `SSH_PRIVATE_KEY`: Private SSH key untuk akses ke server VPS.
- `VPS_IP`, `VPS_PORT`, `VPS_USER`, `APPLICATION_PATH`: Kredensial dan direktori target deployment di VPS.
- `ENV` & `ENV_TEST`: Isi file environment untuk production build dan stage testing.

---

## 🚀 Memulai (Getting Started)

### Prasyarat
- [Bun](https://bun.sh/) (atau Node.js v18+)
- [Docker](https://www.docker.com/) (opsional, untuk deployment container lokal)

### 1. Jalankan Mode Development

```bash
# Clone repository
git clone https://github.com/rizlfauzy/latihan-vite-svelte.git
cd latihan-vite-svelte

# Install dependensi
bun install

# Jalankan dev server
bun run dev
```

Aplikasi akan berjalan di `http://localhost:8888`.

---

### 2. Menjalankan Automated E2E Test (Playwright)

Suite pengujian E2E mencakup 36 skenario yang menguji alur autentikasi, otorisasi RBAC, manajemen aplikasi, subtodos, dan lokalisasi.

> 💡 **Aturan Penamaan Data Pengujian (Auto-Cleanup)**:
> Seluruh skenario pengujian yang membuat data dummy (baik aplikasi maupun item to-do) menggunakan konvensi penamaan yang mengandung kata `"test"`. Hal ini memudahkan mekanisme pembersihan otomatis pada blok `test.afterAll` untuk menghapus seluruh data sisa pengujian secara tuntas dari database.

```bash
# Jalankan seluruh 36 test cases secara headless
bun run test

# Jalankan test dengan mode visual UI
bun run test:ui
```

---

### 3. Migrasi Database Supabase (Manual / CLI)

Untuk menjalankan migrasi berkas baru secara manual menggunakan Supabase CLI:

```bash
# Push migrasi baru ke database remote
bunx supabase db push --db-url "$SUPABASE_DB_URL" --include-all

# Dry-run untuk memeriksa migrasi yang akan dieksekusi tanpa melakukan perubahan
bunx supabase db push --db-url "$SUPABASE_DB_URL" --dry-run
```

---

### 4. Build & Diagnostics

```bash
# Svelte check & TypeScript typecheck
bun run check

# Bundle static production build
bun run build

# Preview build lokal
bun run preview
```

---

### 5. Jalankan via Docker

```bash
# Build dan jalankan container
docker compose up --build -d

# Periksa status container
docker compose ps

# Hentikan container
docker compose down
```

Buka browser di: **`http://localhost:8080`**

---

### 6. Alur CI/CD Pipeline (GitLab CI)

Setiap *commit* atau *merge* ke branch `main` akan memicu pipeline GitLab CI dengan 4 tahap terurut:

1. **`test`**: Menjalankan pengecekan tipe Svelte/TypeScript (`bun run check`) dan pengujian E2E Playwright (`bun run test`).
2. **`build`**: Mengompilasi kode menjadi bundle statis produksi di direktori `dist/`.
3. **`migrate`**: Menjalankan eksekusi skrip migrasi database Supabase terbaru secara headless (`bunx supabase db push`).
4. **`deploy`**: Mengunggah artefak bundle ke server VPS via Rsync over SSH dan memperbarui izin akses berkas.

---

## 📁 Struktur Direktori

```text
├── public/
│   ├── favicon.svg              # Favicon tab browser
│   ├── logo.svg                 # Logo brand Neo Brutalism
│   ├── manifest.json            # PWA Web App Manifest
│   └── sw.js                    # Service Worker caching & offline handler
├── src/
│   ├── components/              # Komponen antarmuka reusable
│   │   ├── AddAppModal.svelte   # Modal form tambah aplikasi baru
│   │   ├── AlertContainer.svelte# Global toast alert notification container
│   │   ├── AppCard.svelte       # Kartu aplikasi interaktif & PIC WhatsApp
│   │   ├── AppGrid.svelte       # Grid koleksi aplikasi & modal orchestrator
│   │   ├── ConfirmModal.svelte  # Modal konfirmasi hapus data
│   │   ├── CustomSelect.svelte  # Custom Neo Brutalism accessible dropdown
│   │   ├── EditAppModal.svelte  # Modal form edit data aplikasi
│   │   ├── Hero.svelte          # Hero branding & tech badges
│   │   ├── Navbar.svelte        # Sticky header navigasi, status user & i18n
│   │   └── TodoList.svelte      # Catatan to-do list, subtodos & app association
│   ├── data/
│   │   └── apps.ts              # File data fallback baseline
│   ├── i18n/                    # Kamus translasi JSON
│   │   ├── en.json              # Kamus Bahasa Inggris
│   │   └── id.json              # Kamus Bahasa Indonesia
│   ├── lib/
│   │   ├── env.ts               # Type-safe environment variables helper
│   │   └── supabaseClient.ts    # Supabase client initialization
│   ├── pages/                   # Halaman SPA routes
│   │   ├── company-profile/
│   │   │   └── page.svelte      # Halaman profil CV Sukses Gemilang
│   │   ├── home/
│   │   │   └── page.svelte      # Halaman dashboard utama
│   │   └── login/
│   │       └── page.svelte      # Halaman autentikasi pengguna
│   ├── router/
│   │   └── index.ts             # Definisi rute SPA menggunakan sv-router
│   ├── stores/                  # Global state management (Zustand)
│   │   ├── alertStore.ts        # Store notifikasi toast
│   │   ├── appStore.ts          # Store aplikasi & Supabase sync
│   │   ├── authStore.ts         # Store autentikasi pengguna & RBAC
│   │   ├── i18nStore.ts         # Store bahasa reaktif
│   │   ├── themeStore.ts        # Store tema Light / Dark
│   │   └── todoStore.ts         # Store to-do list, subtodos & offline queue
│   ├── app.css                  # Custom theme tokens Neo Brutalism & Dark Mode
│   ├── App.svelte               # Root component & layout wrapper
│   └── main.ts                  # Entry point & PWA service worker registration
├── supabase/
│   ├── migrations/              # Berkas migrasi database terversi
│   │   ├── 20260923000001_create_tables.sql
│   │   └── 20260923000002_seed_defaults.sql
│   └── schema.sql               # Konsolidasi skema database & RPC
├── tests/
│   └── hub.spec.ts              # Playwright E2E automated test suite (36 tests)
├── .gitlab-ci.yml               # Konfigurasi GitLab CI/CD Pipeline
├── Dockerfile                   # Multi-stage production container build
├── docker-compose.yml           # Docker Compose orchestrator
├── nginx.conf                   # Nginx web server config (SPA rewrite & gzip)
├── PRD.md                       # Product Requirements Document
└── README.md                    # Dokumentasi lengkap proyek
```

---

## 📜 Lisensi & Kontributor

Dikembangkan untuk **CV Sukses Gemilang** oleh **[Rizal Fauzi](https://github.com/rizlfauzy)**.
Open source untuk keperluan referensi dan pembelajaran.

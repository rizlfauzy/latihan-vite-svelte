# ⚡ Apps Hub — CV Sukses Gemilang

> **Portal Aplikasi & Dashboard Operasional Terpadu** untuk **CV Sukses Gemilang** (Pusat Hiburan Keluarga & Game Center Arcade). Dilengkapi manajemen aplikasi terhubung ke database cloud Supabase, relasi tugas To-Do dengan modul aplikasi (*app association & cascading deletion*), komponen dropdown interaktif kustom (*CustomSelect*), sistem navigasi SPA, sticky navbar, catatan tugas bertingkat (*sub-tasks*), sistem notifikasi toast, Progressive Web App (PWA) dengan Service Worker caching, dukungan Dark Mode, lokalisasi dwibahasa (ID & EN), integrasi kontak WhatsApp PIC teknis, dan rangkaian pengujian otomatis E2E Playwright (31 skenario).

![Svelte 5](https://img.shields.io/badge/Svelte-5.x_Runes-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Zustand](https://img.shields.io/badge/State-Zustand-orange?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-Ready-5A0FC8?style=for-the-badge&logo=pwa&logoColor=white)
![i18n](https://img.shields.io/badge/i18n-EN_%26_ID-1d76db?style=for-the-badge)
![Playwright](https://img.shields.io/badge/Playwright-31_E2E_Tests-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Design](https://img.shields.io/badge/Style-Neo_Brutalism-FFD000?style=for-the-badge)

---

## 🎨 Fitur Utama

- 🚀 **Enterprise App Hub Grid**: Menampilkan modul aplikasi operasional game center dalam tata letak kartu responsif dengan hard-shadow dan border tegas khas Neo Brutalism.
- ⚡ **Supabase Cloud Database Sync**: Persistensi data aplikasi dan daftar tugas langsung ke database cloud Supabase dengan fallback data lokal yang tangguh.
- 🔗 **To-Do App Association & Cascading Deletion**: Setiap item to-do dapat dikaitkan dengan aplikasi spesifik (`appId`). Jika suatu aplikasi dihapus, seluruh tugas to-do yang terafiliasi akan ikut terhapus secara otomatis (*cascading delete*).
- 🎛️ **Custom Neo Brutalism Select (`CustomSelect`)**: Komponen dropdown interaktif yang dapat diakses penuh via keyboard tanpa bergantung pada elemen native `<select>`.
- ✏️ **Manajemen Aplikasi (CRUD)**: Tambah, edit, dan hapus modul aplikasi operasional dengan proteksi modal konfirmasi interaktif saat mode debug aktif (`VITE_ENABLE_DEBUG=true`).
- 🌙 **Dark Mode & Theming**: Dukungan peralihan tema terang dan gelap dengan kontras tinggi yang tersimpan di `localStorage`.
- 📱 **Progressive Web App (PWA)**: Dilengkapi Service Worker caching (`sw.js`) dan App Manifest (`manifest.json`) agar dapat diinstal di perangkat desktop maupun mobile.
- 🏢 **Profil Perusahaan (CV Sukses Gemilang)**: Halaman company profile interaktif (`/company-profile`) yang memaparkan visi, layanan wahana game center (Arcade & VR, Redemption & Prize Center, Event & Tournament Hall), serta konsultasi WhatsApp.
- 💬 **WhatsApp PIC Direct Contact**: Setiap kartu aplikasi dilengkapi tombol WhatsApp dengan pesan otomatis terformat untuk percepatan eskalasi teknis operasional.
- 📝 **To-Do List & Sub-Tasks Bertingkat**: Manajemen tugas operasional dengan sub-tasks bertingkat, checklist real-time, filter status (*Semua*, *Belum*, *Selesai*), dan antrean sinkronisasi offline.
- 🔔 **Global Toast Alert System**: Komponen notifikasi mengambang di sudut kanan atas dengan status *success*, *error*, dan *info*.
- 🌐 **Sistem Multibahasa Modular (i18n)**: Dukungan penuh Bahasa Indonesia (`id`) dan Bahasa Inggris (`en`) yang tersimpan rapi dalam file JSON modular ([`src/i18n/id.json`](src/i18n/id.json) & [`src/i18n/en.json`](src/i18n/en.json)).
- 🎭 **Automated E2E Testing**: Suite pengujian komprehensif Playwright dengan 31 skenario test end-to-end yang memvalidasi seluruh alur kerja sistem.

---

## 🛠️ Tech Stack

| Komponen | Teknologi | Deskripsi |
|---|---|---|
| **Framework** | Svelte 5 | Frontend framework reaktif dengan Runes (`$state`, `$derived`, `$effect`) |
| **Bundler & Runtime** | Vite 8 + Bun | Lightning-fast development server, bundler, dan runtime |
| **Database** | Supabase | PostgreSQL cloud database untuk tabel `apps` dan `todos` |
| **State Management** | Zustand (Vanilla) | Global reactive state untuk apps, todos, alerts, i18n, dan theme |
| **Routing** | `sv-router` | Client-side Single Page Application (SPA) routing |
| **Styling** | Tailwind CSS v4 | Utility-first CSS dengan custom theme tokens Neo Brutalism |
| **Localization** | JSON-based i18n | Kamus kata modular dwibahasa di `src/i18n/*.json` |
| **Testing** | Playwright | E2E browser automation & UI regression test suite (31 tests) |
| **PWA** | Service Worker | Offline caching dan instalasi web app |
| **Container** | Docker + Nginx | Multi-stage builder & production web server |

---

## ⚙️ Konfigurasi Environment Variables

Salin template file `.env.example`:

```bash
cp .env.example .env
```

Daftar variabel yang tersedia:

| Variabel | Default | Deskripsi |
|---|---|---|
| `VITE_APP_TITLE` | `⚡ Apps Hub — CV Sukses Gemilang` | Judul aplikasi di browser tab & header |
| `VITE_APP_LOGO_URL` | `/logo.svg` | Path/URL logo utama |
| `VITE_APP_FAVICON_URL` | `/favicon.svg` | Path/URL favicon tab browser |
| `VITE_APP_ENV` | `development` / `production` | Penanda environment aplikasi |
| `VITE_ENABLE_DEBUG` | `true` / `false` | Mengaktifkan tombol Tambah, Edit, dan Hapus Aplikasi |
| `VITE_API_BASE_URL` | `http://localhost:8888/api` | Base URL endpoint API |
| `VITE_SUPABASE_URL` | `https://your-project.supabase.co` | URL instance Supabase |
| `VITE_SUPABASE_ANON_KEY` | `your-anon-key` | Public anon key Supabase |

---

## 🚀 Memulai (Getting Started)

### Prasyarat
- [Bun](https://bun.sh/) (atau Node.js v18+)
- [Docker](https://www.docker.com/) (opsional, untuk deployment)

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

```bash
# Jalankan seluruh 31 test cases secara headless
bun run test

# Jalankan test dengan mode visual UI
bun run test:ui
```

---

### 3. Build & Diagnostics

```bash
# Svelte check & TypeScript typecheck
bun run check

# Bundle static production build
bun run build

# Preview build lokal
bun run preview
```

---

### 4. Jalankan via Docker

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
│   │   ├── Navbar.svelte        # Sticky header navigasi, theme toggle & i18n
│   │   └── TodoList.svelte      # Catatan to-do list, sub-tasks & app association
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
│   │   └── home/
│   │       └── page.svelte      # Halaman dashboard utama
│   ├── router/
│   │   └── index.ts             # Definisi rute SPA menggunakan sv-router
│   ├── stores/                  # Global state management (Zustand)
│   │   ├── alertStore.ts        # Store notifikasi toast
│   │   ├── appStore.ts          # Store aplikasi & Supabase sync
│   │   ├── i18nStore.ts         # Store bahasa reaktif
│   │   ├── themeStore.ts        # Store tema Light / Dark
│   │   └── todoStore.ts         # Store to-do list, sub-tasks & offline queue
│   ├── app.css                  # Custom theme tokens Neo Brutalism & Dark Mode
│   ├── App.svelte               # Root component & layout wrapper
│   └── main.ts                  # Entry point & PWA service worker registration
├── tests/
│   └── hub.spec.ts              # Playwright E2E automated test suite (31 tests)
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

# PRD — Apps Hub: CV Sukses Gemilang (Product Requirements Document)

## 📌 Executive Summary

**Apps Hub — CV Sukses Gemilang** adalah platform portal dan *enterprise dashboard* modern yang dirancang untuk mengagregasi seluruh sistem operasional internal, utilitas manajemen gerai, dan aplikasi mikro **CV Sukses Gemilang** (perusahaan pusat hiburan keluarga & game center arcade interaktif sekelas Timezone).

Aplikasi ini mengusung estetika visual **Neo Brutalism** yang tegas dan taktil, dibangun menggunakan arsitektur modern **Svelte 5** dengan paradigma **Runes** (`$state`, `$derived`, `$effect`), dibundel dengan **Vite 8**, dan dilengkapi integrasi cloud database **Supabase**, relasi tugas To-Do dengan modul aplikasi (*app association & cascading deletion*), komponen interaktif kustom (*CustomSelect*), *Progressive Web App* (PWA), *Dark Mode*, sistem notifikasi toast (*alertStore*), lokalisasi multibahasa (ID & EN), serta otomasi pengujian E2E menyeluruh dengan Playwright (31 test cases).

---

## 🎯 Problem Statement & Goals

### Masalah
- Sistem operasional dan aplikasi utilitas game center (manajemen mesin arcade, loket tiket redemption, inventaris merchandise, reservasi event) tersebar tanpa gerbang masuk terpadu.
- Tim operasional gerai kesulitan menemukan contact person (PIC) teknis saat terjadi kendala mesin permainan atau sistem kasir di lapangan.
- Kebutuhan akan sistem catatan cepat to-do list harian teknisi/supervisor yang dapat dikelompokkan berdasarkan modul aplikasi terkait.
- Kebutuhan sinkronisasi data cloud real-time yang tetap dapat beroperasi secara tangguh (*offline capability & fallback*).

### Tujuan
- **Sentralisasi Portal Operasional**: Menyediakan satu pintu masuk terpusat menuju seluruh modul aplikasi internal CV Sukses Gemilang.
- **Direct Technical PIC Routing**: Tombol kontak WhatsApp terformat otomatis untuk tiap penanggung jawab aplikasi guna mempercepat respons teknis lapangan.
- **Relasi Tugas & Aplikasi**: Mengintegrasikan To-Do list dengan modul aplikasi terkait (`appId`), dilengkapi *cascading deletion* otomatis saat aplikasi dinonaktifkan/dihapus.
- **Enterprise-Grade DX & Robust Architecture**: Menggunakan Svelte 5 runes, Supabase real-time database, Tailwind CSS v4, Zustand vanilla store contract, dan custom UI components.
- **Offline & PWA Ready**: Beroperasi sebagai Progressive Web App dengan caching Service Worker dan offline sync queue.
- **Bilingual & Dark Mode Support**: Aksesibilitas penuh Bahasa Indonesia & Bahasa Inggris serta switch tema Light/Dark.
- **High Test Coverage**: 31 skenario E2E otomatis dengan Playwright untuk menjamin stabilitas fungsional.

---

## 👥 Target User

1. **Store Manager & Operational Supervisor**: Memantau portal aplikasi operasional gerai game center, mengelola to-do list harian tim, dan menghubungi PIC teknis.
2. **Technician & Arcade Maintenance Crew**: Mencatat perbaikan mesin game, memeriksa dokumentasi sistem, dan mengakses aplikasi penunjang maintenance.
3. **Internal Core Developer & Administrator**: Mengelola pendaftaran aplikasi baru, konfigurasi database Supabase, dan pemeliharaan platform.

---

## 🧱 Core Features & Functional Requirements

### 1. Hub Aplikasi Operasional & Link Grid
- Menampilkan kartu-kartu aplikasi operasional dalam tata letak grid responsif Neo Brutalism.
- Setiap kartu menyajikan icon emoji, nama aplikasi, deskripsi fungsi, tag kategori, tombol direct access, dan tombol WhatsApp PIC berformat pesan instan.
- Counter reaktif total aplikasi operasional yang aktif.
- Empty state informatif jika belum ada aplikasi yang terdaftar.

### 2. Manajemen Aplikasi (CRUD) & Cloud Database Sync
- **Add Application**: Modal pendaftaran modul aplikasi baru dengan validasi data lengkap.
- **Edit Application**: Modal pembaruan metadata aplikasi (nama, URL, kategori, PIC, WhatsApp).
- **Delete Application**: Modal konfirmasi hapus bergaya Neo Brutalism yang juga mengeksekusi *cascading deletion* terhadap to-do list yang terafiliasi dengan aplikasi tersebut.
- **Supabase Cloud Persistence**: Tersinkronisasi dua arah dengan tabel `apps` di Supabase, dengan graceful fallback saat jaringan offline.
- **Debug Mode Gated**: Fitur mutasi aplikasi dikontrol oleh environment variable `VITE_ENABLE_DEBUG`.

### 3. To-Do List Harian dengan Asosiasi Aplikasi & Sub-Tasks
- **App Association**: Setiap tugas to-do dapat diasosiasikan dengan modul aplikasi tertentu (`appId`) menggunakan komponen kustom `CustomSelect`.
- **Cascading Deletion**: Menghapus modul aplikasi secara otomatis membersihkan semua tugas to-do yang terkait dengan modul tersebut, baik di store lokal maupun di Supabase.
- **Sub-Tasks Bertingkat**: Setiap tugas utama mendukung sub-task tak terbatas dengan checkbox progres real-time (`X/Y SUB-TASKS`).
- **Filter Status**: Filter cepat (*Semua*, *Belum*, *Selesai*) dan aksi massal *Hapus yang Selesai*.
- **Offline Sync Queue**: Perubahan tugas tetap dicatat saat koneksi terputus dan disinkronkan kembali saat online.

### 4. Custom Neo Brutalism Dropdown (`CustomSelect`)
- Menggantikan elemen `<select>` native dengan dropdown kustom yang konsisten dengan estetika Neo Brutalism.
- Mendukung keyboard navigation (Arrow Up/Down, Enter, Escape) dan state interaktif taktil.

### 5. Profil Perusahaan (CV Sukses Gemilang)
- Halaman profil korporat interaktif (`/company-profile`) yang memaparkan visi, misi, dan pilar bisnis game center keluarga (Arcade & VR, Redemption & Prize Center, Event & Tournament Space).
- Metrik bisnis utama (Wahana Game Center, Simulator Modern, Pilihan Merchandise Hadiah).
- Form kontak dan direct consultation WhatsApp terintegrasi.

### 6. PWA & Offline Support
- Service Worker (`sw.js`) dan Web App Manifest (`manifest.json`) terkonfigurasi penuh untuk instalasi di desktop maupun mobile.
- Cache-first strategy untuk aset statis dan offline badge indicator.

### 7. Dark Mode & Theming Neo Brutalism
- Toggle mode gelap / terang melalui `themeStore` dengan persistensi `localStorage`.
- Palet warna kontras tinggi yang adaptif terhadap mode gelap (`dark:` variants di Tailwind CSS v4).

### 8. Sistem Notifikasi Toast Global
- Komponen `AlertContainer` melayang di sudut kanan atas layar (`fixed top-4 right-4 z-50`).
- Mendukung tipe `success`, `error`, dan `info` dengan auto-dismiss 3.5 detik dan manual close.

### 9. Multibahasa Terisolasi (i18n)
- Kamus modular di `src/i18n/id.json` dan `src/i18n/en.json`.
- Switcher instan di Navbar dengan penyimpanan preferensi pengguna di `localStorage`.

---

## 🛠️ Architecture & Tech Stack

| Layer | Komponen / Library | Deskripsi |
|---|---|---|
| **Framework** | Svelte 5 | Reactive UI berbasis Runes (`$state`, `$derived`, `$effect`) |
| **Bundler & Runtime** | Vite 8 + Bun | High-speed build tool, HMR, dan JavaScript runtime |
| **Database & Cloud** | Supabase | PostgreSQL cloud database untuk tabel `apps` dan `todos` |
| **State Management** | Zustand (Vanilla) | Reactive stores (`appStore`, `todoStore`, `alertStore`, `i18nStore`, `themeStore`) |
| **Routing** | `sv-router` | Client-side Single Page Application (SPA) routing |
| **Styling** | Tailwind CSS v4 | Custom design tokens Neo Brutalism & Dark Mode |
| **PWA** | Service Worker + Manifest | Instalasi aplikasi offline & asset caching |
| **Testing** | Playwright | End-to-end automated testing suite (31 test scenarios) |
| **Container** | Docker + Nginx Alpine | Multi-stage production container build |

---

## 📂 Struktur Direktori Proyek

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

## ✅ Quality & Acceptance Criteria

- [x] Tampilan konsisten bergaya Neo Brutalism di seluruh komponen dan halaman.
- [x] Transisi rute SPA mulus antara Home dan Company Profile CV Sukses Gemilang.
- [x] Sticky Navbar tetap melayang di atas viewport saat pengguna melakukan scroll.
- [x] Manajemen aplikasi (Tambah, Edit, Hapus) terintegrasi dengan database Supabase saat debug mode aktif.
- [x] Fitur relasi To-Do List dengan App Topic (`appId`) menggunakan `CustomSelect`.
- [x] Penghapusan aplikasi memicu *cascading deletion* terhadap to-do list terkait secara konsisten.
- [x] Sub-tasks bertingkat berfungsi penuh dengan indikator progres dan checkbox reaktif.
- [x] Dark Mode toggle tersimpan di `localStorage` dan terintegrasi dengan skema warna Neo Brutalism.
- [x] PWA terdaftar dengan Service Worker aktif dan caching aset.
- [x] Sistem translasi dwibahasa (ID & EN) tersimpan dalam file JSON terpisah dan bekerja instan di seluruh elemen UI.
- [x] Seluruh 31 skenario automated E2E test cases Playwright lulus pengujian (`bun run test`).
- [x] Svelte check dan TypeScript compiler bersih dari error maupun warning (`bun run check`).
- [x] Production build berhasil dibuat tanpa kendala (`bun run build`).

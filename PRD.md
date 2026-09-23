# PRD — Apps Hub: CV Sukses Gemilang (Product Requirements Document)

## 📌 Executive Summary

**Apps Hub — CV Sukses Gemilang** adalah platform portal dan *enterprise dashboard* modern yang dirancang untuk mengagregasi seluruh sistem operasional internal, utilitas manajemen gerai, dan aplikasi mikro **CV Sukses Gemilang** (perusahaan pusat hiburan keluarga & game center arcade interaktif sekelas Timezone).

Aplikasi ini mengusung estetika visual **Neo Brutalism** yang tegas dan taktil, dibangun menggunakan arsitektur modern **Svelte 5** dengan paradigma **Runes** (`$state`, `$derived`, `$effect`), dibundel dengan **Vite 8**, dan dilengkapi integrasi cloud database **Supabase** (PostgreSQL), sistem **Autentikasi & Role-Based Access Control (RBAC)**, tabel relasional terpisah untuk subtask (*subtodos*), relasi tugas To-Do dengan modul aplikasi (*app association & cascading deletion*), komponen interaktif kustom (*CustomSelect*), *Progressive Web App* (PWA), *Dark Mode*, sistem notifikasi toast (*alertStore*), lokalisasi multibahasa (ID & EN), otomasi pengujian E2E menyeluruh dengan Playwright (36 test cases), serta pipeline deployment otomatis (CI/CD) lengkap dengan eksekusi migrasi database Supabase.

---

## 🎯 Problem Statement & Goals

### Masalah
- Sistem operasional dan aplikasi utilitas game center (manajemen mesin arcade, loket tiket redemption, inventaris merchandise, reservasi event) tersebar tanpa gerbang masuk terpadu.
- Tim operasional gerai kesulitan menemukan contact person (PIC) teknis saat terjadi kendala mesin permainan atau sistem kasir di lapangan.
- Kebutuhan akan sistem catatan cepat to-do list harian teknisi/supervisor yang dapat dikelompokkan berdasarkan modul aplikasi terkait dengan hierarki subtask yang rapi dan terelasi.
- Belum adanya sistem kontrol hak akses berbasis peran (RBAC) terpusat untuk membatasi aksi manipulasi data aplikasi penting dari pengunjung publik atau pengguna yang tidak berwenang.
- Kebutuhan sinkronisasi data cloud real-time dengan skema database yang terkelola rapi melalui sistem migrasi otomatis serta pipeline CI/CD yang andal.

### Tujuan
- **Sentralisasi Portal Operasional**: Menyediakan satu pintu masuk terpusat menuju seluruh modul aplikasi internal CV Sukses Gemilang.
- **Direct Technical PIC Routing**: Tombol kontak WhatsApp terformat otomatis untuk tiap penanggung jawab aplikasi guna mempercepat respons teknis lapangan.
- **Relasi Tugas & Aplikasi**: Mengintegrasikan To-Do list dengan modul aplikasi terkait (`app_id`), dilengkapi tabel relasional mandiri untuk subtask (`subtodos`) serta *cascading deletion* otomatis saat aplikasi dinonaktifkan/dihapus.
- **Autentikasi Terpusat & Kontrol Akses Berbasis Peran (RBAC)**: Pengunjung publik tetap bebas mengakses portal secara transparan, sementara fitur manipulasi data (Tambah, Edit, Hapus Apps) diproteksi khusus untuk user terotentikasi yang memiliki peran dengan hak akses debug (`is_debug: true`).
- **Skema Database Relasional & Migrasi Terkelola**: Database PostgreSQL di Supabase dengan skema migrasi berkas (`supabase/migrations/`) yang dieksekusi otomatis pada pipeline CI/CD.
- **Enterprise-Grade DX & Robust Architecture**: Menggunakan Svelte 5 runes, Supabase real-time database, Tailwind CSS v4, Zustand vanilla store contract, dan custom UI components.
- **Offline & PWA Ready**: Beroperasi sebagai Progressive Web App dengan caching Service Worker dan offline sync queue.
- **Bilingual & Dark Mode Support**: Aksesibilitas penuh Bahasa Indonesia & Bahasa Inggris serta switch tema Light/Dark.
- **High Test Coverage**: 36 skenario E2E otomatis dengan Playwright untuk menjamin stabilitas fungsional sistem.

---

## 👥 Target User & Hak Akses (RBAC)

1. **Pengunjung Publik / Tamu (Guest)**:
   - Mengakses portal operasional tanpa kewajiban login.
   - Melihat daftar modul aplikasi operasional dan profil perusahaan.
   - Menggunakan fitur kontak langsung ke PIC teknis via WhatsApp.
   - Menggunakan to-do list harian lokal/sinkronisasi publik.
   - **Batasan**: Tidak dapat menambah, mengedit, atau menghapus modul aplikasi.

2. **Pengguna Terotentikasi (Authenticated Staff)**:
   - Masuk melalui halaman login khusus di `/login`.
   - Mengakses dashboard operasional dengan identitas terverifikasi.
   - Hak akses manipulasi data bergantung pada hak spesifik role pengguna.

3. **Superadmin / Role dengan Debug Access (`is_debug: true`)**:
   - Memiliki kendali penuh (CRUD) terhadap daftar modul aplikasi operasional (Tambah, Edit, Hapus, dan Hapus Massal).
   - Memiliki visibilitas kontrol debug di antarmuka pengguna.
   - Akun pengguna dan role dikelola secara terpusat langsung dari database (tidak disediakan pendaftaran mandiri/registrasi publik).

---

## 🧱 Core Features & Functional Requirements

### 1. Hub Aplikasi Operasional & Link Grid
- Menampilkan kartu-kartu aplikasi operasional dalam tata letak grid responsif Neo Brutalism.
- Setiap kartu menyajikan icon emoji, nama aplikasi, deskripsi fungsi, tag kategori, tombol direct access, dan tombol WhatsApp PIC berformat pesan instan.
- Counter reaktif total aplikasi operasional yang aktif.
- Empty state informatif jika belum ada aplikasi yang terdaftar.

### 2. Autentikasi & Role-Based Access Control (RBAC)
- **Halaman Login Dedicated**: Rute khusus di `/login` dengan desain Neo Brutalism untuk otentikasi pengguna.
- **Manajemen Akun Terpusat**: Pembuatan akun pengguna dan penugasan peran hanya dilakukan via database (`users` dan `roles`), meniadakan registrasi publik untuk menjamin keamanan operasional internal.
- **Verifikasi Kredensial Aman**: Otentikasi menggunakan RPC Supabase dengan verifikasi password terenkripsi (Bcrypt via modul ekstensi PostgreSQL).
- **Proteksi Fitur Aplikasi**: Tombol Tambah Aplikasi, Edit, Hapus, dan Hapus Massal (*Bulk Action*) hanya muncul dan dapat dieksekusi jika pengguna yang login memiliki role dengan flag `is_debug: true`.
- **Navigasi Dinamis**: Navbar menampilkan tombol "Masuk" untuk tamu, atau profil pengguna beserta tombol "Keluar" (*Logout*) saat pengguna telah terotentikasi.

### 3. Manajemen Aplikasi (CRUD) & Cloud Database Sync
- **Add Application**: Modal pendaftaran modul aplikasi baru dengan validasi data lengkap.
- **Edit Application**: Modal pembaruan metadata aplikasi (nama, URL, kategori, PIC, WhatsApp).
- **Delete Application**: Modal konfirmasi hapus bergaya Neo Brutalism yang juga mengeksekusi *cascading deletion* terhadap to-do list yang terafiliasi dengan aplikasi tersebut.
- **Bulk Delete & Select All**: Fitur "Pilih Semua" dan checkbox pada tiap kartu aplikasi saat sesi pengguna memiliki akses debug, memungkinkan penghapusan massal aplikasi terpilih beserta *cascading deletion* otomatis ke daftar To-Do.
- **Supabase Cloud Persistence**: Tersinkronisasi dua arah dengan tabel `apps` di Supabase, dengan graceful fallback saat jaringan offline.

### 4. To-Do List Harian dengan Asosiasi Aplikasi & Relasi Subtodos
- **App Association**: Setiap tugas to-do dapat diasosiasikan dengan modul aplikasi tertentu (`app_id`) menggunakan komponen kustom `CustomSelect`.
- **Cascading Deletion**: Menghapus modul aplikasi secara otomatis membersihkan semua tugas to-do yang terkait dengan modul tersebut, baik di store lokal maupun di database Supabase.
- **Relasi Subtodos Mandiri**: Subtask tidak lagi disimpan sebagai array JSON di dalam row tugas, melainkan dikelola sebagai entitas relasional mandiri pada tabel `subtodos` dengan *foreign key* mengacu pada `todos(id)` dan penghapusan bertingkat (*ON DELETE CASCADE*).
- **Check All (Tandai Selesai Semua)**: Tombol aksi cepat untuk menandai seluruh tugas aktif menjadi selesai sekaligus, bersinergi dengan tombol pembersihan tugas (*Hapus yang Selesai*).
- **Filter Status**: Filter cepat (*Semua*, *Belum*, *Selesai*) dan aksi massal *Hapus yang Selesai*.
- **Offline Sync Queue**: Perubahan tugas tetap dicatat saat koneksi terputus dan disinkronkan kembali saat online.

### 5. Custom Neo Brutalism Dropdown (`CustomSelect`)
- Menggantikan elemen `<select>` native dengan dropdown kustom yang konsisten dengan estetika Neo Brutalism.
- Mendukung keyboard navigation (Arrow Up/Down, Enter, Escape) dan state interaktif taktil.

### 6. Profil Perusahaan (CV Sukses Gemilang)
- Halaman profil korporat interaktif (`/company-profile`) yang memaparkan visi, misi, dan pilar bisnis game center keluarga (Arcade & VR, Redemption & Prize Center, Event & Tournament Space).
- Metrik bisnis utama (Wahana Game Center, Simulator Modern, Pilihan Merchandise Hadiah).
- Form kontak dan direct consultation WhatsApp terintegrasi.

### 7. PWA & Offline Support
- Service Worker (`sw.js`) dan Web App Manifest (`manifest.json`) terkonfigurasi penuh untuk instalasi di desktop maupun mobile.
- Cache-first strategy untuk aset statis dan offline badge indicator.

### 8. Dark Mode & Theming Neo Brutalism
- Toggle mode gelap / terang melalui `themeStore` dengan persistensi `localStorage`.
- Palet warna kontras tinggi yang adaptif terhadap mode gelap (`dark:` variants di Tailwind CSS v4).

### 9. Sistem Notifikasi Toast Global
- Komponen `AlertContainer` melayang di sudut kanan atas layar (`fixed top-4 right-4 z-50`).
- Mendukung tipe `success`, `error`, dan `info` dengan auto-dismiss 3.5 detik dan manual close.

### 10. Multibahasa Terisolasi (i18n)
- Kamus modular di `src/i18n/id.json` dan `src/i18n/en.json`.
- Switcher instan di Navbar dengan penyimpanan preferensi pengguna di `localStorage`.

---

## 🛠️ Architecture & Tech Stack

| Layer | Komponen / Library | Deskripsi |
|---|---|---|
| **Framework** | Svelte 5 | Reactive UI berbasis Runes (`$state`, `$derived`, `$effect`) |
| **Bundler & Runtime** | Vite 8 + Bun | High-speed build tool, HMR, dan JavaScript/TypeScript runtime |
| **Database & Cloud** | Supabase (PostgreSQL) | Skema relasional terstruktur: `roles`, `users`, `apps`, `todos`, dan `subtodos` |
| **Autentikasi & Enkripsi** | Supabase RPC + Bcrypt | Verifikasi password via `pgcrypto` (`crypt` & `gen_salt`) dengan session token |
| **Database Migrations** | Supabase CLI | Version-controlled DDL migration scripts di `supabase/migrations/` |
| **State Management** | Zustand (Vanilla) | Reactive stores (`authStore`, `appStore`, `todoStore`, `alertStore`, `i18nStore`, `themeStore`) |
| **Routing** | `sv-router` | Client-side SPA routing (`/`, `/company-profile`, `/login`) |
| **Styling** | Tailwind CSS v4 | Custom design tokens Neo Brutalism & Dark Mode |
| **PWA** | Service Worker + Manifest | Instalasi aplikasi offline & asset caching |
| **Testing** | Playwright | End-to-end automated testing suite (36 test scenarios) dengan auto-cleanup |
| **CI/CD Pipeline** | GitLab CI | Pipeline terotomatisasi: Test -> Build -> Migrate -> Deploy (VPS Rsync) |
| **Container** | Docker + Nginx Alpine | Multi-stage production container build (opsional/alternatif deployment) |

---

## 🗄️ Skema Database Relasional (High-Level)

Arsitektur database mengusung struktur relasional normalisasi:

1. **`roles`**: Menyimpan daftar peran sistem (misal: `SUPERADMIN`).
   - Atribut utama: `id`, `name`, `is_debug`, timestamps, audit trail.
2. **`users`**: Menyimpan kredensial dan referensi profil pengguna.
   - Atribut utama: `uuid`, `username`, `name`, `password` (hash), `role_id` (FK ke `roles.id`), timestamps, audit trail.
3. **`apps`**: Menyimpan data modul aplikasi operasional.
   - Atribut utama: `id`, `name`, `url`, `description`, `category`, `icon`, `pic_name`, `pic_whatsapp`, timestamps.
4. **`todos`**: Menyimpan tugas to-do list harian.
   - Atribut utama: `id`, `text`, `completed`, `app_id` (FK ke `apps.id` *ON DELETE CASCADE*), timestamps.
5. **`subtodos`**: Menyimpan subtask hierarkis untuk tiap to-do.
   - Atribut utama: `id`, `todo_id` (FK ke `todos.id` *ON DELETE CASCADE*), `text`, `completed`, timestamps.

---

## 🔄 CI/CD & Deployment Workflow

Pipeline integrasi dan deployment berkelanjutan dijalankan melalui GitLab CI pada setiap pembaruan ke branch `main`:

```text
[1. Test Stage]      -> Menjalankan typecheck (bun run check) dan E2E test (bun run test)
       ↓
[2. Build Stage]     -> Mengkompilasi aset statis frontend (bun run build)
       ↓
[3. Migrate Stage]   -> Menjalankan migrasi DDL & seeder Supabase via Supabase CLI (--db-url)
       ↓
[4. Deploy Stage]    -> Sinkronisasi berkas build ke server produksi VPS via Rsync over SSH
```

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

## ✅ Quality & Acceptance Criteria

- [x] Tampilan konsisten bergaya Neo Brutalism di seluruh komponen dan halaman.
- [x] Transisi rute SPA mulus antara Home (`/`), Company Profile (`/company-profile`), dan Login (`/login`).
- [x] Pengunjung umum dapat mengakses dashboard operasional secara publik tanpa hambatan login.
- [x] Akses CUD aplikasi (Tambah, Edit, Hapus, Bulk Delete) diproteksi secara ketat melalui RBAC (`is_debug: true`).
- [x] Skema database Supabase telah dinormalisasi dengan tabel `subtodos` terpisah dan *foreign key* yang tepat.
- [x] Penghapusan aplikasi memicu *cascading deletion* terhadap to-do list dan subtodos terkait secara konsisten.
- [x] Seluruh alur migrasi database dijalankan secara otomatis pada pipeline CI/CD saat deploy ke server.
- [x] Fitur relasi To-Do List dengan App Topic (`app_id`) menggunakan `CustomSelect`.
- [x] Subtask bertingkat berfungsi penuh dengan indikator progres dan checkbox reaktif.
- [x] Dark Mode toggle tersimpan di `localStorage` dan terintegrasi dengan skema warna Neo Brutalism.
- [x] PWA terdaftar dengan Service Worker aktif dan caching aset.
- [x] Sistem translasi dwibahasa (ID & EN) tersimpan dalam file JSON terpisah dan bekerja instan di seluruh elemen UI.
- [x] Seluruh 36 skenario automated E2E test cases Playwright lulus pengujian (`bun run test`).
- [x] Svelte check dan TypeScript compiler bersih dari error maupun warning (`bun run check`).
- [x] Production build berhasil dibuat tanpa kendala (`bun run build`).

# PRD — Apps Hub: CV Sukses Gemilang (Product Requirements Document)

## 📌 Executive Summary

**Apps Hub — CV Sukses Gemilang** adalah platform portal dan *enterprise dashboard* modern yang dirancang untuk mengagregasi seluruh sistem operasional internal, utilitas manajemen gerai, dan aplikasi mikro **CV Sukses Gemilang** (perusahaan pusat hiburan keluarga & game center arcade interaktif sekelas Timezone).

Aplikasi ini mengusung estetika visual **Neo Brutalism** yang tegas dan taktil, dibangun menggunakan arsitektur modern **Svelte 5** dengan paradigma **Runes** (`$state`, `$derived`, `$effect`), dibundel dengan **Vite 8**, dan dilengkapi integrasi cloud database **Supabase** (PostgreSQL) serta **Supabase Storage** (`todo-images`), sistem **Autentikasi & Role-Based Access Control (RBAC)** dengan halaman **Registrasi Mandiri** (`/register` dengan role otomatis `VIEWER` dan `is_debug: false`), fitur **Upload & Preview Banyak Gambar (Multi-Image) To-Do List** (drag-and-drop, validasi 5 MB dari env variable/ekstensi via `throwAlert`, click-to-preview galeri thumbnail, dan *cascade deletion* file storage), fitur **Preview & Edit Pesan WhatsApp PIC** dengan konteks lampiran gambar tugas, tabel relasional terpisah untuk subtask (*subtodos*), relasi tugas To-Do dengan modul aplikasi (*app association & cascading deletion*), komponen interaktif kustom (*CustomSelect*), *Progressive Web App* (PWA), *Dark Mode*, sistem notifikasi toast (*alertStore*), lokalisasi multibahasa (ID & EN), otomasi pengujian E2E menyeluruh dengan Playwright (40 test cases), serta pipeline deployment otomatis (CI/CD) lengkap dengan eksekusi migrasi database Supabase.

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
   - Menggunakan fitur kontak langsung ke PIC teknis via WhatsApp dengan modal preview dan draft pesan interaktif.
   - Menggunakan to-do list harian lokal/sinkronisasi publik.
   - **Batasan**: Tidak dapat menambah, mengedit, atau menghapus modul aplikasi.

2. **Pengguna Terdaftar (Role: `VIEWER`, `is_debug: false`)**:
   - Mendaftar secara mandiri melalui rute `/register` yang tautan/tombolnya hanya dapat diakses via halaman Login.
   - Otomatis mendapatkan role `VIEWER` dengan flag `is_debug: false`.
   - Mengakses profil akun di `/profile` dan menjelajahi portal dengan identitas terautentikasi.
   - **Batasan**: Tidak memiliki akses debug; tidak dapat melihat tombol Tambah Aplikasi, Edit, Hapus, maupun Hapus Massal.

3. **Superadmin / Role dengan Debug Access (`is_debug: true`)**:
   - Memiliki kendali penuh (CRUD) terhadap daftar modul aplikasi operasional (Tambah, Edit, Hapus, dan Hapus Massal).
   - Memiliki visibilitas kontrol debug di antarmuka pengguna.
   - Akun default (`rizlfauzy`) disemai langsung melalui skrip seeder migrasi database.

---

## 🧱 Core Features & Functional Requirements

### 1. Hub Aplikasi Operasional & Enhanced WhatsApp PIC
- Menampilkan kartu-kartu aplikasi operasional dalam tata letak grid responsif Neo Brutalism.
- Setiap kartu menyajikan icon emoji, nama aplikasi, deskripsi fungsi, tag kategori, tombol direct access, dan tombol kontak WhatsApp PIC.
- **WhatsApp Preview Modal**: Mengklik tombol WhatsApp PIC memunculkan pop-up modal interaktif (`WhatsAppPreviewModal`) yang menampilkan draf pesan chat.
- **Integrasi Tugas Pending & Konteks Gambar**: Draf pesan otomatis merangkum dan menyertakan catatan To-Do yang berstatus belum selesai (*not done*) untuk aplikasi terkait. Jika task pending memiliki lampiran gambar, link gambar disematkan langsung pada baris task (`Lampiran gambar: [URL]`) dan tautan pratinjau gambar ditampilkan di modal.
- **Editable Message**: Pengguna dapat mengedit pesan secara langsung di textarea sebelum mengklik tautan kirim ke WhatsApp (`wa.me`).

### 2. Autentikasi, Registrasi, Ganti Password & Role-Based Access Control (RBAC)
- **Halaman Login Dedicated**: Rute khusus di `/login` dengan toggle show/hide password untuk otentikasi pengguna.
- **Halaman Registrasi Baru (`/register`)**:
  - Tombol akses ke halaman registrasi ditempatkan khusus di halaman Login.
  - Form mencakup input `name` (nama lengkap), `username`, dan `password` dengan fitur *show/hide password* yang konsisten.
  - Setiap pendaftar baru otomatis diberikan role `VIEWER` dengan hak akses `is_debug: false`.
- **Fitur Ganti Password di Menu Profile (`/profile`)**:
  - Tersedia tombol "Ganti Password" di halaman profile pengguna terotentikasi.
  - Memunculkan modal Neo Brutalism (`ChangePasswordModal`) dengan input password lama dan password baru, masing-masing dilengkapi toggle show/hide password.
  - Verifikasi dan update password dilakukan via RPC Supabase `change_user_password` menggunakan hashing Bcrypt (`pgcrypto`).
- **Verifikasi Kredensial & Pendaftaran Aman**: Otentikasi dan pendaftaran menggunakan RPC Supabase (`authenticate_user`, `register_user`, dan `change_user_password`) dengan hashing Bcrypt (`pgcrypto`).
- **Proteksi Fitur Aplikasi**: Tombol Tambah Aplikasi, Edit, Hapus, Hapus Massal (*Bulk Action*), dan Rearrange posisi hanya muncul dan dapat dieksekusi jika pengguna yang login memiliki role dengan flag `is_debug: true`.
- **Navigasi Dinamis**: Navbar menampilkan tombol "Masuk" untuk tamu, atau profil pengguna beserta tombol "Keluar" (*Logout*) saat pengguna telah terotentikasi.

### 3. Manajemen Aplikasi (CRUD), Hero Image, Drag-Drop Upload & Rearrange Posisi
- **Add Application & Edit Application**: Modal pembuatan dan pembaruan metadata aplikasi yang dilengkapi upload banner hero dan icon aplikasi.
- **Hero Banner Image pada Card List Apps**:
  - Kolom `hero_image_url` pada tabel `apps` di database Supabase.
  - Card aplikasi menampilkan banner hero berukuran penuh di bagian atas card. Jika belum ada hero image yang diunggah, sistem otomatis menampilkan banner visual default Neo Brutalism (`default-app-hero.svg`).
  - Form Add & Edit mendukung upload hero image dengan validasi format ketat khusus `.jpg`, `.jpeg`, dan `.png`.
- **Drag-and-Drop Image Upload dengan Instant Preview**:
  - Komponen bersama `DragDropImageInput.svelte` diimplementasikan untuk area upload hero banner maupun icon aplikasi.
  - Mendukung penyeretan file langsung dari file explorer OS (drag-and-drop dropzone) serta pemilihan manual dengan feedback hover taktil.
  - Menampilkan thumbnail preview secara instan begitu file dipilih atau di-drop.
  - Icon aplikasi mendukung format `.jpg`, `.jpeg`, `.png`, dan `.svg` dengan fallback otomatis ke icon Lucide.
- **Drag-and-Drop Rearrange Posisi Apps (Mode Admin)**:
  - Kolom `order_index` pada tabel database `apps` untuk menyimpan posisi urutan.
  - Saat login sebagai admin/debug mode, pengguna dapat menata ulang urutan kartu aplikasi dengan drag-and-drop.
  - Dilengkapi mekanisme **long press** (tekan lama > 150ms) pada kartu untuk mengaktifkan drag mode tanpa mengganggu interaksi klik biasa, serta tombol drag handle (`GripVertical`) khusus admin.
  - Urutan baru otomatis disinkronkan ke Supabase melalui `appStore.reorderApps`.
- **Delete Application & Bulk Delete**: Modal konfirmasi hapus yang mengeksekusi *cascading deletion* terhadap to-do list serta membersihkan aset gambar dari Supabase Storage (`app-images`).
- **Supabase Cloud Persistence**: Tersinkronisasi dua arah dengan tabel `apps` di Supabase, dengan graceful fallback saat jaringan offline.

### 4. To-Do List Harian dengan Asosiasi Aplikasi & Relasi Subtodos
- **App Association**: Setiap tugas to-do dapat diasosiasikan dengan modul aplikasi tertentu (`app_id`) menggunakan komponen kustom `CustomSelect`.
- **Cascading Deletion**: Menghapus modul aplikasi secara otomatis membersihkan semua tugas to-do yang terkait dengan modul tersebut, baik di store lokal maupun di database Supabase.
- **Relasi Subtodos Mandiri**: Subtask tidak lagi disimpan sebagai array JSON di dalam row tugas, melainkan dikelola sebagai entitas relasional mandiri pada tabel `subtodos` dengan *foreign key* mengacu pada `todos(id)` dan penghapusan bertingkat (*ON DELETE CASCADE*).
- **Check All (Tandai Selesai Semua)**: Tombol aksi cepat untuk menandai seluruh tugas aktif menjadi selesai sekaligus, bersinergi dengan tombol pembersihan tugas (*Hapus yang Selesai*).
- **Filter Status**: Filter cepat (*Semua*, *Belum*, *Selesai*) dan aksi massal *Hapus yang Selesai*.
- **Offline Sync Queue**: Perubahan tugas tetap dicatat saat koneksi terputus dan disinkronkan kembali saat online.

### 5. Fitur Upload Banyak Gambar (Multi-Image) To-Do List & Supabase Storage
- **Dukungan Multi-Gambar**: Pengguna dapat melampirkan lebih dari satu gambar pada setiap catatan To-Do (galeri thumbnail, seleksi aktif, dan penghapusan per berkas/semua).
- **Pengaturan Ukuran Dinamis via Environment Variable**: Batas ukuran maksimal gambar dipindahkan ke variabel lingkungan (`VITE_MAX_IMAGE_SIZE_MB="5"`) untuk lingkungan development, production, serta GitLab CI/CD variables (default: 5 MB).
- **Format File**: Hanya menerima ekstensi `.jpg`, `.jpeg`, `.png`, serta `.svg`.
- **Pop-up Modal Interaktif (`ImageUploadModal`)**:
  - Mendukung interaksi *Drag and Drop* banyak file sekaligus maupun seleksi file explorer.
  - Fitur **Click to Preview & Galeri Thumbnail**: Menampilkan strip thumbnail semua lampiran dan memungkinkan pengguna mengklik gambar untuk membuka overlay pratinjau resolusi penuh.
- **Validasi Berbasis `throwAlert`**: Jika ukuran atau ekstensi file tidak memenuhi kriteria, sistem memunculkan toast alert error menggunakan fungsi `throwAlert(new Error(...))`.
- **Cascade Deletion File Storage**: Saat item To-Do dihapus (baik satuan, per aplikasi, maupun pembersihan selesai), seluruh file gambar terkait di bucket Supabase Storage (`todo-images`) dihapus secara otomatis untuk mencegah penumpukan berkas tak terpakai.

### 6. Custom Neo Brutalism Dropdown (`CustomSelect`)
- Menggantikan elemen `<select>` native dengan dropdown kustom yang konsisten dengan estetika Neo Brutalism.
- Mendukung keyboard navigation (Arrow Up/Down, Enter, Escape) dan state interaktif taktil.

### 7. Profil Perusahaan (CV Sukses Gemilang)
- Halaman profil korporat interaktif (`/company-profile`) yang memaparkan visi, misi, dan pilar bisnis game center keluarga (Arcade & VR, Redemption & Prize Center, Event & Tournament Space).
- Metrik bisnis utama (Wahana Game Center, Simulator Modern, Pilihan Merchandise Hadiah).
- Form kontak dan direct consultation WhatsApp terintegrasi.

### 8. PWA & Offline Support
- Service Worker (`sw.js`) dan Web App Manifest (`manifest.json`) terkonfigurasi penuh untuk instalasi di desktop maupun mobile.
- Cache-first strategy untuk aset statis dan offline badge indicator.

### 9. Dark Mode & Theming Neo Brutalism
- Toggle mode gelap / terang melalui `themeStore` dengan persistensi `localStorage`.
- Palet warna kontras tinggi yang adaptif terhadap mode gelap (`dark:` variants di Tailwind CSS v4).

### 10. Sistem Notifikasi Toast Global
- Komponen `AlertContainer` melayang di sudut kanan atas layar (`fixed top-4 right-4 z-50`).
- Mendukung tipe `success`, `error`, dan `info` dengan auto-dismiss 3.5 detik dan manual close.

### 11. Multibahasa Terisolasi (i18n)
- Kamus modular di `src/i18n/id.json` dan `src/i18n/en.json`.
- Switcher instan di Navbar dengan penyimpanan preferensi pengguna di `localStorage`.

### 12. Drag-and-Drop Reorder To-Do List & Sub-Tasks
- **Penataan Ulang To-Do Items**: Pengguna dengan hak akses admin (`is_debug: true`) dapat menyusun ulang urutan catatan to-do secara interaktif melalui tombol drag handle (`GripVertical`) atau dengan menahan/menekan lama (*long-press* 150ms) baris to-do.
- **Penataan Ulang Sub-Tasks**: Subtask di dalam suatu catatan to-do dapat disusun ulang urutannya secara fleksibel menggunakan drag handle.
- **Pemindahan Sub-Tasks Antar-Catatan (Cross-Parent Move)**: Subtask dapat diseret (*drag*) dari satu to-do dan dijatuhkan (*drop*) ke daftar subtask catatan to-do lain, secara otomatis memperbarui relasi foreign key `todo_id` dan `order_index` pada tabel database `subtodos`.
- **Konversi Task Menjadi Sub-Task (Task to Sub-Task Conversion)**: Catatan to-do utama dapat diseret (*drag*) dan dijatuhkan (*drop*) ke area sub-task catatan to-do lain untuk mengubahnya menjadi sub-task. Catatan to-do yang memiliki sub-task di dalamnya divalidasi dan dicegah dari konversi untuk mencegah kehilangan data atau *nested sub-task* yang tidak didukung.
- **Konversi Sub-Task Menjadi Task Mandiri (Sub-Task to Independent Task Conversion)**: Sub-task dapat diseret (*drag*) keluar dari kontainer parent-nya dan dijatuhkan (*drop*) ke area to-do list utama atau kartu to-do lain untuk mengubahnya menjadi catatan to-do utama yang mandiri. Data status dan teks sub-task dipertahankan dan record di tabel `subtodos` dihapus secara otomatis.
- **Persistensi Cloud & Lokal**: Setiap perubahan urutan disinkronkan ke Supabase via batch update kolom `order_index` serta disimpan ke `localStorage`.

---

## 🛠️ Architecture & Tech Stack

| Layer | Komponen / Library | Deskripsi |
|---|---|---|
| **Framework** | Svelte 5 | Reactive UI berbasis Runes (`$state`, `$derived`, `$effect`) |
| **Bundler & Runtime** | Vite 8 + Bun | High-speed build tool, HMR, dan JavaScript/TypeScript runtime |
| **Database & Cloud** | Supabase (PostgreSQL) | Skema relasional terstruktur: `roles`, `users`, `apps`, `todos`, dan `subtodos` |
| **Cloud Storage** | Supabase Storage | Bucket `todo-images` publik dengan RLS policies untuk upload/delete berkas |
| **Autentikasi & Enkripsi** | Supabase RPC + Bcrypt | Verifikasi password via `pgcrypto` (`crypt` & `gen_salt`) dengan session token |
| **Database Migrations** | Supabase CLI | Version-controlled DDL migration scripts di `supabase/migrations/` |
| **State Management** | Zustand (Vanilla) | Reactive stores (`authStore`, `appStore`, `todoStore`, `alertStore`, `i18nStore`, `themeStore`) |
| **Routing** | `sv-router` | Client-side SPA routing (`/`, `/company-profile`, `/login`, `/register`) |
| **Styling** | Tailwind CSS v4 | Custom design tokens Neo Brutalism & Dark Mode |
| **PWA** | Service Worker + Manifest | Instalasi aplikasi offline & asset caching |
| **Testing** | Playwright | End-to-end automated testing suite (49 test scenarios) dengan auto-cleanup |
| **CI/CD Pipeline** | GitLab CI | Pipeline terotomatisasi: Test -> Build -> Migrate -> Deploy (VPS Rsync) |
| **Container** | Docker + Nginx Alpine | Multi-stage production container build (opsional/alternatif deployment) |

---

## 🗄️ Skema Database Relasional (High-Level)

Arsitektur database mengusung struktur relasional normalisasi:

1. **`roles`**: Menyimpan daftar peran sistem (misal: `SUPERADMIN`, `VIEWER`).
   - Atribut utama: `id`, `name`, `is_debug`, timestamps, audit trail.
2. **`users`**: Menyimpan kredensial dan referensi profil pengguna.
   - Atribut utama: `uuid`, `username`, `name`, `password` (hash), `role_id` (FK ke `roles.id`), timestamps, audit trail.
3. **`apps`**: Menyimpan data modul aplikasi operasional.
   - Atribut utama: `id`, `name`, `url`, `description`, `category`, `icon`, `pic_name`, `pic_whatsapp`, timestamps.
4. **`todos`**: Menyimpan tugas to-do list harian.
   - Atribut utama: `id`, `text`, `done`, `image_url`, `appId` (FK ke `apps.id` *ON DELETE CASCADE*), timestamps.
5. **`subtodos`**: Menyimpan subtask hierarkis untuk tiap to-do.
   - Atribut utama: `id`, `todo_id` (FK ke `todos.id` *ON DELETE CASCADE*), `text`, `done`, timestamps.
6. **`storage.buckets & objects`**: Menyimpan file gambar lampiran tugas pada bucket `todo-images` dengan integrasi penghapusan berkas fisik (*cascade storage removal*).

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
│   ├── components/              # Komponen UI Neo Brutalism
│   │   ├── AddAppModal.svelte
│   │   ├── EditAppModal.svelte
│   │   ├── ConfirmModal.svelte
│   │   ├── WhatsAppPreviewModal.svelte # Modal preview & edit pesan WA PIC
│   │   ├── CustomSelect.svelte
│   │   ├── AppCard.svelte
│   │   ├── AppGrid.svelte
│   │   ├── TodoList.svelte
│   │   └── ...
│   ├── pages/
│   │   ├── home/
│   │   ├── company-profile/
│   │   ├── login/
│   │   ├── register/            # Halaman pendaftaran akun baru
│   │   └── profile/
│   ├── stores/
│   │   ├── authStore.ts         # Store autentikasi, registrasi & RBAC
│   │   ├── appStore.ts
│   │   ├── themeStore.ts        # Store tema Light / Dark
│   │   └── todoStore.ts         # Store to-do list, subtodos & offline queue
│   ├── app.css                  # Custom theme tokens Neo Brutalism & Dark Mode
│   ├── App.svelte               # Root component & layout wrapper
│   └── main.ts                  # Entry point & PWA service worker registration
├── supabase/
│   ├── migrations/              # Berkas migrasi database terversi
│   │   ├── 20260923000001_create_tables.sql
│   │   ├── 20260923000002_seed_defaults.sql
│   │   └── 20260924000001_add_viewer_role_and_registration.sql
│   └── schema.sql               # Konsolidasi skema database & RPC
├── tests/
│   └── hub.spec.ts              # Playwright E2E automated test suite (49 tests)
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
- [x] Transisi rute SPA mulus antara Home (`/`), Company Profile (`/company-profile`), Login (`/login`), dan Register (`/register`).
- [x] Pengunjung umum dapat mengakses dashboard operasional secara publik tanpa hambatan login.
- [x] Akses pendaftaran akun mandiri melalui `/register` yang hanya dapat diakses melalui halaman login.
- [x] Pengguna baru yang mendaftar otomatis diberikan role `VIEWER` dengan hak akses `is_debug: false`.
- [x] Form pendaftaran dan login dilengkapi tombol toggle show/hide password yang konsisten.
- [x] Tombol kontak WhatsApp PIC memunculkan modal preview dengan pesan yang dapat diedit dan otomatis merangkum to-do list belum selesai untuk aplikasi yang dipilih.
- [x] Akses CUD aplikasi (Tambah, Edit, Hapus, Bulk Delete) diproteksi secara ketat melalui RBAC (`is_debug: true`).
- [x] Skema database Supabase telah dinormalisasi dengan tabel `subtodos` terpisah dan *foreign key* yang tepat.
- [x] Penghapusan aplikasi memicu *cascading deletion* terhadap to-do list dan subtodos terkait secara konsisten.
- [x] Seluruh alur migrasi database dijalankan secara otomatis pada pipeline CI/CD saat deploy ke server.
- [x] Fitur relasi To-Do List dengan App Topic (`app_id`) menggunakan `CustomSelect`.
- [x] Subtask bertingkat berfungsi penuh dengan indikator progres dan checkbox reaktif.
- [x] Dark Mode toggle tersimpan di `localStorage` dan terintegrasi dengan skema warna Neo Brutalism.
- [x] PWA terdaftar dengan Service Worker aktif dan caching aset.
- [x] Sistem translasi dwibahasa (ID & EN) tersimpan dalam file JSON terpisah dan bekerja instan di seluruh elemen UI.
- [x] Fitur Ganti Password di halaman profile dengan verifikasi password lama via RPC Supabase `change_user_password`.
- [x] Banner Hero Image pada card aplikasi dengan gambar default Neo Brutalism dan upload khusus `.jpg`, `.jpeg`, `.png`.
- [x] Fitur penataan ulang (rearrange) urutan kartu aplikasi dengan drag-and-drop dan long-press di mode admin.
- [x] Fitur penataan ulang (rearrange) urutan catatan To-Do dengan drag-and-drop dan long-press di mode admin.
- [x] Fitur penataan ulang (rearrange) sub-task dan pemindahan sub-task lintas catatan (cross-parent move) via drag-and-drop.
- [x] Fitur konversi catatan To-Do menjadi sub-task dengan drag-and-drop ke area sub-task catatan lain beserta proteksi validasi.
- [x] Fitur konversi sub-task menjadi catatan To-Do mandiri dengan drag-and-drop keluar dari kontainer parent ke list utama.
- [x] Seluruh 49 skenario automated E2E test cases Playwright lulus pengujian (`bun run test`) dengan auto-cleanup data test.
- [x] Svelte check dan TypeScript compiler bersih dari error maupun warning (`bun run check`).
- [x] Production build berhasil dibuat tanpa kendala (`bun run build`).

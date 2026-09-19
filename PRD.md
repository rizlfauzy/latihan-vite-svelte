# PRD — Svelte Hub App (Product Requirements Document)

## 📌 Executive Summary

**Svelte Hub** adalah aplikasi *personal dashboard & ecosystem portal* modern yang dirancang untuk mengagregasi seluruh aplikasi mikro berbasis Svelte ke dalam satu tempat terpusat. Aplikasi ini mengusung estetika visual **Neo Brutalism** yang tegas, dibangun menggunakan **Svelte 5** dengan paradigma **Runes** (`$state`, `$derived`, `$effect`), dibundel menggunakan **Vite 8**, dan dilengkapi fitur manajemen tugas bertingkat, navigasi SPA, kontrol aplikasi (Tambah, Edit, Hapus) dengan persistensi langsung ke file konfigurasi, sistem notifikasi toast, serta lokalisasi multibahasa (EN & ID).

---

## 🎯 Problem Statement & Goals

### Masalah
- Aplikasi-aplikasi mikro Svelte yang telah dibuat tersebar di berbagai repository dan URL terpisah tanpa satu gerbang akses terpusat.
- Ketiadaan informasi penanggung jawab (PIC) atau kanal komunikasi langsung saat membutuhkan bantuan atau troubleshooting aplikasi tertentu.
- Kebutuhan akan dashboard kerja cepat yang mencakup to-do list harian dengan sub-tasks bertingkat tanpa perlu membuka software pihak ketiga yang berat.
- Kebutuhan manajemen data aplikasi yang mudah diedit langsung saat masa pengembangan tanpa ketergantungan pada database eksternal.

### Tujuan
- **Sentralisasi Akses**: Menyediakan portal hub terpadu dengan navigasi cepat ke seluruh portofolio dan utilitas Svelte.
- **Direct PIC Communication**: Menyediakan tautan WhatsApp terformat otomatis untuk tiap penanggung jawab aplikasi.
- **High Performance & Modern DX**: Menggunakan Svelte 5 runes, Bun runtime, Tailwind CSS v4, dan Zustand vanilla store yang kompatibel dengan Svelte readable store contract.
- **In-Browser App Registry CRUD**: Kemampuan menambah, mengedit, dan menghapus data aplikasi langsung dari antarmuka web yang secara otomatis menyinkronkan data fisik ke `src/data/apps.ts` via middleware Vite saat debug mode aktif.
- **Bilingual Accessibility**: Mendukung penuh Bahasa Indonesia (ID) dan Bahasa Inggris (EN) dengan penyimpanan preferensi di `localStorage`.
- **Quality Assurance**: Memiliki suite pengujian otomatis menyeluruh berbasis Playwright E2E.

---

## 👥 Target User

1. **Core Developer & Administrator**: Mengelola pendaftaran aplikasi, memonitor status lingkungan pengembangan (*Dev Mode*), dan mengelola catatan tugas.
2. **Internal Team & Stakeholders**: Menelusuri aplikasi yang tersedia, melihat profil perusahaan (*Company Profile*), dan menghubungi penanggung jawab teknis via WhatsApp.

---

## 🧱 Core Features & Functional Requirements

### 1. Hub Aplikasi & Link Grid
- Menampilkan kartu-kartu aplikasi dalam tata letak grid responsif Neo Brutalism.
- Setiap kartu menyajikan icon emoji, nama aplikasi, deskripsi, tag kategori, tombol langsung menuju aplikasi, dan tombol kontak PIC via WhatsApp dengan pesan pra-format.
- Menampilkan counter total aplikasi terhubung secara reaktif.

### 2. Manajemen Aplikasi (CRUD) — Debug Mode Gated
- **Add Application**: Modal formulir lengkap untuk mendaftarkan aplikasi baru (Nama, URL, Kategori, Deskripsi, Icon, Tema Warna, PIC, WhatsApp).
- **Edit Application**: Modal pengeditan yang di-prefill dengan data aplikasi terkini untuk memperbarui data aplikasi.
- **Delete Application**: Tombol hapus pada kartu aplikasi yang dilindungi dialog konfirmasi Neo Brutalism untuk mencegah penghapusan tidak disengaja.
- **Direct Disk Persistence**: Operasi tambah, ubah, dan hapus aplikasi dikirimkan ke endpoint `/api/apps` pada Vite development server untuk memodifikasi langsung file `src/data/apps.ts` tanpa localStorage.
- **Mode Debug**: Tombol Tambah, Edit, dan Hapus hanya aktif dan tampil jika `VITE_ENABLE_DEBUG=true`.

### 3. Komponen Alert & Toast Notifikasi Global
- Store global `alertStore` untuk antrean notifikasi reaktif.
- Komponen `AlertContainer` melayang di sudut kanan atas layar (`fixed top-4 right-4 z-50`).
- Mendukung jenis notifikasi: `success` (hijau), `error` (merah), dan `info` (biru).
- Fitur auto-dismiss (3.5 detik) dan tombol penutupan manual `✕`.
- Terintegrasi otomatis pada aksi tambah, edit, dan hapus aplikasi.

### 4. Sticky Navigation & SPA Client Router
- Menggunakan `sv-router` untuk navigasi antar halaman tanpa me-reload browser.
- Halaman yang tersedia:
  - `/` : Dashboard utama (Hero, App Grid, dan To-Do List).
  - `/company-profile` : Halaman profil perusahaan & pilar ekosistem teknologi.
- Komponen `Navbar` dirancang *sticky* (`sticky top-0 z-40 bg-nb-bg/95 backdrop-blur-xs`) agar tetap mudah diakses saat pengguna melakukan scrolling.
- Menu drawer responsif untuk perangkat mobile.

### 5. To-Do List & Sub-Tasks Bertingkat
- Input catatan utama dengan dukungan multi-baris (`Shift + Enter` untuk baris baru, `Enter` untuk menyimpan) dan panduan pintasan keyboard.
- Fitur **Sub-Tasks**: Setiap tugas utama dapat memiliki daftar langkah turunan (*sub-tasks*) yang dapat di-expand/collapse.
- Indikator progres penyelesaian sub-task (`X/Y SUB-TASKS`).
- Toolbar filter (*Semua*, *Belum*, *Selesai*) dan tombol pembersihan tugas tuntas (*Hapus yang Selesai*).
- Dialog konfirmasi hapus modal untuk mencegah kehilangan catatan secara tidak sengaja.
- Data catatan tersimpan secara otomatis dan persisten di `localStorage`.

### 6. Sistem Multibahasa (i18n) Modular
- Mendukung dua bahasa utama: **Bahasa Indonesia (`id`)** dan **Bahasa Inggris (`en`)**.
- Kamus kata tersimpan terpisah dalam file JSON:
  - `src/i18n/id.json`
  - `src/i18n/en.json`
- UI Switcher `[ 🇮🇩 ID | 🇬🇧 EN ]` di Navbar desktop dan mobile menu.
- Mencakup seluruh teks aplikasi: Navigasi, Hero, App Grid, To-Do List & Sub-Tasks, Modal Dialog, Footer, dan Company Profile.
- Pilihan bahasa tersimpan di `localStorage` dan dimuat otomatis saat kunjungan berikutnya.

### 7. Neo Brutalism Design System
- Kontur garis tepi tebal (border hitam solid 2-4px).
- Bayangan keras tanpa blur (*hard-edged box shadows*: `shadow-nb`, `shadow-nb-sm`, `shadow-nb-md`, `shadow-nb-lg`).
- Palet warna kontras tinggi: Yellow (`#FFDE59`), Pink (`#FF577F`), Blue (`#5CE1E6`), Green (`#7ED957`), Purple (`#C084FC`), Orange (`#FF914D`), dan Dark Base (`#121212`).
- Mikro-interaksi taktil: tombol terangkat saat hover (`-translate-x-0.5 -translate-y-0.5`) dan tertekan saat diklik.

---

## 🛠️ Architecture & Tech Stack

| Layer | Komponen / Library | Peran / Deskripsi |
|---|---|---|
| **Framework** | Svelte 5 | Reactive UI dengan Runes (`$state`, `$derived`, `$effect`) |
| **Bundler & Tooling** | Vite 8 + Bun | Fast build tool, HMR, dan package manager |
| **State Management** | Zustand (Vanilla) | Global state untuk `appStore`, `alertStore`, dan `i18nStore` dengan bridge Svelte store contract |
| **Routing** | `sv-router` | Client-side SPA routing (`/` dan `/company-profile`) |
| **Styling** | Tailwind CSS v4 | Utility-first styling dengan custom theme Neo Brutalism |
| **Testing** | Playwright | End-to-end testing menyeluruh (13 test cases) |
| **Localization** | Custom JSON-based i18n | Multi-language translation dictionaries di `src/i18n/*.json` |
| **Containerization** | Docker + Nginx Alpine | Multi-stage build untuk deployment produksi ringan |

---

## 📂 Struktur Direktori Proyek

```text
├── public/
│   ├── favicon.svg              # Favicon tab browser
│   └── logo.svg                 # Logo brand Neo Brutalism
├── src/
│   ├── components/              # Reusable UI components
│   │   ├── AddAppModal.svelte   # Modal form tambah aplikasi baru
│   │   ├── AlertContainer.svelte# Floating alert & toast notification manager
│   │   ├── AppCard.svelte       # Kartu aplikasi interaktif
│   │   ├── AppGrid.svelte       # Grid koleksi aplikasi & modal orchestrator
│   │   ├── ConfirmModal.svelte  # Modal konfirmasi hapus data
│   │   ├── EditAppModal.svelte  # Modal form edit data aplikasi
│   │   ├── Hero.svelte          # Hero branding & tech badges
│   │   ├── Navbar.svelte        # Sticky header navigasi & language switcher
│   │   └── TodoList.svelte      # Catatan cepat & sub-tasks bertingkat
│   ├── data/
│   │   └── apps.ts              # Database fisik aplikasi & kontak PIC
│   ├── i18n/                    # Kamus terjemahan JSON
│   │   ├── en.json              # Kamus Bahasa Inggris
│   │   └── id.json              # Kamus Bahasa Indonesia
│   ├── lib/
│   │   └── env.ts               # Type-safe environment variables helper
│   ├── pages/                   # Halaman aplikasi (SPA routes)
│   │   ├── company-profile/
│   │   │   └── page.svelte      # Halaman profil perusahaan & ekosistem
│   │   └── home/
│   │       └── page.svelte      # Halaman utama (Dashboard)
│   ├── router/
│   │   └── index.ts             # Definisi rute SPA menggunakan sv-router
│   ├── stores/                  # Global state management (Zustand)
│   │   ├── alertStore.ts        # Store antrean notifikasi toast
│   │   ├── appStore.ts          # Store data aplikasi & API client
│   │   └── i18nStore.ts         # Store lokalisasi bahasa reaktif
│   ├── app.css                  # Custom theme tokens Neo Brutalism
│   ├── App.svelte               # Root component & layout wrapper
│   └── main.ts                  # Entry point aplikasi
├── tests/
│   └── hub.spec.ts              # Playwright E2E automated test suite
├── Dockerfile                   # Multi-stage production container build
├── docker-compose.yml           # Docker Compose orchestrator (port 8080)
├── nginx.conf                   # Nginx web server config (SPA rewrite & gzip)
├── prd.md                       # Product Requirements Document
└── README.md                    # Dokumentasi lengkap proyek
```

---

## ✅ Quality & Acceptance Criteria

- [x] Tampilan konsisten bergaya Neo Brutalism di seluruh komponen dan halaman.
- [x] SPA Routing berfungsi mulus tanpa page reload antara Home dan Company Profile.
- [x] Sticky Navbar tetap melayang di atas viewport saat pengguna melakukan scroll.
- [x] Tambah, Edit, dan Hapus aplikasi berfungsi lancar dengan persistensi langsung ke `src/data/apps.ts` saat debug mode aktif.
- [x] Toast alert notifikasi bergaya Neo Brutalism muncul dengan umpan balik sukses/gagal pada setiap mutasi data.
- [x] Catatan To-Do List dan Sub-Tasks bertingkat berfungsi penuh dengan persistensi `localStorage`.
- [x] Shortcut `Shift + Enter` (baris baru) dan `Enter` (simpan) berjalan optimal.
- [x] Sistem translasi dwibahasa (ID & EN) tersimpan dalam file JSON terpisah dan bekerja instan di seluruh elemen UI.
- [x] Seluruh 13 automated E2E test cases Playwright lulus pengujian (`bun run test`).
- [x] Svelte check dan TypeScript compiler bersih dari error maupun warning (`bun run check`).
- [x] Production build berhasil dibuat tanpa kendala (`bun run build`).

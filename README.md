# ⚡ Svelte Hub — Neo Brutalism Personal Dashboard

> **Personal Hub & Dashboard Modern** untuk menghubungkan seluruh portofolio aplikasi mikro berbasis Svelte ke dalam satu tempat terpusat. Dilengkapi manajemen aplikasi langsung (Tambah, Edit, Hapus) dengan persistensi file via server middleware, sistem navigasi SPA, sticky navbar, catatan to-do list bertingkat (*sub-tasks*), sistem notifikasi toast, dukungan multibahasa (EN & ID) berbasis file JSON modular, kontak WhatsApp PIC tiap aplikasi, konfigurasi environment variables dinamis, automated E2E testing dengan Playwright, dan siap dideploy via Docker.

![Svelte 5](https://img.shields.io/badge/Svelte-5.x_Runes-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Zustand](https://img.shields.io/badge/State-Zustand-orange?style=for-the-badge)
![i18n](https://img.shields.io/badge/i18n-EN_%26_ID-1d76db?style=for-the-badge)
![Playwright](https://img.shields.io/badge/Playwright-E2E_Testing-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Design](https://img.shields.io/badge/Style-Neo_Brutalism-FFD000?style=for-the-badge)

---

## 🎨 Fitur Utama

- 🚀 **App Hub Grid**: Menampilkan koleksi aplikasi Svelte dalam tata letak kartu interaktif dengan hard-shadow dan border tegas khas Neo Brutalism.
- ✏️ **Edit & Delete Apps (Debug Mode)**: Fitur pengeditan data aplikasi (`EditAppModal`) dan penghapusan aplikasi langsung dari antarmuka saat mode debug aktif (`VITE_ENABLE_DEBUG=true`).
- 💾 **Direct Disk File Persistence**: Penambahan, pengeditan, dan penghapusan aplikasi langsung memodifikasi file fisik [`src/data/apps.ts`](src/data/apps.ts) melalui endpoint Vite middleware (`/api/apps`).
- 🔔 **Global Toast Alert System**: Komponen notifikasi mengambang di sudut kanan atas dengan status *success*, *error*, dan *info* yang otomatis terpicu saat melakukan aksi pada aplikasi.
- 📌 **Sticky Navbar**: Navigasi atas yang melayang secara persisten (`sticky top-0 z-40`) saat pengguna melakukan scrolling halaman.
- 🌐 **Sistem Multibahasa Modular (i18n)**: Dukungan penuh Bahasa Indonesia (`id`) dan Bahasa Inggris (`en`) yang tersimpan rapi dalam file JSON terpisah ([`src/i18n/id.json`](src/i18n/id.json) & [`src/i18n/en.json`](src/i18n/en.json)), dilengkapi tombol toggle switcher di Navbar.
- 🏢 **Company Profile & SPA Routing**: Navigasi instan tanpa refresh browser menggunakan `sv-router` menuju halaman profil ekosistem dan lab teknologi.
- 💬 **WhatsApp PIC Direct Contact**: Setiap kartu aplikasi dan halaman profil dilengkapi tautan WhatsApp terformat otomatis untuk komunikasi langsung dengan penanggung jawab teknis.
- 📝 **To-Do List & Sub-Tasks Bertingkat**: Manajemen catatan tugas cepat dengan sub-tasks bertingkat, expand/collapse, counter progres (`X/Y`), filter status (*Semua*, *Belum*, *Selesai*), dan persistensi di `localStorage`.
- ⌨️ **Multiline & Keyboard Shortcuts**: Dukungan penulisan multi-baris dengan pintasan `Shift + Enter` (baris baru) dan `Enter` (simpan cepat).
- ⚠️ **Neo Brutalism Confirm Modal**: Pop-up modal konfirmasi hapus interaktif dengan backdrop blur dan dukungan tombol `Escape` untuk mencegah kehilangan data secara tidak sengaja.
- 🎭 **Automated UI Testing**: E2E test suite menggunakan Playwright (13 test cases) untuk memvalidasi alur fungsi, routing, translasi, dan persistensi secara kontinyu.
- 🐳 **Dockerized Production**: Multi-stage build menggunakan Bun dan Nginx Alpine yang ringan, cepat, dan siap dijalankan di lingkungan cloud manapun.

---

## 🛠️ Tech Stack

| Komponen | Teknologi | Deskripsi |
|---|---|---|
| **Framework** | Svelte 5 | Frontend framework reaktif dengan Runes (`$state`, `$derived`, `$effect`) |
| **Bundler** | Vite 8 | Lightning-fast development server & production bundler |
| **State Management** | Zustand (Vanilla) | Global state untuk `appStore`, `alertStore`, dan `i18nStore` |
| **Routing** | `sv-router` | Client-side Single Page Application (SPA) routing |
| **Styling** | Tailwind CSS v4 | Utility-first CSS dengan custom theme tokens Neo Brutalism |
| **Localization** | JSON-based i18n | Kamus kata modular dwibahasa di `src/i18n/*.json` |
| **Testing** | Playwright | E2E browser automation & visual QA test suite |
| **Bahasa** | TypeScript | Type safety & intellisense penuh |
| **Container** | Docker + Nginx | Multi-stage builder & production web server |
| **Package Manager** | Bun | Fast package manager & script runner |

---

## ⚙️ Konfigurasi Environment Variables

Aplikasi mendukung konfigurasi dinamis via environment variables. Salin file template:

```bash
cp .env.example .env
```

Daftar variabel yang tersedia:

| Variabel | Default | Deskripsi |
|---|---|---|
| `VITE_APP_TITLE` | `⚡ Svelte Hub — Personal Dashboard` | Judul aplikasi di browser tab & header |
| `VITE_APP_LOGO_URL` | `/logo.svg` | Path/URL logo yang tampil di tengah halaman |
| `VITE_APP_FAVICON_URL` | `/favicon.svg` | Path/URL favicon tab browser |
| `VITE_APP_ENV` | `development` / `production` | Penanda environment aplikasi |
| `VITE_ENABLE_DEBUG` | `true` / `false` | Mengaktifkan tombol Tambah, Edit, dan Hapus Aplikasi |
| `VITE_API_BASE_URL` | `http://localhost:8888/api` | Base URL endpoint API jika ada backend |

> **Catatan Keamanan:** File `.env` dan `.env.*` (selain `.env.example`) sudah dikecualikan di `.gitignore` untuk mencegah kebocoran konfigurasi kredensial.

---

## 🚀 Memulai (Getting Started)

### Prasyarat
- [Bun](https://bun.sh/) (atau Node.js v18+)
- [Docker](https://www.docker.com/) (opsional, untuk containerization)

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

### 2. Menjalankan UI & E2E Test (Playwright)

```bash
# Jalankan test suite menyeluruh secara headless
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

Aplikasi sudah dilengkapi dengan `Dockerfile` dan `docker-compose.yml` multi-stage:

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
│   └── logo.svg                 # Logo utama Neo Brutalism
├── src/
│   ├── components/              # Komponen antarmuka reusable
│   │   ├── AddAppModal.svelte   # Modal form tambah aplikasi
│   │   ├── AlertContainer.svelte# Global toast alert notification container
│   │   ├── AppCard.svelte       # Kartu aplikasi interaktif
│   │   ├── AppGrid.svelte       # Grid koleksi aplikasi & modal orchestrator
│   │   ├── ConfirmModal.svelte  # Modal konfirmasi hapus data
│   │   ├── EditAppModal.svelte  # Modal form edit data aplikasi
│   │   ├── Hero.svelte          # Hero branding & tech badges
│   │   ├── Navbar.svelte        # Sticky header navigasi & language switcher
│   │   └── TodoList.svelte      # Catatan to-do list & sub-tasks
│   ├── data/
│   │   └── apps.ts              # Database aplikasi & kontak PIC WhatsApp
│   ├── i18n/                    # Kamus translasi JSON
│   │   ├── en.json              # Kamus Bahasa Inggris
│   │   └── id.json              # Kamus Bahasa Indonesia
│   ├── lib/
│   │   └── env.ts               # Type-safe helper environment variables
│   ├── pages/                   # Halaman SPA routes
│   │   ├── company-profile/
│   │   │   └── page.svelte      # Halaman profil perusahaan & ekosistem
│   │   └── home/
│   │       └── page.svelte      # Halaman dashboard utama
│   ├── router/
│   │   └── index.ts             # Konfigurasi client routing sv-router
│   ├── stores/                  # Store Zustand global
│   │   ├── alertStore.ts        # Store antrean notifikasi toast
│   │   ├── appStore.ts          # Store data aplikasi & API client
│   │   └── i18nStore.ts         # Store lokalisasi bahasa reaktif
│   ├── app.css                  # Tailwind CSS v4 & theme tokens Neo Brutalism
│   ├── App.svelte               # Komponen root aplikasi & layout wrapper
│   └── main.ts                  # Entry point aplikasi
├── tests/
│   └── hub.spec.ts              # Test suite Playwright E2E
├── playwright.config.ts         # Konfigurasi Playwright test runner
├── Dockerfile                   # Multi-stage Docker configuration
├── docker-compose.yml           # Docker Compose spec (port 8080)
├── nginx.conf                   # Nginx SPA config dengan caching & gzip
├── .env.example                 # Contoh template konfigurasi environment
├── prd.md                       # Product Requirements Document
└── README.md                    # Dokumentasi lengkap proyek
```

---

## 📜 Lisensi & Kontributor

Dikembangkan oleh **[Rizal Fauzi](https://github.com/rizlfauzy)**.
Open source untuk keperluan belajar dan eksplorasi ekosistem Svelte.

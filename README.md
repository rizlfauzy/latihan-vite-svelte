# ⚡ Svelte Hub — Neo Brutalism Personal Dashboard

> **Personal Hub & Dashboard** untuk menghubungkan semua aplikasi berbasis Svelte yang pernah dibuat ke dalam satu tempat terpusat, dilengkapi catatan cepat / to-do list bertingkat (sub-tasks), kontak WhatsApp PIC tiap aplikasi, konfigurasi environment variables, automated testing dengan Playwright, dan siap dijalankan dengan Docker.

![Svelte 5](https://img.shields.io/badge/Svelte-5.x-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-E2E_Testing-2EAD33?style=for-the-badge&logo=playwright&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Design](https://img.shields.io/badge/Style-Neo_Brutalism-FFD000?style=for-the-badge)

---

## 🎨 Fitur Utama

- 🚀 **App Hub Grid**: Menampilkan koleksi aplikasi Svelte dalam tata letak kartu interaktif dengan animasi dan hard-shadow khas Neo Brutalism.
- 💬 **WhatsApp PIC Contact**: Setiap kartu aplikasi dilengkapi nama penanggung jawab (PIC) dan tombol direct WhatsApp untuk tanya jawab / troubleshooting.
- 🎯 **Hero Branding & Dynamic Env**: Logo tengah, favicon, dan title aplikasi dapat diganti dinamis lewat Environment Variables (`.env`).
- 🛠️ **Dev Mode Indicator**: Indikator visual real-time saat aplikasi berjalan di mode development.
- 📝 **To-Do List & Sub-Tasks**: Fitur manajemen catatan/tugas cepat dengan sub-tasks bertingkat, expand/collapse, counter progres sub-task (`X/Y`), filter status (*Semua*, *Belum*, *Selesai*), dan persistensi otomatis di `localStorage`.
- ⌨️ **Multiline & Keyboard Shortcuts**: Dukungan input multi-baris dengan shortcut `Shift + Enter` (baris baru) dan `Enter` (simpan cepat) disertai teks panduan intuitif.
- ⚠️ **Neo Brutalism Confirm Modal**: Pop-up modal konfirmasi hapus interaktif dengan backdrop blur dan dukungan tombol `Escape` untuk mencegah kehilangan data secara tidak sengaja.
- 🎭 **Automated UI Testing**: E2E automated test suite menggunakan Playwright untuk menjamin keandalan antarmuka dan interaktivitas.
- ⚡ **Neo Brutalism Aesthetic**: Desain visual unik dengan border tebal (solid black), shadow tajam tanpa blur, warna-warna kontras cerah, dan tipografi ekspresif.
- 🐳 **Dockerized Production**: Multi-stage build menggunakan Bun dan Nginx Alpine yang sangat ringan dan cepat.

---

## 🛠️ Tech Stack

| Komponen | Teknologi | Deskripsi |
|---|---|---|
| **Framework** | Svelte 5 | Frontend framework reaktif dengan Runes (`$state`, `$derived`, `$effect`) |
| **Bundler** | Vite 8 | Lightning-fast development & build tool |
| **Styling** | Tailwind CSS v4 | Utility-first CSS framework dengan kustom `@theme` Neo Brutalism |
| **Testing** | Playwright | E2E & UI browser automation test suite |
| **Bahasa** | TypeScript | Type safety & intellisense |
| **Penyimpanan** | LocalStorage | Persistensi data catatan tanpa perlu database server |
| **Container** | Docker + Nginx | Multi-stage builder & production web server |
| **Package Manager** | Bun | Fast package manager & script runner |

---

## ⚙️ Konfigurasi Environment Variables

Aplikasi mendukung konfigurasi dinamis via environment variables. Salin file template:

```bash
cp .env.example .env
```

Isi variabel yang tersedia:

| Variabel | Default | Deskripsi |
|---|---|---|
| `VITE_APP_TITLE` | `⚡ Svelte Hub — Personal Dashboard` | Judul aplikasi di browser tab & header |
| `VITE_APP_LOGO_URL` | `/logo.svg` | Path/URL logo yang tampil di tengah halaman |
| `VITE_APP_FAVICON_URL` | `/favicon.svg` | Path/URL favicon tab browser |
| `VITE_APP_ENV` | `development` / `production` | Penanda environment aplikasi |
| `VITE_ENABLE_DEBUG` | `true` / `false` | Menampilkan log debug di browser console |
| `VITE_API_BASE_URL` | `http://localhost:8888/api` | Base URL endpoint API jika ada backend |

> **Catatan Keamanan:** File `.env` dan `.env.*` (selain `.env.example`) sudah dikecualikan di `.gitignore` untuk mencegah kebocoran konfigurasi.

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

Aplikasi akan berjalan di `http://localhost:8888` (atau port yang ditentukan Vite).

---

### 2. Menjalankan UI Test (Playwright)

```bash
# Jalankan test suite secara headless
bun run test

# Jalankan test dengan visual UI mode
bun run test:ui
```

---

### 3. Build untuk Production

```bash
# Type check & bundle build
bun run check
bun run build

# Preview build lokal
bun run preview
```

Output static file akan digenerate ke folder `dist/`.

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
│   ├── favicon.svg       # Favicon tab browser
│   └── logo.svg          # Logo utama Neo Brutalism
├── src/
│   ├── assets/           # Aset statis & logo
│   ├── data/
│   │   └── apps.ts       # Konfigurasi daftar aplikasi hub & PIC WhatsApp
│   ├── lib/
│   │   ├── env.ts           # Type-safe helper environment variables
│   │   ├── AppCard.svelte   # Kartu aplikasi interaktif + kontak PIC WA
│   │   ├── AppGrid.svelte   # Grid kumpulan aplikasi
│   │   ├── Hero.svelte      # Hero section dengan logo di tengah
│   │   └── TodoList.svelte  # Widget to-do list & sub-tasks
│   ├── app.css           # Tailwind CSS v4 & theme tokens Neo Brutalism
│   ├── App.svelte        # Komponen root aplikasi & dev indicator
│   └── main.ts           # Entry point aplikasi
├── tests/
│   └── hub.spec.ts       # Test suite Playwright e2e
├── playwright.config.ts  # Konfigurasi Playwright test runner
├── Dockerfile            # Multi-stage Docker configuration
├── docker-compose.yml    # Docker Compose spec (port 8080)
├── nginx.conf            # Nginx SPA config dengan caching & gzip
├── .env.example          # Contoh template konfigurasi environment
├── PRD.md                # Product Requirements Document
└── README.md             # Dokumentasi proyek
```

---

## ➕ Cara Menambah Aplikasi Baru ke Hub

Buka file [`src/data/apps.ts`](src/data/apps.ts) dan tambahkan item baru ke dalam array `svelteApps`:

```typescript
{
  id: "nama-app-unik",
  name: "Nama Aplikasi Kamu",
  description: "Deskripsi singkat tentang aplikasi.",
  url: "https://url-aplikasi-kamu.com",
  icon: "🚀", // Emoji atau icon
  category: "Productivity", // Kategori app
  color: "var(--color-nb-yellow)", // var(--color-nb-pink) / var(--color-nb-blue)
  picName: "Nama PIC", // Nama penanggung jawab
  picWhatsapp: "6281234567890" // Nomor WA format internasional
}
```

---

## 📜 Lisensi & Kontributor

Dikembangkan oleh **[Rizal Fauzi](https://github.com/rizlfauzy)**.
Open source untuk keperluan belajar dan eksplorasi ekosistem Svelte.

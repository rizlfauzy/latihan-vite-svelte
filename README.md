# ⚡ Svelte Hub — Neo Brutalism Personal Dashboard

> **Personal Hub & Dashboard** untuk menghubungkan semua aplikasi berbasis Svelte yang pernah dibuat ke dalam satu tempat terpusat, dilengkapi catatan cepat / to-do list, dan siap dijalankan dengan Docker.

![Svelte 5](https://img.shields.io/badge/Svelte-5.x-FF3E00?style=for-the-badge&logo=svelte&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)
![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)
![Design](https://img.shields.io/badge/Style-Neo_Brutalism-FFD000?style=for-the-badge)

---

## 🎨 Fitur Utama

- 🚀 **App Hub Grid**: Menampilkan koleksi aplikasi Svelte dalam tata letak kartu interaktif dengan animasi dan hard-shadow khas Neo Brutalism.
- 🎯 **Hero Branding**: Logo custom di tengah halaman, badge status, dan favicon tab yang sinkron.
- 📝 **To-Do List & Quick Notes**: Fitur manajemen catatan/tugas cepat dengan filter (*Semua*, *Belum*, *Selesai*) dan persistensi otomatis di `localStorage`.
- ⚡ **Neo Brutalism Aesthetic**: Desain visual unik dengan border tebal (solid black), shadow tajam tanpa blur, warna-warna kontras cerah, dan tipografi ekspresif.
- 🐳 **Dockerized Production**: Multi-stage build menggunakan Bun dan Nginx Alpine yang sangat ringan dan cepat.

---

## 🛠️ Tech Stack

| Komponen | Teknologi | Deskripsi |
|---|---|---|
| **Framework** | Svelte 5 | Frontend framework reaktif dengan Runes (`$state`, `$derived`, `$effect`) |
| **Bundler** | Vite 8 | Lightning-fast development & build tool |
| **Bahasa** | TypeScript | Type safety & intellisense |
| **Styling** | Plain CSS | Custom Neo Brutalism design system tokens |
| **Penyimpanan** | LocalStorage | Persistensi data catatan tanpa perlu database server |
| **Container** | Docker + Nginx | Multi-stage builder & production web server |
| **Package Manager** | Bun | Fast package manager & script runner |

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

### 2. Build untuk Production

```bash
# Type check & bundle build
bun run check
bun run build

# Preview build lokal
bun run preview
```

Output static file akan digenerate ke folder `dist/`.

---

### 3. Jalankan via Docker

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
│   │   └── apps.ts       # Konfigurasi data daftar aplikasi hub
│   ├── lib/
│   │   ├── AppCard.svelte   # Kartu aplikasi interaktif
│   │   ├── AppGrid.svelte   # Grid kumpulan aplikasi
│   │   ├── Hero.svelte      # Hero section dengan logo di tengah
│   │   └── TodoList.svelte  # Widget to-do list & quick notes
│   ├── app.css           # Design system tokens & utility classes Neo Brutalism
│   ├── App.svelte        # Komponen root aplikasi
│   └── main.ts           # Entry point aplikasi
├── Dockerfile            # Multi-stage Docker configuration
├── docker-compose.yml    # Docker Compose spec (port 8080)
├── nginx.conf            # Nginx SPA config dengan caching & gzip
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
  category: "Kategori", // e.g. Tools, Game, Portfolio
  color: "var(--nb-yellow)" // var(--nb-pink) / var(--nb-blue) / var(--nb-green)
}
```

---

## 📜 Lisensi & Kontributor

Dikembangkan oleh **[Rizal Fauzi](https://github.com/rizlfauzy)**.
Open source untuk keperluan belajar dan eksplorasi ekosistem Svelte.

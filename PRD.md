# PRD — Svelte Hub App

## Overview

Aplikasi **personal hub/dashboard** yang berfungsi sebagai "pintu masuk" ke semua aplikasi Svelte yang pernah dibuat. Dibangun pakai **Vite + Svelte 5**, di-deploy via **Docker**, dan punya design bergaya **Neo Brutalism**.

## Problem Statement

Aplikasi-aplikasi Svelte yang udah dibuat tersebar dan nggak punya satu tempat terpusat buat diakses. Butuh satu hub yang bisa:
- Menampilkan daftar link ke semua apps
- Jadi tempat catatan / to-do list cepat
- Gampang di-deploy di mana aja pakai Docker

## Target User

Developer (diri sendiri) yang butuh satu halaman dashboard buat akses cepat ke project-project Svelte.

## Core Features

### 1. App Hub / Link Grid
- Halaman utama menampilkan grid/list dari aplikasi-aplikasi Svelte yang pernah dibuat
- Setiap app card bisa diklik dan redirect ke URL app tersebut
- Data apps disimpan di file config / JSON sederhana (static, tanpa backend)

### 2. Logo & Branding
- Logo aplikasi ditampilkan di **tengah halaman** (hero section)
- Custom **favicon** untuk browser tab icon
- Branding konsisten dengan style Neo Brutalism

### 3. To-Do List / Quick Notes
- Fitur catatan sederhana bergaya to-do list
- Bisa tambah, centang (toggle done), dan hapus item
- Data disimpan di **localStorage** (no backend needed)

### 4. Neo Brutalism Design
- Bold borders, thick outlines (2-4px solid black)
- Warna-warna solid & cerah (kuning, pink, biru, hijau mint)
- Shadow hard/offset (box-shadow tanpa blur)
- Font bold / monospace accent
- Flat, no gradient, raw aesthetic

### 5. Docker Support
- `Dockerfile` multi-stage: build → serve via nginx
- `docker-compose.yml` untuk gampang jalanin
- Expose di port yang configurable (default 8080)

### 6. GitHub Repository
- Repo dibuat pakai `gh` CLI dengan nama **`latihan-vite-svelte`**
- Push initial codebase ke repo
- README.md yang jelas cara run (dev, build, docker)

## Tech Stack

| Layer       | Tech                    |
| ----------- | ----------------------- |
| Framework   | Svelte 5                |
| Bundler     | Vite 8                  |
| Language    | TypeScript              |
| Styling     | Plain CSS (Neo Brutalism custom) |
| Storage     | localStorage            |
| Container   | Docker + nginx           |
| Repo        | GitHub (`gh` CLI)       |
| Package Mgr | bun (existing setup)    |

## Non-Goals (Out of Scope)
- Backend / API server
- Auth / login
- Database
- SSR / SvelteKit migration
- Responsive mobile-first (nice to have, tapi bukan priority)

## Success Criteria
- [ ] Bisa akses hub di browser, lihat semua apps dalam grid
- [ ] Logo tampil di hero, favicon tampil di tab
- [ ] To-do list functional (add, toggle, delete) — data persist di localStorage
- [ ] Design konsisten Neo Brutalism
- [ ] `docker compose up` → app jalan di browser
- [ ] Repo `latihan-vite-svelte` ada di GitHub

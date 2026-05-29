# WapKidLearn

Platform belajar matematika untuk anak berbasis reward. Anak menjawab soal matematika, mendapat poin, lalu menukar poin menjadi waktu menonton video. Orang tua mengontrol semua aturan reward dari dashboard mereka.

Didesain ringan untuk dijalankan di **STB (Set-Top Box)** rumahan via Docker Compose dan diakses publik melalui Cloudflare Tunnel.

---

## Fitur Utama

| Role | Fitur |
|------|-------|
| **Anak** | Main game matematika, kumpulkan poin, konversi ke waktu nonton, lihat reward & streak |
| **Orang Tua** | Kelola anak, atur rate konversi, batas nonton harian, jam boleh nonton, emergency lock |
| **Super Admin** | CRUD soal matematika, moderasi video, kelola user |

---

## Stack Teknologi

| Layer | Teknologi |
|-------|-----------|
| Backend | Go 1.22 + Fiber v2 |
| Database | PostgreSQL 16 |
| Query | sqlc + pgx/v5 |
| Frontend | Next.js 14 (App Router) + Tailwind CSS + shadcn/ui |
| Auth | JWT (golang-jwt) + HttpOnly cookie |
| Container | Docker Compose |
| Tunnel | Cloudflare Tunnel |

### Estimasi RAM di STB (2GB)

| Service | Estimasi |
|---------|----------|
| Go API binary | ~30–80 MB |
| PostgreSQL | ~150–300 MB |
| Next.js (Node) | ~150–250 MB |
| OS + Cloudflare Tunnel | ~300 MB |
| **Total** | **~630 MB – 1 GB** |

---

## Prasyarat

- Go 1.22+
- Node.js 20+
- Docker & Docker Compose
- [golang-migrate](https://github.com/golang-migrate/migrate) CLI
- [sqlc](https://sqlc.dev) CLI
- [air](https://github.com/air-verse/air) (live reload Go)

Install semua sekaligus:

```bash
make install-tools
make install-frontend
```

---

## Memulai Development

### 1. Clone & konfigurasi environment

```bash
git clone <repo-url> wapkidlearn
cd wapkidlearn
cp .env.example .env
# Edit .env sesuai kebutuhan
```

### 2. Jalankan PostgreSQL

```bash
make docker-up
```

### 3. Jalankan migrasi database

```bash
make migrate
```

### 4. (Opsional) Seed data development

```bash
make seed
```

### 5. Jalankan backend + frontend

```bash
# Keduanya sekaligus (butuh GNU parallel atau tmux)
make dev

# Atau jalankan terpisah di dua terminal:
make dev-backend    # http://localhost:8080
make dev-frontend   # http://localhost:3000
```

---

## Struktur Project

```
wapkidlearn/
├── backend/                    # Go API (Fiber v2)
│   ├── cmd/api/main.go
│   ├── internal/
│   │   ├── auth/               # Login, JWT, middleware
│   │   ├── game/               # Sesi game, soal, jawaban
│   │   ├── points/             # Wallet, transaksi, konversi
│   │   ├── videos/             # Manajemen video & watch session
│   │   ├── parent/             # Kontrol orang tua
│   │   ├── admin/              # Admin panel
│   │   └── database/           # pgx pool + sqlc generated
│   ├── pkg/                    # Utility: jwt, validator, ratelimit, response
│   ├── sqlc.yaml
│   ├── go.mod
│   ├── .air.toml               # Live reload config
│   └── Dockerfile
│
├── frontend/                   # Next.js 14 PWA
│   ├── app/
│   │   ├── (auth)/             # Login page, PIN pad anak
│   │   ├── (admin)/            # Dashboard admin
│   │   ├── (parent)/           # Dashboard orang tua
│   │   └── (child)/            # Layar anak: game, reward, video
│   ├── components/
│   ├── lib/                    # API client, auth helper, hooks
│   └── public/                 # manifest.json, service worker, icons
│
├── database/
│   └── migrations/             # File migrasi berurutan (001–009 + seed)
│
├── docker-compose.yml          # Dev: postgres only
├── docker-compose.prod.yml     # Prod: postgres + api + frontend
├── Makefile
└── .env.example
```

---

## Database Migration

Setiap perubahan skema database **wajib** menggunakan file migrasi baru.

```bash
# Jalankan semua pending migration
make migrate

# Rollback 1 migration terakhir
make migrate-down

# Cek versi migration saat ini
make migrate-status

# Reset semua (dev only — ada konfirmasi)
make migrate-reset
```

### Menambah Migration Baru

```bash
# Buat file baru secara manual dengan format: NNN_nama_perubahan.sql
# Contoh:
touch database/migrations/010_add_login_attempts.sql
# Tulis SQL di file tersebut, lalu:
make migrate
```

> Jangan pernah mengedit file migrasi yang sudah dijalankan di production. Selalu buat file baru.

---

## Makefile — Semua Target

```bash
make help             # Tampilkan semua target

# Development
make dev              # Backend + frontend bersamaan
make dev-backend      # Backend saja (hot-reload)
make dev-frontend     # Frontend saja

# Build
make build            # Build semua untuk production
make build-backend    # Build Go binary → dist/api
make build-frontend   # Build Next.js

# Database
make migrate          # Jalankan pending migrations
make migrate-down     # Rollback 1 migration
make migrate-status   # Cek versi saat ini
make migrate-reset    # Reset semua (dev only)
make seed             # Seed data development

# Code generation
make sqlc-gen         # Generate Go code dari SQL query

# Test & Lint
make test             # Unit test
make test-coverage    # Test + laporan coverage
make lint             # Lint backend (golangci-lint)
make lint-frontend    # Lint frontend (ESLint)

# Docker
make docker-up        # Dev: jalankan postgres
make docker-up-prod   # Prod: jalankan semua service
make docker-down      # Stop semua container
make docker-logs      # Stream semua log
make docker-build     # Build ulang semua image

# Utilities
make install-tools    # Install air, migrate, sqlc, golangci-lint
make install-frontend # npm install frontend
make tidy             # go mod tidy
make clean            # Hapus build artifacts
```

---

## API Endpoints

### Auth
```
POST /api/v1/auth/login           # Parent / Admin login
POST /api/v1/auth/child/login     # Child PIN login
POST /api/v1/auth/refresh         # Refresh token
POST /api/v1/auth/logout
```

### Game
```
POST   /api/v1/game/sessions
GET    /api/v1/game/sessions/:id/question
POST   /api/v1/game/sessions/:id/answer
POST   /api/v1/game/sessions/:id/end
GET    /api/v1/game/sessions/:id/summary
```

### Points
```
GET  /api/v1/points/wallet
POST /api/v1/points/convert
GET  /api/v1/points/transactions
```

### Videos & Watch Sessions
```
GET    /api/v1/videos
POST   /api/v1/videos
DELETE /api/v1/videos/:id
PATCH  /api/v1/videos/:id/approve
PATCH  /api/v1/videos/:id/reject

POST   /api/v1/watch-sessions
PATCH  /api/v1/watch-sessions/:id/heartbeat
DELETE /api/v1/watch-sessions/:id
```

### Parent
```
GET    /api/v1/parent/children
POST   /api/v1/parent/children
PUT    /api/v1/parent/children/:id/settings
POST   /api/v1/parent/children/:id/lock
DELETE /api/v1/parent/children/:id/lock
GET    /api/v1/parent/children/:id/analytics
```

### Admin
```
GET    /api/v1/admin/questions
POST   /api/v1/admin/questions
PUT    /api/v1/admin/questions/:id
DELETE /api/v1/admin/questions/:id
GET    /api/v1/admin/videos
GET    /api/v1/admin/users
PATCH  /api/v1/admin/users/:id/toggle
```

---

## Deploy ke STB (Production)

### 1. Siapkan file environment

```bash
cp .env.example .env
# Isi DB_PASSWORD, JWT_SECRET, ALLOWED_ORIGINS, NEXT_PUBLIC_API_URL
```

### 2. Jalankan production stack

```bash
make docker-up-prod
# atau
docker compose -f docker-compose.prod.yml up -d
```

### 3. Setup Cloudflare Tunnel

```bash
cloudflared tunnel login
cloudflared tunnel create wapkidlearn

# ~/.cloudflared/config.yml
# tunnel: <tunnel-id>
# credentials-file: /root/.cloudflared/<tunnel-id>.json
# ingress:
#   - hostname: wapkidlearn.yourdomain.com
#     service: http://localhost:3000
#   - service: http_status:404

cloudflared tunnel run wapkidlearn
```

### 4. Setup backup otomatis (crontab di STB)

```bash
# crontab -e
0 2 * * * docker exec wapkidlearn_postgres_1 pg_dump -U wapkidlearn wapkidlearn_db | gzip > /backup/wkl_$(date +\%Y\%m\%d).sql.gz
0 3 * * * find /backup -name "*.sql.gz" -mtime +7 -delete
```

---

## Keamanan

| Ancaman | Mitigasi |
|---------|----------|
| JWT theft | HttpOnly cookie, SameSite=Strict |
| Brute force | 5 attempt → lockout 15 menit |
| IDOR | Ownership check setiap resource |
| XSS | CSP header, Next.js auto-escape |
| Replay attack | Nonce per soal, single-use, exp 60s |
| SQL injection | pgx parameterized query / sqlc |
| Timer manipulation | Server source of truth |
| URL injection | Domain whitelist |
| Race condition | SELECT FOR UPDATE pada wallet |

---

## Rumus Poin

```
base_points           = 10
difficulty_multiplier = [1.0, 1.2, 1.5, 2.0, 2.5]  (level 1–5)
time_bonus            = max(0, floor((limit - taken) / limit × 5))
streak_bonus          = min(streak × 0.1, 0.5)

final = floor(base × multiplier × (1 + streak_bonus) + time_bonus)
```

Contoh: level 3, selesai dalam 8s dari limit 20s, streak 4 hari:
```
floor(10 × 1.5 × 1.4 + 3) = 24 poin
```

---

## Lisensi

Private project — penggunaan terbatas untuk keluarga.

# Development Plan — WapKidLearn (STB Edition)
# Golang + PostgreSQL + Next.js PWA

**Version:** 1.0.0  
**Target:** 3 users, deploy di STB via Docker Compose + Cloudflare Tunnel  
**Last Updated:** 2026-05-29

---

## 1. Stack

| Layer | Teknologi | Alasan |
|-------|-----------|--------|
| Backend | Go 1.22 + Fiber v2 | Ringan, binary tunggal, RAM rendah, performa tinggi |
| Database | PostgreSQL 16 | Satu-satunya storage, tidak perlu Redis |
| ORM/Query | sqlc + pgx/v5 | Type-safe, tidak ada reflection overhead |
| Frontend | Next.js 14 (App Router) | PWA support, satu app untuk semua role |
| Styling | Tailwind CSS + shadcn/ui | Cepat, tidak perlu custom CSS banyak |
| Auth | JWT (golang-jwt) + HttpOnly cookie | Kontrol penuh, tidak ada dependency eksternal |
| Container | Docker Compose | Deploy simpel di STB |
| Tunnel | Cloudflare Tunnel | Sudah familiar, tidak perlu static IP |

### Estimasi RAM Usage di STB

| Service | Estimasi |
|---------|---------|
| Go API binary | ~30–80MB |
| PostgreSQL | ~150–300MB |
| Next.js (Node) | ~150–250MB |
| OS + Cloudflare tunnel | ~300MB |
| **Total** | **~630MB–1GB** |

Masih aman di 2GB. Jauh lebih ringan dari NestJS + Redis.

---

## 2. Struktur Project

```
wapkidlearn/
├── backend/                    # Go API
│   ├── cmd/
│   │   └── api/
│   │       └── main.go
│   ├── internal/
│   │   ├── auth/
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   └── middleware.go
│   │   ├── game/
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   └── repository.go
│   │   ├── points/
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   └── repository.go
│   │   ├── videos/
│   │   │   ├── handler.go
│   │   │   ├── service.go
│   │   │   └── repository.go
│   │   ├── parent/
│   │   │   ├── handler.go
│   │   │   └── service.go
│   │   ├── admin/
│   │   │   ├── handler.go
│   │   │   └── service.go
│   │   └── database/
│   │       ├── db.go           # pgx pool setup
│   │       ├── queries/        # sqlc generated
│   │       └── migrations/
│   ├── pkg/
│   │   ├── jwt/
│   │   ├── validator/
│   │   ├── ratelimit/          # in-memory rate limiter
│   │   └── response/           # standard JSON response helper
│   ├── sqlc.yaml
│   ├── go.mod
│   ├── go.sum
│   └── Dockerfile
│
├── frontend/                   # Next.js
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   └── child-login/    # PIN pad
│   │   ├── (admin)/
│   │   │   ├── dashboard/
│   │   │   ├── questions/
│   │   │   └── videos/
│   │   ├── (parent)/
│   │   │   ├── dashboard/
│   │   │   ├── children/
│   │   │   │   └── [id]/
│   │   │   │       ├── settings/
│   │   │   │       ├── videos/
│   │   │   │       └── analytics/
│   │   │   └── layout.tsx
│   │   ├── (child)/
│   │   │   ├── home/
│   │   │   ├── game/
│   │   │   ├── rewards/
│   │   │   ├── watch/
│   │   │   │   └── [sessionId]/
│   │   │   └── layout.tsx
│   │   ├── layout.tsx
│   │   └── page.tsx            # redirect berdasarkan role
│   ├── components/
│   │   ├── game/
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── AnswerOptions.tsx
│   │   │   └── TimerBar.tsx
│   │   ├── video/
│   │   │   ├── VideoPlayer.tsx  # handle youtube/mp4/vimeo
│   │   │   └── WatchTimer.tsx
│   │   ├── points/
│   │   │   └── ConvertSlider.tsx
│   │   └── ui/                 # shadcn components
│   ├── lib/
│   │   ├── api.ts              # fetch wrapper
│   │   ├── auth.ts             # token management
│   │   └── hooks/
│   ├── public/
│   │   ├── manifest.json
│   │   ├── sw.js               # service worker
│   │   ├── icon-192.png
│   │   └── icon-512.png
│   ├── next.config.ts
│   ├── tailwind.config.ts
│   └── package.json
│
├── database/
│   └── migrations/
│       ├── 001_create_users.sql
│       ├── 002_create_profiles.sql
│       ├── 003_create_game.sql
│       ├── 004_create_points.sql
│       ├── 005_create_videos.sql
│       ├── 006_create_watch.sql
│       ├── 007_create_streaks.sql
│       ├── 008_create_nonces.sql
│       ├── 009_add_indexes.sql
│       └── seed.sql
│
├── docker-compose.yml
├── docker-compose.prod.yml
└── .env.example
```

---

## 3. Docker Compose

```yaml
# docker-compose.prod.yml
version: '3.9'

services:
  postgres:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: ${DB_NAME}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/migrations:/docker-entrypoint-initdb.d
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${DB_USER}"]
      interval: 10s
      timeout: 5s
      retries: 5

  api:
    build: ./backend
    restart: unless-stopped
    environment:
      DATABASE_URL: postgres://${DB_USER}:${DB_PASSWORD}@postgres:5432/${DB_NAME}
      JWT_SECRET: ${JWT_SECRET}
      ALLOWED_ORIGINS: ${FRONTEND_URL}
      PORT: 8080
    depends_on:
      postgres:
        condition: service_healthy
    ports:
      - "8080:8080"

  frontend:
    build: ./frontend
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL}
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

```bash
# .env.example
DB_USER=mathquest
DB_PASSWORD=ganti_ini_dengan_password_kuat
DB_NAME=mathquest_db
JWT_SECRET=ganti_ini_dengan_random_string_panjang
FRONTEND_URL=https://mathquest.yourdomain.com
API_URL=https://mathquest.yourdomain.com/api/v1
```

---

## 4. Cloudflare Tunnel Setup

```bash
# Di STB (sudah familiar dari n8n)
# 1. Install cloudflared (jika belum)
# 2. Login
cloudflared tunnel login

# 3. Buat tunnel
cloudflared tunnel create mathquest

# 4. Config file: ~/.cloudflared/config.yml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json

ingress:
  - hostname: mathquest.yourdomain.com
    service: http://localhost:3000
  - hostname: api.mathquest.yourdomain.com
    service: http://localhost:8080
  - service: http_status:404

# 5. Jalankan
cloudflared tunnel run mathquest
```

Atau jika mau satu domain saja (lebih simpel), Next.js proxy ke API:

```typescript
// next.config.ts
async rewrites() {
  return [
    {
      source: '/api/v1/:path*',
      destination: 'http://api:8080/api/v1/:path*',
    },
  ]
}
```

Dengan ini hanya butuh satu domain, Cloudflare Tunnel hanya expose port 3000.

---

## 5. Go Backend — Struktur Kode

### main.go

```go
package main

import (
    "log"
    "os"

    "github.com/gofiber/fiber/v2"
    "github.com/gofiber/fiber/v2/middleware/cors"
    "github.com/gofiber/fiber/v2/middleware/logger"
    "github.com/gofiber/fiber/v2/middleware/recover"

    "wapkidlearn/internal/auth"
    "wapkidlearn/internal/game"
    "wapkidlearn/internal/points"
    "wapkidlearn/internal/videos"
    "wapkidlearn/internal/parent"
    "wapkidlearn/internal/admin"
    "wapkidlearn/internal/database"
)

func main() {
    db := database.Connect(os.Getenv("DATABASE_URL"))
    defer db.Close()

    app := fiber.New(fiber.Config{
        AppName: "WapKidLearn API v1.0",
    })

    app.Use(logger.New())
    app.Use(recover.New())
    app.Use(cors.New(cors.Config{
        AllowOrigins:     os.Getenv("ALLOWED_ORIGINS"),
        AllowMethods:     "GET,POST,PUT,PATCH,DELETE",
        AllowCredentials: true,
    }))

    app.Get("/health", func(c *fiber.Ctx) error {
        return c.SendString("ok")
    })

    v1 := app.Group("/api/v1")
    auth.NewHandler(db).Register(v1.Group("/auth"))
    game.NewHandler(db).Register(v1.Group("/game"))
    points.NewHandler(db).Register(v1.Group("/points"))
    videos.NewHandler(db).Register(v1.Group("/videos"))
    videos.NewWatchHandler(db).Register(v1.Group("/watch-sessions"))
    parent.NewHandler(db).Register(v1.Group("/parent"))
    admin.NewHandler(db).Register(v1.Group("/admin"))

    port := os.Getenv("PORT")
    if port == "" {
        port = "8080"
    }
    log.Printf("Server running on :%s", port)
    log.Fatal(app.Listen(":" + port))
}
```

### Contoh: points/service.go (dengan race condition handling)

```go
func (s *Service) ConvertPoints(ctx context.Context, childID string, points int, idempotencyKey string) (*ConversionResult, error) {
    // 1. Cek idempotency dulu (sebelum lock)
    existing, err := s.repo.FindTransactionByIdempotencyKey(ctx, idempotencyKey)
    if err == nil && existing != nil {
        return mapToResult(existing), nil
    }

    // 2. Validasi policy parent
    settings, err := s.repo.GetParentSettings(ctx, childID)
    if err != nil {
        return nil, err
    }
    if err := s.validatePolicy(settings, points); err != nil {
        return nil, err
    }

    // 3. Transaksi DB dengan row lock
    tx, err := s.db.Begin(ctx)
    if err != nil {
        return nil, err
    }
    defer tx.Rollback(ctx)

    // SELECT ... FOR UPDATE mencegah concurrent deduction
    wallet, err := s.repo.LockWalletForUpdate(ctx, tx, childID)
    if err != nil {
        return nil, err
    }

    if wallet.Balance < int32(points) {
        return nil, ErrInsufficientBalance
    }

    watchSeconds := int32(points / settings.ConversionRate * 60)

    if err := s.repo.DeductPoints(ctx, tx, wallet.ID, int32(points), idempotencyKey); err != nil {
        return nil, err
    }
    if err := s.repo.AddWatchTime(ctx, tx, childID, watchSeconds); err != nil {
        return nil, err
    }

    if err := tx.Commit(ctx); err != nil {
        return nil, err
    }

    return &ConversionResult{
        PointsSpent:          points,
        WatchTimeAddedSeconds: int(watchSeconds),
    }, nil
}
```

---

## 6. Frontend — Komponen Kritis

### VideoPlayer.tsx

```tsx
type VideoType = 'youtube' | 'vimeo' | 'mp4'

interface VideoPlayerProps {
  url: string
  videoType: VideoType
  timeRemaining: number
  onHeartbeat: (elapsed: number) => void
  onTimeExpired: () => void
}

export function VideoPlayer({ url, videoType, timeRemaining, onHeartbeat, onTimeExpired }: VideoPlayerProps) {
  const [remaining, setRemaining] = useState(timeRemaining)
  const lastHeartbeat = useRef(Date.now())

  // Heartbeat setiap 30 detik
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - lastHeartbeat.current) / 1000)
      lastHeartbeat.current = Date.now()
      onHeartbeat(elapsed)
      setRemaining(prev => {
        const next = prev - elapsed
        if (next <= 0) {
          onTimeExpired()
          return 0
        }
        return next
      })
    }, 30000)
    return () => clearInterval(interval)
  }, [])

  // Pause saat tab tidak aktif
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden) {
        // Tab hidden: catat waktu, akan sync saat kembali
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [])

  const renderPlayer = () => {
    switch (videoType) {
      case 'youtube':
        return <iframe src={url} className="w-full h-full" allowFullScreen allow="autoplay; encrypted-media" />
      case 'vimeo':
        return <iframe src={url} className="w-full h-full" allowFullScreen allow="autoplay" />
      case 'mp4':
        return <video src={url} className="w-full h-full" controls autoPlay />
    }
  }

  return (
    <div className="relative w-full aspect-video bg-black">
      {renderPlayer()}
      {/* Timer overlay */}
      <div className="absolute top-3 right-3 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
        ⏱ {Math.floor(remaining / 60)}:{String(remaining % 60).padStart(2, '0')}
      </div>
    </div>
  )
}
```

### ConvertSlider.tsx

```tsx
export function ConvertSlider({ balance, rate, dailyRemaining }: Props) {
  const [points, setPoints] = useState(10)
  const [loading, setLoading] = useState(false)
  
  const watchMinutes = Math.floor(points / rate)
  const maxPoints = Math.min(balance, dailyRemaining * rate)

  const handleConvert = async () => {
    setLoading(true)
    const idempotencyKey = crypto.randomUUID()
    try {
      await api.convertPoints({ points, idempotencyKey })
      // refresh balance
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between text-sm text-gray-500">
        <span>Poin: {points}</span>
        <span>= {watchMinutes} menit nonton</span>
      </div>
      <input
        type="range"
        min={10}
        max={maxPoints}
        step={rate}
        value={points}
        onChange={e => setPoints(Number(e.target.value))}
        className="w-full"
      />
      <button
        onClick={handleConvert}
        disabled={loading || watchMinutes < 1}
        className="w-full bg-orange-500 text-white py-3 rounded-xl font-bold disabled:opacity-50"
      >
        {loading ? 'Menukar...' : `Tukar ${points} poin → ${watchMinutes} menit`}
      </button>
    </div>
  )
}
```

---

## 7. Sprint Plan

### Sprint 1 (Minggu 1–2): Foundation

**Backend:**
- [x] Setup Go project + Fiber v2 + pgx
- [x] Setup sqlc + migration files (001–009)
- [x] `users` table + auth handler (register, login, refresh, logout)
- [x] JWT middleware + role guard
- [x] Child PIN login
- [x] Rate limiter in-memory (`pkg/ratelimit`)
- [x] `/health` endpoint
- [x] Dockerfile backend

**Frontend:**
- [x] Setup Next.js 14 + Tailwind + shadcn/ui
- [x] PWA config (manifest.json, `sw.js`, icon-192/512.png — selesai)
- [x] Login page (email/password)
- [x] Child PIN pad login page
- [x] Route guard berdasarkan role (middleware + layout per route group)
- [x] API client wrapper (`lib/api.ts`)
- [x] Dockerfile frontend

**DevOps:**
- [x] docker-compose.prod.yml
- [x] `.env.example`
- [ ] Test deploy di STB
- [ ] Cloudflare Tunnel config

**Deliverable:** Login bekerja untuk ketiga role. Deploy jalan di STB.

---

### Sprint 2 (Minggu 3–4): Game Engine

**Backend:**
- [x] `math_questions` CRUD (admin handler)
- [x] Seed 50 soal matematika kelas 1–3 (50 soal sudah ada di seed.sql)
- [x] `game_sessions`: start, get question, submit answer, end
- [x] Nonce generation + validation
- [x] Anti-cheat: minimum elapsed check server-side
- [x] Scoring formula
- [x] Point wallet credit setelah jawaban benar
- [x] `streaks` update
- [x] Session summary endpoint

**Frontend:**
- [x] Child: Home screen (balance, streak, CTA main)
- [x] Child: Game screen (soal, pilihan, timer bar)
- [x] Child: Answer feedback (benar/salah + poin earned via `SessionSummaryCard`)
- [x] Child: Session summary screen (inline di game page via `phase === 'ended'`)
- [x] Admin: Question management (`admin/questions/page.tsx`)

**Deliverable:** Anak bisa main game, poin masuk, streak update.

---

### Sprint 3 (Minggu 5–6): Point Economy + Video Reward

**Backend:**
- [x] Point conversion endpoint + idempotency + row lock (SELECT FOR UPDATE)
- [x] Watch wallet management
- [x] Daily limit reset job (background goroutine, reset setiap 1 jam)
- [x] `videos` CRUD: tambah URL, parse type, domain whitelist, auto-thumbnail YouTube
- [x] `watch_sessions`: start, heartbeat deduction, terminate (dengan transaction)
- [x] Concurrent session prevention
- [x] Background job: auto-close stale sessions (`CloseStaleWatchSessions`)
- [x] Emergency lock enforcement
- [x] Allowed hours validation — migration 010 normalisasi data lama ke format boolean; parser sudah pakai `Asia/Jakarta` timezone
- [x] Nonce cleanup job (`DeleteExpiredNonces`)

**Frontend:**
- [x] Child: Wallet screen + convert slider (`child/rewards/page.tsx`)
- [x] Child: Video library (grid thumbnail + fallback emoji)
- [x] Child: Video player (YouTube iframe / MP4 video) + timer overlay
- [x] Child: "Waktu habis" screen (expired state di `VideoPlayer`)
- [ ] Child: Emergency lock screen (halaman `/child/locked` belum ada; guard sudah ada di `ChildLockGuard`)
- [ ] Parent: Settings form (halaman settings belum dibuat, hanya ada di `children/[id]/page.tsx` sebagian)
- [x] Parent: Video management (`parent/children/[id]/videos/page.tsx`)
- [x] Parent: Emergency lock toggle (`parent/children/[id]/page.tsx`)

**Deliverable:** Full loop: belajar → poin → konversi → nonton → selesai.

---

### Sprint 4 (Minggu 7–8): Analytics + Polish

**Backend:**
- [x] Analytics endpoint: watch session history per child (`GetChildAnalytics`)
- [x] Watch history recording (otomatis saat `TerminateSession`)
- [x] Achievement check + award (SQL queries, service, handler, route `/child/achievements` — selesai)
- [ ] Admin: user list, toggle aktif/nonaktif (frontend ada, backend belum dicek penuh)
- [x] Admin: video moderation (approve/reject global video)

**Frontend:**
- [ ] Parent: Analytics dashboard — halaman ada (`analytics/page.tsx`) tapi perlu dicek isinya
- [ ] Parent: Activity feed anak
- [x] Child: Achievements screen (`child/achievements/page.tsx` — badge earned/locked)
- [x] Admin: Dashboard (`admin/dashboard/page.tsx`)
- [x] PWA: `sw.js` (cache-first + network-only untuk `/api/`), icon-192/512.png — selesai
- [ ] UI polish: loading states, empty states, error messages (sebagian ada)
- [ ] Responsiveness semua screen (mobile + tablet)

**Deliverable:** App lengkap, siap dipakai keluarga.

---

## 8. Checklist Per Feature

### Setiap API endpoint harus:
- [ ] Auth guard terpasang (role check)
- [ ] Input validation (binding + manual check)
- [ ] Ownership check (bukan hanya auth)
- [ ] Error response menggunakan format standar
- [ ] Tidak ada sensitive data di log

### Setiap screen frontend harus:
- [ ] Loading state (skeleton / spinner)
- [ ] Error state (pesan yang jelas untuk anak atau orang tua)
- [ ] Empty state (ilustrasi + CTA)
- [ ] Responsive (min 375px sampai 1280px)
- [ ] Tidak ada console.log di production build

---

## 9. Go Dependencies

```go
// go.mod — dependencies utama
require (
    github.com/gofiber/fiber/v2     v2.52.4
    github.com/gofiber/jwt/v3       v3.3.10
    github.com/jackc/pgx/v5         v5.6.0
    github.com/golang-jwt/jwt/v5    v5.2.1
    golang.org/x/crypto             v0.23.0  // bcrypt untuk password
    github.com/google/uuid          v1.6.0
)
```

```json
// package.json — dependencies utama frontend
{
  "dependencies": {
    "next": "14.2.x",
    "react": "18.x",
    "tailwindcss": "3.x",
    "zustand": "4.x",
    "@tanstack/react-query": "5.x",
    "react-hook-form": "7.x",
    "zod": "3.x",
    "recharts": "2.x"
  }
}
```

---

## 10. Database Migration Runbook

```bash
# Development: jalankan manual
psql $DATABASE_URL -f database/migrations/001_create_users.sql
# dst...

# Production: otomatis via docker-compose
# File di ./database/migrations/ dieksekusi secara alfabetikal
# oleh postgres entrypoint saat container pertama kali run

# Tambah migration baru:
# 1. Buat file: database/migrations/010_nama_perubahan.sql
# 2. Test di local dulu
# 3. Commit + redeploy (docker-compose up --build)
```

---

## 11. Backup Strategy (STB)

```bash
# Backup harian otomatis — tambahkan ke crontab di STB
# crontab -e
0 2 * * * docker exec mathquest_postgres_1 pg_dump -U mathquest mathquest_db | gzip > /backup/mathquest_$(date +\%Y\%m\%d).sql.gz

# Hapus backup > 7 hari
0 3 * * * find /backup -name "*.sql.gz" -mtime +7 -delete

# Upload ke Google Drive / R2 (opsional, pakai rclone)
0 4 * * * rclone copy /backup/ gdrive:mathquest-backup/
```

Ini penting. PostgreSQL di STB tanpa backup = satu kejadian mati listrik bisa hilangkan semua data anak.

---

## 12. Launch Checklist

- [ ] Semua endpoint ditest manual (Postman / curl)
- [ ] Full flow ditest: register parent → tambah anak → main game → konversi → nonton → parent cek laporan
- [ ] Emergency lock ditest: lock aktif → anak tidak bisa akses
- [ ] PWA bisa di-install di HP (test di Chrome Android)
- [ ] Cloudflare Tunnel stabil (test 1 jam tanpa disconnect)
- [ ] Backup script jalan dan file backup terbuat
- [ ] Password admin + parent sudah diganti dari default
- [ ] `.env` tidak ter-commit ke git (ada di `.gitignore`)
- [ ] Docker containers semua `restart: unless-stopped`
- [ ] UPS terpasang di STB (sangat disarankan)

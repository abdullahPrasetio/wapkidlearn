# DevLog — WapKidLearn

---

## 2026-05-30 — Sprint 1–3: Full Flow Selesai

### Backend

#### Parent Video Management
- Tambah 3 route baru di `parent/handler.go`: `GET/POST /children/:id/videos` dan `DELETE /children/:id/videos/:videoId`
- Inject `videos.Service` ke `parent.Handler` — update `NewHandler` dan `main.go`
- Semua route video parent dilindungi `verifyOwnership` (anti-IDOR)

#### `verifyOwnership` Refactor
- Ekstrak logika cek kepemilikan anak ke helper `verifyOwnership(ctx, parentID, childID)` di `parent/service.go`
- `SetLock`, `UpdateSettings`, `GetAnalytics` semua refactored pakai helper ini

#### Auto-generate Thumbnail YouTube
- Ganti `parseVideoURL` → `parseVideoURLFull` yang return struct `parsedVideo{videoType, embedURL, thumbnailURL}`
- YouTube: `https://img.youtube.com/vi/{ID}/hqdefault.jpg` (gratis, tanpa API key)
- Vimeo: thumbnail dikosongkan (butuh API call), fallback emoji di frontend
- `AddVideo` otomatis isi `thumbnail_url` dari hasil parse jika tidak diisi manual

#### Fix Delete Video — Foreign Key Constraint
- Error: `watch_sessions_video_id_fkey` saat hapus video yang pernah ditonton
- Fix: `DeleteVideo` sekarang pakai transaction — hapus `watch_histories` → `watch_sessions` → `videos` secara berurutan
- Rollback otomatis jika salah satu langkah gagal

#### Fix Nama Tabel
- `watch_history` → `watch_histories` (nama plural sesuai migration)

#### Heartbeat — Final Flush
- Heartbeat deduct wallet hanya saat interval 10 detik tercapai
- Tambah `flushHeartbeat()` yang dipanggil saat session berakhir (expired atau keluar manual) agar sisa elapsed ikut dipotong dari wallet

### Frontend

#### Parent Video Management Page
- Buat `parent/children/[id]/videos/page.tsx` — halaman baru
- Form tambah video (judul + URL), list video dengan status badge
- Tombol approve / reject / hapus per video
- Info box menjelaskan flow 3 langkah: tambah → pending → approve → aktif
- Status label: `pending=⏳`, `active=✅`, `rejected=❌`

#### Watch Library — Thumbnail & Balance Banner
- Tampilkan thumbnail YouTube via `<img>` jika `thumbnail_url` ada
- Fallback emoji per tipe video (▶️ youtube, 🎬 mp4, 🎥 lainnya)
- Play overlay circle di atas thumbnail
- Banner biru jika punya balance; banner oranye + CTA ke `/child/rewards` jika kosong
- Video card `disabled` dengan opacity-40 jika tidak ada balance

#### VideoPlayer Fixes
- Interval heartbeat: 30s → **10s** (lebih responsif untuk sesi pendek)
- Tambah `flushHeartbeat()`: kirim sisa elapsed sebelum session dihentikan
- Tombol "✕ Keluar" sekarang flush dulu sebelum `onBack`
- `onTimeExpired` dipanggil setelah flush selesai

#### Fix `use(params)` — Next.js 14
- `params` di Next.js 14 adalah plain object, bukan Promise
- Hapus `use(params)` di `watch/[sessionId]/page.tsx`, langsung destructure

#### Fix Field Mismatch Heartbeat API
- Request: `elapsed` → `elapsed_seconds`
- Response type: `time_remaining_seconds` → `remaining_seconds`

#### `api.ts` — Parent Video Methods
- Tambah `parent.listVideos(childId)`, `parent.addVideo(childId, body)`, `parent.deleteVideo(childId, videoId)`

### Docs
- `docs/devplan.md` — update semua checklist sprint 1–4 sesuai status aktual

---

## 2026-05-30 — Security Audit: 19/19 Temuan Diperbaiki

Perbaikan menyeluruh dari hasil security review di `docs/finding.md`.

### Backend

#### [B1] JWT_SECRET wajib dari env
- `main.go`: hapus fallback `"change-me-in-production"`, ganti ke `log.Fatal` jika env kosong

#### [B2] Rate limiting child login
- `pkg/response/response.go`: tambah `TooManyRequests()`
- `auth/handler.go`: inject `*ratelimit.Limiter`, cek 5 req/menit per `child_id` sebelum proses login

#### [B3] Lock check di token refresh
- `auth/service.go`: saat refresh untuk role `child`, query DB — jika `is_locked` atau `emergency_lock` aktif, kembalikan error (emergency lock efektif ≤15 menit tanpa logout paksa)

#### [B4] Log error CreditPoints
- `game/service.go`: error dari `CreditPoints` di-log, tidak di-swallow diam-diam

#### [B5] Ownership check approve/reject video
- `parent/handler.go`: tambah `ApproveChildVideo` dan `RejectChildVideo` dengan ownership check
- `parent/service.go`: tambah `VerifyVideoOwnership` — join `videos → child_profiles → parent_id`
- `main.go`: route approve/reject dipindah ke `parentGroup` (auth parent)

#### [B6] Safe-fail emergency lock
- `auth/service.go`: jika `GetParentSettings` gagal saat child login, anggap locked (deny access)

#### [B8] Fail-fast video fetch sebelum deduct balance
- `videos/service.go`: fetch + validasi video sebelum `CreateWatchSession` — balance tidak terpotong untuk video yang tidak ada

#### [B9] Log error TerminateSession
- `videos/service.go`: error dari `TerminateSession` di-log, tidak hilang

#### [B10] Hapus raw SQL getChildGradeLevel
- `database/queries/auth.sql`: tambah named query `GetChildGradeLevel`
- `game/service.go`: pakai `s.repo.q.GetChildGradeLevel()` dari sqlc, bukan raw pool query

#### [B11] Propagate error GetSessionAnswers
- `game/service.go`: return error jika `GetSessionAnswers` gagal, tidak silent continue

#### [B12] Hapus resetDailyWatch saat startup
- `main.go`: hapus panggilan `resetDailyWatch` saat startup — ticker 1 jam sudah cukup

#### [A1] Safe-fail GetIsLocked
- `points/service.go`: jika `GetIsLocked` error, default `isLocked = true`

#### [A3] Fix timezone allowed hours
- `videos/service.go`: ganti `time.Now()` ke `time.Now().In(loc)` dengan `loc = "Asia/Jakarta"`

#### [A4] Bedakan 404 vs 500 di GetSettings
- `parent/handler.go`: cek `pgx.ErrNoRows` → 404, selain itu → 500

#### [A5] Migration normalisasi allowed_hours
- `database/migrations/010_migrate_allowed_hours.up.sql`: reset data lama (format object) ke `{}` agar parser boolean berjalan benar

### Frontend

#### [A2 + B13] ChildLockGuard — skeleton loading
- `components/child/ChildLockGuard.tsx`: tambah `isLoading` / `isError` dari `useWallet()`; tampilkan skeleton animasi saat loading, bukan blank screen

#### [A6] emergency_lock non-optional
- `lib/types.ts`: `ParentSettings.emergency_lock` dari `boolean?` → `boolean`

---

---

## 2026-05-30 — Sprint 4: Achievement System, PWA, Seed 50 Soal

### Backend

#### Achievement System (full stack)
- Buat `backend/internal/database/queries/achievements.sql` — 4 named queries: `GetAllAchievementsWithStatus`, `GetAchievementByCode`, `AwardAchievement`, `GetLifetimePoints`
- Jalankan `sqlc-gen` → generate `achievements.sql.go` (types: `AwardAchievementParams`, `GetAllAchievementsWithStatusRow`)
- Buat `backend/internal/achievement/service.go` — standalone package, 5 achievement codes: `first_step`, `hot_streak`, `diligent`, `century_points`, `first_watch`
  - `GetAll(ctx, childID)` — list semua achievement + status unlocked per anak
  - `CheckAndAward(ctx, params)` — cek 4 kondisi otomatis (langkah pertama, streak, rajin, 100 poin)
  - `AwardFirstWatch(ctx, childID)` — trigger dari konversi poin ke watch time
  - `award(ctx, childID, code, condition)` — internal helper, pakai ON CONFLICT DO NOTHING
- Buat `backend/internal/achievement/handler.go` — `GET /api/v1/child/achievements` (auth child)
- Wire ke `game/service.go`: goroutine async di `EndSession` setelah sesi selesai — cek streak + lifetime points
- Wire ke `points/service.go`: goroutine async di `ConvertPoints` setelah commit — award `first_watch`
- Wire ke `main.go`: `achievementSvc` diinit lebih awal, inject ke `points.NewService` dan `game.NewService`, route terdaftar di `childGroup`

### Frontend

#### Halaman `/child/achievements`
- Buat `frontend/app/(child)/child/achievements/page.tsx`
- Badge emoji map: `first_step=👣`, `hot_streak=🔥`, `diligent=📅`, `century_points=💯`, `first_watch=📺`
- Card earned: background kuning, tanggal unlock
- Card locked: opacity 50%, ikon 🔒
- Stat card oranye di atas: jumlah badge diraih
- Loading skeleton (3 baris), empty state dengan CTA
- Back link ke `/child/home`
- Tambah `Achievement` interface ke `lib/types.ts` (field: `id`, `code`, `title`, `description`, `unlocked`, `unlocked_at?`)
- Tambah `achievements.list()` ke `lib/api.ts`

### PWA Assets
- Buat `frontend/public/sw.js`:
  - Cache name: `wapkidlearn-v1`
  - Precache: `/`, `/child/home`, `/manifest.json`
  - Strategy: cache-first untuk navigasi & `/_next/static/`, network-only untuk `/api/*`
  - Auto-cache static assets pada fetch pertama; fallback ke `/` saat offline
- Generate `frontend/public/icon-192.png` dan `icon-512.png` (solid orange #FF6B35, Python stdlib)
- Tambah SW registration inline script di `frontend/app/layout.tsx`

### Seed 50 Soal
- Tambah 24 soal baru ke `database/migrations/seed.sql`:
  - Kelas 1: 3 penjumlahan (2+7, 1+9, 5+5), 3 pengurangan (10-3, 9-4, 8-3)
  - Kelas 2: 4 perkalian (7×4, 8×3, 6×6, 2×9), 4 pembagian (20÷4, 18÷3, 24÷6, 30÷5)
  - Kelas 3: 3 perkalian (7×8, 12×5, 11×7), 3 pembagian (81÷9, 64÷8, 90÷10), 2 soal tiga digit, 2 soal cerita difficulty 4
- Total: 50 soal (kelas 1–3, difficulty 1–4)

---

## Sisa yang Belum Dikerjakan

| Item | Prioritas |
|------|-----------|
| Child: Emergency lock screen (halaman khusus `/child/locked`) | Medium |
| Parent: Settings form lengkap (allowed hours, conversion rate) | Medium |
| Parent analytics dashboard (cek & lengkapi) | Low |
| UI polish: loading/error/empty states semua screen | Low |
| Responsiveness audit (375px–1280px) | Low |
| Deploy ke STB + Cloudflare Tunnel | —  |

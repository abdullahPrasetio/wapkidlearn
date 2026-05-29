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

## Sisa yang Belum Dikerjakan

| Item | Prioritas |
|------|-----------|
| Child: Emergency lock screen (halaman khusus `/child/locked`) | Medium |
| Parent: Settings form lengkap (allowed hours, conversion rate) | Medium |
| Seed soal matematika diperbanyak ke ~50 soal | Low |
| Achievement logic backend + screen anak | Low |
| `sw.js` + `icon-192.png` + `icon-512.png` (PWA install) | Low |
| Parent analytics dashboard (cek & lengkapi) | Low |
| Deploy ke STB + Cloudflare Tunnel | —  |

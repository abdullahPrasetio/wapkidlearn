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

## Sisa yang Belum Dikerjakan

| Item | Prioritas |
|------|-----------|
| Allowed hours validation (parsing JSON di `videos/service.go`) | Medium |
| Child: Emergency lock screen | Medium |
| Parent: Settings form lengkap (allowed hours, conversion rate) | Medium |
| Seed soal matematika diperbanyak ke ~50 soal | Low |
| Achievement logic backend + screen anak | Low |
| `sw.js` + `icon-192.png` + `icon-512.png` (PWA install) | Low |
| Parent analytics dashboard (cek & lengkapi) | Low |
| Deploy ke STB + Cloudflare Tunnel | —  |

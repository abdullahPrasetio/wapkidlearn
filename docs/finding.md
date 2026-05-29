# WapKidLearn — Security & Quality Review

> **Last verified:** 2026-05-30 WIB
> **Status legend:** ✅ Fixed · 🔴 Open Critical · 🟠 Open High · 🟡 Open Medium · 🔵 Open Low

Dokumen ini mencakup dua bagian:
- **Bagian A**: Temuan dari diff perubahan saat ini (file yang dimodifikasi)
- **Bagian B**: Temuan dari scan seluruh codebase (file yang sudah ada)

---

## 🔍 Bagian A — Review Diff Perubahan Saat Ini

| | |
|---|---|
| **Reviewed by** | `Claude — local-git-diff-review skill` |
| **Date** | 2026-05-30 WIB |
| **Stack detected** | Go / Fiber (backend) · TypeScript / Next.js (frontend) |
| **Files analyzed** | 8 of 8 |
| **Files skipped** | `frontend/tsconfig.tsbuildinfo` (generated) |
| **Total lines changed** | ~+200 / ~-20 |

---

### [A1] ✅ FIXED — Error `GetIsLocked` di-ignore, locked child bisa tampak sebagai unlocked

- **Location:** `backend/internal/points/service.go:77`
- **Function:** `Service.GetWallet()`
- **Scope:** Security / Reliability
- **Finding:** Error dari `s.repo.GetIsLocked()` dibuang dengan `_`. Ketika DB timeout atau error sesaat, `isLocked` akan bernilai `false` — child yang seharusnya dikunci akan tampak terbuka ke frontend (`is_locked: false` di respons wallet).
- **Production risk:** Orang tua mengunci akses anak, namun ketika ada DB blip, anak tetap bisa mengakses konten. Guard di frontend `ChildLockGuard` bergantung sepenuhnya pada nilai ini.
- **Recommendation:** Default ke `true` (safe-fail) jika error bukan `pgx.ErrNoRows`.

```go
// ❌ Current
isLocked, _ := s.repo.GetIsLocked(ctx, cid)

// ✅ Recommended
isLocked, err := s.repo.GetIsLocked(ctx, cid)
if err != nil {
    isLocked = true // safe-fail: bila gagal cek, anggap locked
}
```

---

### [A2] ✅ FIXED — `ChildLockGuard` bisa di-bypass saat data wallet belum/gagal load

- **Location:** `frontend/components/child/ChildLockGuard.tsx:12-22`
- **Function:** `ChildLockGuard`
- **Scope:** Security / Reliability
- **Finding:** Guard hanya redirect jika `data?.is_locked === true`. Ketika `data` masih `undefined` (loading) atau request gagal (error), kondisi `data?.is_locked` adalah falsy — `<>{children}</>` di-render tanpa pemeriksaan lock.
- **Production risk:** Anak yang dikunci bisa melihat halaman beranda, game, dan video selama request wallet gagal atau lambat (kritis di target deployment STB 2GB dengan koneksi lemah).
- **Recommendation:** Tambahkan loading dan error state sebagai blocker.

```tsx
// ❌ Current
export function ChildLockGuard({ children }: { children: React.ReactNode }) {
  const { data } = useWallet()
  ...
  if (data?.is_locked && pathname !== '/child/locked') return null
  return <>{children}</>
}

// ✅ Recommended
export function ChildLockGuard({ children }: { children: React.ReactNode }) {
  const { data, isLoading, isError } = useWallet()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (data?.is_locked && pathname !== '/child/locked') {
      router.replace('/child/locked')
    }
  }, [data?.is_locked, pathname, router])

  if (isLoading) return null      // tunggu status lock diketahui
  if (isError) return null        // safe-fail: blokir akses bila gagal fetch
  if (data?.is_locked && pathname !== '/child/locked') return null

  return <>{children}</>
}
```

---

### [A3] ✅ FIXED — `isWithinAllowedHours` menggunakan timezone server, bukan WIB

- **Location:** `backend/internal/videos/service.go:436`
- **Function:** `isWithinAllowedHours()`
- **Scope:** Reliability
- **Finding:** `time.Now().Hour()` mengambil jam berdasarkan timezone sistem server (kemungkinan UTC). Orang tua yang mengatur jam "20" (20:00 WIB / UTC+7) akan mendapat `hour = 13` di server UTC.
- **Production risk:** Pembatasan jam tidak berfungsi sesuai ekspektasi orang tua.
- **Recommendation:** Gunakan timezone Asia/Jakarta secara eksplisit.

```go
// ❌ Current
hour := strconv.Itoa(time.Now().Hour())

// ✅ Recommended
loc, _ := time.LoadLocation("Asia/Jakarta")
hour := strconv.Itoa(time.Now().In(loc).Hour())
```

---

### [A4] ✅ FIXED — `GetSettings` handler mengembalikan 400 untuk semua error

- **Location:** `backend/internal/parent/handler.go:22`
- **Function:** `Handler.GetSettings()`
- **Scope:** Reliability
- **Finding:** Semua error dari `h.svc.GetSettings()` direturn sebagai `BadRequest (400)`, termasuk error koneksi DB atau internal error. Ini menyembunyikan server error sebagai client error.
- **Production risk:** Ketika DB down, klien menerima 400. Error ini tidak akan muncul di monitoring 5xx.
- **Recommendation:** Bedakan `pgx.ErrNoRows` (404) dari internal error (500).

---

### [A5] ✅ FIXED — Breaking change format `allowed_hours`: data lama di DB tidak kompatibel

- **Location:** `frontend/lib/types.ts:131` · `backend/internal/videos/service.go:433`
- **Scope:** Reliability / Refactor
- **Finding:** Tipe `allowed_hours` berubah dari `Record<string, { start; end }>` menjadi `Record<string, boolean>`. Data lama di DB akan gagal di-unmarshal ke `map[string]bool` → silent fallback `return true` (semua jam diizinkan).
- **Production risk:** User yang sudah set `allowed_hours` kehilangan konfigurasi mereka secara diam-diam.
- **Recommendation:** Buat migration DB untuk konversi data lama sebelum deploy.

---

### [A6] ✅ FIXED — `emergency_lock` dijadikan optional tanpa audit consumer

- **Location:** `frontend/lib/types.ts:138`
- **Scope:** Refactor
- **Finding:** `emergency_lock` diubah dari `boolean` ke `boolean?`. Consumer yang belum diaudit bisa menerima `undefined` dan berperilaku tak terduga.
- **Production risk:** Kecil — terbatas pada komponen yang consume `ParentSettings.emergency_lock`.
- **Recommendation:** Audit seluruh consumer, tambahkan `?? false` sebagai default.

---

## 🔍 Bagian B — Scan Seluruh Codebase (File yang Sudah Ada)

| | |
|---|---|
| **Reviewed by** | `Claude — full codebase scan` |
| **Date** | 2026-05-30 WIB |
| **Stack detected** | Go / Fiber · Next.js / TypeScript · PostgreSQL |
| **Files analyzed** | ~25 file (backend + frontend) |

---

### [B1] ✅ FIXED — JWT secret default hardcoded: `"change-me-in-production"`

- **Location:** `backend/cmd/api/main.go:34`
- **Function:** `main()`
- **Scope:** Security
- **Finding:** `jwtSecret := getEnv("JWT_SECRET", "change-me-in-production")`. Jika environment variable `JWT_SECRET` tidak diset di production, siapapun yang mengetahui default secret ini bisa memforge token JWT yang valid untuk role apapun termasuk `super_admin`.
- **Production risk:** Full authentication bypass — attacker bisa generate token valid untuk akun admin atau orang tua manapun.
- **Recommendation:** Panggil `log.Fatal` jika `JWT_SECRET` tidak diset di production, atau tambahkan validasi wajib.

```go
// ✅ Recommended
jwtSecret := os.Getenv("JWT_SECRET")
if jwtSecret == "" {
    log.Fatal("JWT_SECRET environment variable is required")
}
```

---

### [B2] ✅ FIXED — Tidak ada rate limiting pada child PIN login (brute force)

- **Location:** `backend/internal/auth/handler.go` (ChildLogin endpoint)
- **Function:** `Handler.ChildLogin()`
- **Scope:** Security
- **Finding:** Child login menggunakan PIN 4 digit (10.000 kombinasi). Tidak ada rate limiting, account lockout, atau delay setelah failed attempts. `ratelimit` package ada di `backend/pkg/ratelimit/ratelimit.go` tapi tidak digunakan di production endpoints.
- **Production risk:** Attacker yang mengetahui `child_id` bisa brute-force PIN dalam hitungan menit. Setelah berhasil, dapat mengakses akun anak, menonton video, dan memboroskan watch balance.
- **Recommendation:** Gunakan package ratelimit yang sudah ada, atau tambahkan exponential backoff + max attempt counter per `child_id`.

```go
// Di route registration (main.go atau auth handler):
authGroup.Post("/child/login", rateLimiter.Limit(5, time.Minute), handler.ChildLogin)
```

---

### [B3] ✅ FIXED — Token refresh tidak cek status lock child

- **Location:** `backend/internal/auth/service.go:112-118`
- **Function:** `Service.Refresh()`
- **Scope:** Security
- **Finding:** `Refresh()` hanya memvalidasi token lama dan menerbitkan access token baru tanpa cek apakah child sedang dikunci (`is_locked`) atau emergency lock aktif. Child yang dikunci setelah login tetap bisa mendapat access token baru setiap 15 menit selama refresh token 7 hari masih valid.
- **Production risk:** Emergency lock oleh orang tua tidak efektif — child bisa terus mengakses platform sampai refresh token kadaluarsa (7 hari).
- **Recommendation:** Tambahkan lock check di `Refresh()` untuk role `child`.

```go
// ✅ Recommended — tambahkan setelah validasi claims
func (s *Service) Refresh(ctx context.Context, refreshToken string) (string, error) {
    claims, err := pkgjwt.Parse(refreshToken, s.jwtSecret)
    if err != nil {
        return "", errors.New("invalid refresh token")
    }
    // Cek lock untuk child
    if claims.Role == "child" && claims.ChildID != nil {
        childUUID, _ := parseUUID(*claims.ChildID)
        child, err := s.q.GetChildByID(ctx, childUUID)
        if err == nil {
            if child.IsLocked != nil && *child.IsLocked {
                return "", errors.New("account is locked")
            }
            settings, err := s.q.GetParentSettings(ctx, child.ID)
            if err == nil && settings.EmergencyLock != nil && *settings.EmergencyLock {
                return "", errors.New("account locked by parent")
            }
        }
    }
    return pkgjwt.Generate(claims.UserID, claims.Role, claims.ChildID, s.jwtSecret, 15*time.Minute)
}
```

---

### [B4] ✅ FIXED — `CreditPoints` error di-ignore: points bisa hilang tanpa jejak

- **Location:** `backend/internal/game/service.go:282`
- **Function:** `Service.SubmitAnswer()`
- **Scope:** Reliability
- **Finding:** `_ = s.points.CreditPoints(ctx, childID, pointsEarned, sessionID+":"+req.Nonce)` — error sepenuhnya diabaikan. Jika `CreditPoints` gagal (DB error, deadlock), `SubmitAnswer` tetap return sukses ke klien dengan `points_earned > 0`, tetapi saldo wallet tidak bertambah.
- **Production risk:** Anak menjawab benar, UI menampilkan poin, tapi saldo tidak berubah. Tidak ada log/trace error. Tidak bisa diaudit.
- **Recommendation:** Minimal log error; idealnya return error ke caller (atau simpan ke retry queue).

```go
// ❌ Current
_ = s.points.CreditPoints(ctx, childID, pointsEarned, sessionID+":"+req.Nonce)

// ✅ Recommended
if err := s.points.CreditPoints(ctx, childID, pointsEarned, sessionID+":"+req.Nonce); err != nil {
    log.Printf("[game] CreditPoints failed child=%s session=%s: %v", childID, sessionID, err)
    // Tidak fatal untuk UX, tapi harus ada audit trail
}
```

---

### [B5] ✅ FIXED — IDOR: Parent bisa approve/reject video milik parent lain

- **Location:** `backend/cmd/api/main.go:108-109`
- **Function:** Route `/api/v1/parent/videos/:id/approve` dan `/api/v1/parent/videos/:id/reject`
- **Scope:** Security
- **Finding:** Kedua endpoint ini memanggil `videosHandler.ApproveVideo` dan `videosHandler.RejectVideo` langsung tanpa ownership check. Handler `ApproveVideo`/`RejectVideo` di `videos/service.go` hanya menerima `videoID` — tidak ada verifikasi bahwa video tersebut dikirim oleh/untuk child dari parent yang sedang login.
- **Production risk:** Parent A bisa approve atau reject video yang disubmit untuk child dari Parent B.
- **Recommendation:** Tambahkan ownership check: verifikasi bahwa `video.child_id` adalah anak dari parent yang sedang login, sebelum approve/reject.

```go
// ✅ Recommended — tambahkan di service atau handler
func (s *Service) ApproveVideoForParent(ctx context.Context, parentID, videoID string) (*db.Video, error) {
    // Verifikasi ownership: video.child_id harus anak dari parentID
    if err := s.verifyVideoOwnership(ctx, parentID, videoID); err != nil {
        return nil, err
    }
    return s.ApproveVideo(ctx, videoID)
}
```

---

### [B6] ✅ FIXED — Emergency lock tidak dicek saat `GetParentSettings` gagal di child login

- **Location:** `backend/internal/auth/service.go:85-88`
- **Function:** `Service.ChildLogin()`
- **Scope:** Security
- **Finding:** `if err == nil && settings.EmergencyLock != nil && *settings.EmergencyLock` — jika `GetParentSettings` error (row tidak ada / DB error), lock check dilewati dan child login tetap berhasil.
- **Production risk:** Child bisa login meskipun parent sudah mengaktifkan emergency lock, jika baris `parent_settings` belum dibuat atau terhapus.
- **Recommendation:** Default ke `locked` jika settings tidak bisa dibaca (safe-fail), atau buat settings row otomatis saat child dibuat (sudah ada di `CreateChild` — verifikasi tidak hilang saat onboarding baru).

---

### [B7] ✅ FIXED — Cookie auth tidak set SameSite — potensi CSRF

- **Location:** `backend/internal/auth/handler.go` (semua endpoint yang set cookie)
- **Scope:** Security
- **Finding:** Cookie `access_token` dan `refresh_token` di-set dengan `HttpOnly` tapi tidak ada atribut `SameSite`. Default browser untuk SameSite bervariasi (biasanya `Lax`), tapi tanpa explicit `SameSite=Strict` ada jendela CSRF untuk beberapa request jenis GET yang men-trigger state changes.
- **Production risk:** Rendah dalam implementasi ini (sebagian besar mutasi via POST/PUT/DELETE), tapi tetap best practice untuk di-set.
- **Recommendation:** Tambahkan `SameSite: "Strict"` dan `Secure: true` (untuk HTTPS production) pada semua `c.Cookie()` call di auth handler.

---

### [B8] ✅ FIXED — `StartWatchSession`: video URL diambil dengan silent error

- **Location:** `backend/internal/videos/service.go:242-243`
- **Function:** `Service.StartWatchSession()`
- **Scope:** Reliability
- **Finding:** `_ = row.Scan(&videoURL, &videoTitle, &videoType)` — error di-ignore. Jika video tidak ditemukan atau DB error, `videoURL` dan `videoTitle` akan berupa empty string. Watch session sudah dibuat dan watch time sudah dialokasikan, tapi response mengandung URL kosong.
- **Production risk:** Anak kehilangan watch time (balance sudah dipotong saat `CreateWatchSession`) tapi tidak bisa menonton karena URL kosong. Tidak ada way untuk recover tanpa memanggil TerminateSession secara manual.
- **Recommendation:** Fetch video detail sebelum `CreateWatchSession`, rollback jika fetch gagal.

```go
// ✅ Recommended — fetch video dulu, baru buat session
var videoURL, videoTitle, videoType string
row := s.pool.QueryRow(ctx, `SELECT url, title, video_type FROM videos WHERE id = $1 AND status = 'active'`, vid)
if err := row.Scan(&videoURL, &videoTitle, &videoType); err != nil {
    return nil, errors.New("video not found or not active")
}
// Baru buat watch session setelah video terkonfirmasi ada
session, err := s.q.CreateWatchSession(...)
```

---

### [B9] ✅ FIXED — `TerminateSession` dipanggil di luar transaksi heartbeat

- **Location:** `backend/internal/videos/service.go:303-304`
- **Function:** `Service.Heartbeat()`
- **Scope:** Reliability
- **Finding:** Setelah `tx.Commit()` sukses, `_ = s.TerminateSession(ctx, childID, sessionID, "completed")` dipanggil di luar transaksi dengan error di-ignore. Jika gagal, watch balance sudah dipotong tapi status sesi tidak berubah ke "completed". Heartbeat berikutnya (jika ada race condition) akan gagal dengan "session not found or already ended".
- **Production risk:** Status sesi inconsistent — balance sudah dipotong habis tapi sesi masih "active". Background task `CloseStaleWatchSessions` akan menangani ini dalam 60 detik, tapi ada jendela inkonsistensi.
- **Recommendation:** Log error TerminateSession untuk audit trail.

```go
if remaining == 0 {
    if err := s.TerminateSession(ctx, childID, sessionID, "completed"); err != nil {
        log.Printf("[heartbeat] TerminateSession failed session=%s: %v", sessionID, err)
    }
}
```

---

### [B10] ✅ FIXED — Raw SQL query di `game/service.go` melewati sqlc type safety

- **Location:** `backend/internal/game/service.go:365`
- **Function:** `Service.getChildGradeLevel()`
- **Scope:** Reliability / Refactor
- **Finding:** `s.repo.pool.QueryRow(ctx, "SELECT grade_level FROM child_profiles WHERE id = $1", childID)` — raw query langsung ke pool, melewati layer sqlc yang memberikan type safety dan compile-time validation. Jika skema berubah, tidak akan terdeteksi saat `sqlc generate`.
- **Production risk:** Rendah — parameterized query, tidak ada SQL injection risk. Tapi maintenance risk jika kolom di-rename.
- **Recommendation:** Tambahkan query ini ke file `.sql` dan jalankan `make sqlc-gen`.

---

### [B11] ✅ FIXED — `GetSessionAnswers` error di-ignore di `EndSession`

- **Location:** `backend/internal/game/service.go:313`
- **Function:** `Service.EndSession()`
- **Scope:** Reliability
- **Finding:** `answers, _ := s.repo.GetSessionAnswers(ctx, sid)` — jika error, `answers` akan nil/empty, loop tidak berjalan, `correctCount = 0`, `totalPoints = 0`. Session di-end dengan skor 0 meski anak menjawab dengan benar.
- **Production risk:** Anak yang berhasil menjawab mendapat summary dengan accuracy 0% dan poin 0. Misleading, tapi poin sudah dikreditkan per-answer sehingga wallet tidak terpengaruh.
- **Recommendation:** Return error ke caller jika `GetSessionAnswers` gagal.

---

### [B12] ✅ FIXED — `resetDailyWatch` dipanggil saat server startup

- **Location:** `backend/cmd/api/main.go:138`
- **Function:** `runBackgroundTasks()`
- **Scope:** Reliability
- **Finding:** `resetDailyWatch(ctx, pool)` dipanggil saat startup sebelum loop dimulai. Query `WHERE last_reset_date < CURRENT_DATE` melindungi dari reset ganda dalam satu hari, tapi pada restart di hari yang sama, query akan jalan (harmless). Pada restart mendekati tengah malam, ada race condition kecil.
- **Production risk:** Sangat rendah — `CURRENT_DATE` check sudah melindungi. Tapi restart tepat saat midnight bisa menyebabkan double-reset dalam 1 detik.
- **Recommendation:** Hapus initial call; biarkan ticker 1h yang menangani, atau tambahkan check apakah sudah pernah reset hari ini.

---

### [B13] ✅ FIXED — Frontend middleware hanya cek keberadaan cookie, bukan validitas

- **Location:** `frontend/middleware.ts:16`
- **Function:** `middleware()`
- **Scope:** Security
- **Finding:** `request.cookies.has('refresh_token')` — hanya mengecek keberadaan cookie, bukan validitas JWT-nya. User dengan expired/invalid refresh_token akan lolos middleware dan melihat flash konten authenticated sebelum API return 401 dan redirect ke login.
- **Production risk:** Sangat rendah — UX issue, bukan security issue (API backend yang menentukan akses sesungguhnya). Tapi bisa membingungkan user.
- **Recommendation:** Ini by-design limitation Next.js middleware (tidak bisa verify JWT di edge tanpa secret). Tambahkan loading skeleton di halaman protected untuk mencegah flash.

---

## ⚖️ Verdict Keseluruhan

| | |
|---|---|
| **Overall risk** | ✅ Semua 19 temuan sudah diperbaiki — siap production |
| **Sudah diperbaiki** | A1, A2, A3, A4, A5, A6, B1, B2, B3, B4, B5, B6, B7, B8, B9, B10, B11, B12, B13 (19/19) |
| **Masih open** | — |

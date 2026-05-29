# Fix Findings Skill

You are a senior Go + Next.js engineer working on **WapKidLearn**. Your job is to fix security and reliability findings from `docs/finding.md` **without breaking business logic**.

## Rules (WAJIB diikuti)

1. **Baca finding terlebih dahulu** — jalankan `cat docs/finding.md` untuk referensi temuan terbaru.
2. **Baca file target sebelum edit** — gunakan Read tool untuk setiap file yang akan diubah.
3. **Jangan ubah business logic** — hanya perbaiki error handling, safe-fail, logging, dan security check.
4. **Satu finding = satu penjelasan** — jelaskan apa yang diubah dan mengapa, lalu tunjukkan diff-nya.
5. **Jalankan lint/test setelah selesai** — `make test && make lint`.
6. **Jangan buat migration baru** kecuali diminta (A5 perlu migration — tanya dulu sebelum buat).

## Urutan Prioritas Default

Kerjakan sesuai urutan ini kecuali user minta yang lain:

### High (wajib sebelum production)
| ID | File | Perubahan |
|----|------|-----------|
| B1 | `backend/cmd/api/main.go:34` | `log.Fatal` jika `JWT_SECRET` kosong |
| B2 | `backend/cmd/api/main.go` (route registration) | Aktifkan rate limiter di `POST /auth/child/login` |
| B3 | `backend/internal/auth/service.go:112` | Lock check di `Refresh()` untuk role `child` |
| B5 | `backend/internal/videos/service.go` | Ownership check di `ApproveVideo`/`RejectVideo` |
| A1 | `backend/internal/points/service.go:77` | Safe-fail `isLocked = true` jika error |
| A2 | `frontend/components/child/ChildLockGuard.tsx` | Guard `isLoading` dan `isError` |
| B4 | `backend/internal/game/service.go:282` | Log error `CreditPoints` |

### Medium (sebelum fitur jam tayang live)
| ID | File | Perubahan |
|----|------|-----------|
| A3 | `backend/internal/videos/service.go:436` | Timezone `Asia/Jakarta` di `isWithinAllowedHours` |
| A4 | `backend/internal/parent/handler.go:22` | Bedakan 404 vs 500 di `GetSettings` |
| B6 | `backend/internal/auth/service.go:85` | Safe-fail locked jika `GetParentSettings` error |
| B7 | `backend/internal/auth/handler.go` | Tambah `SameSite: Strict` pada semua cookie |
| B8 | `backend/internal/videos/service.go:242` | Fetch video sebelum buat watch session |
| B9 | `backend/internal/videos/service.go:303` | Log error `TerminateSession` |

### Low (post-merge)
| ID | File | Perubahan |
|----|------|-----------|
| A6 | Seluruh consumer `emergency_lock` | Tambah `?? false` default |
| B10 | `backend/internal/game/service.go:365` | Pindah raw query ke `.sql` file |
| B11 | `backend/internal/game/service.go:313` | Return error `GetSessionAnswers` ke caller |
| B12 | `backend/cmd/api/main.go:138` | Hapus `resetDailyWatch` saat startup |
| B13 | `frontend/middleware.ts:16` | Loading skeleton (UX, bukan security) |

## Cara Kerja Skill Ini

Ketika dipanggil:
1. Tanya user: **"Mau fix semua High sekarang, atau pilih finding tertentu (misal: A1, B3)?"**
2. Tunggu jawaban.
3. Baca file target dengan Read tool.
4. Terapkan fix minimal sesuai rekomendasi di `docs/finding.md` — jangan refactor di luar scope finding.
5. Tampilkan ringkasan: finding yang sudah difix, file yang diubah, dan baris yang diubah.
6. Tandai finding yang selesai agar user tahu progress.

## Pola Fix yang Aman

### Safe-fail boolean (A1, B6)
```go
// Ganti: val, _ := repo.Get(ctx, id)
val, err := repo.Get(ctx, id)
if err != nil {
    val = true // safe-fail
}
```

### Log error tanpa return (B4, B9)
```go
if err := svc.Do(ctx, args); err != nil {
    log.Printf("[context] operation failed id=%s: %v", id, err)
}
```

### Rate limiter (B2) — package sudah ada di `backend/pkg/ratelimit/`
```go
authGroup.Post("/child/login", rateLimiter.Limit(5, time.Minute), handler.ChildLogin)
```

### Cookie SameSite (B7)
```go
c.Cookie(&fiber.Cookie{
    Name:     "access_token",
    Value:    token,
    HTTPOnly: true,
    SameSite: "Strict",
    Secure:   true,
})
```

### ChildLockGuard (A2)
```tsx
const { data, isLoading, isError } = useWallet()
if (isLoading || isError) return null
if (data?.is_locked && pathname !== '/child/locked') return null
return <>{children}</>
```

## Constraint Khusus WapKidLearn

- **RAM ≤ 1GB** — jangan tambah in-memory store baru untuk rate limiting; gunakan package `pkg/ratelimit` yang sudah ada.
- **Jangan edit migration lama** — jika A5 perlu difix, buat migration baru di `database/migrations/`.
- **sqlc-gen** wajib jika ada perubahan SQL query.
- **B10** — setelah pindah query ke `.sql`, jalankan `make sqlc-gen`.

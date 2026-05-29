# WapKidLearn: New Feature Scaffold

Use this skill when the user asks to **add a new feature** or **new API endpoint** to WapKidLearn.

## Steps to Follow

### 1. Identify the domain
Determine which internal package the feature belongs to: `game`, `points`, `videos`, `parent`, `admin`, or a new one.

### 2. Database layer (if schema change needed)
```bash
# Buat migration baru
touch database/migrations/NNN_nama_fitur.sql
# Tulis DDL, lalu:
make migrate
```

### 3. SQL Query
Tulis query baru di `backend/internal/database/queries/<domain>.sql`, lalu:
```bash
make sqlc-gen
```

### 4. Handler
Buat atau edit file di `backend/internal/<domain>/handler.go`:
- Struct handler dengan dependency ke DB/service
- Method handler: parse request → validasi → business logic → return response via `pkg/response`

### 5. Router registration
Daftarkan route di `backend/internal/<domain>/router.go` atau file router utama.
Tambahkan middleware auth sesuai role: `AuthMiddleware`, `RequireRole("parent")`, dll.

### 6. Frontend (jika ada UI)
- Tambah API call di `frontend/lib/api.ts` atau file lib terkait
- Buat page/component di folder role yang tepat:
  - `frontend/app/(child)/` untuk anak
  - `frontend/app/(parent)/` untuk orang tua
  - `frontend/app/(admin)/` untuk admin

### 7. Test
```bash
make test        # unit test backend
make lint        # pastikan tidak ada lint error
```

## Checklist Keamanan
- [ ] Ownership check (cegah IDOR)
- [ ] Auth middleware terpasang di route
- [ ] Input divalidasi sebelum diproses
- [ ] Query pakai parameterized (sqlc otomatis handle ini)
- [ ] Wallet operation pakai `SELECT FOR UPDATE` jika menyentuh balance

# WapKidLearn: Database Migration Helper

Use this skill when the user asks to **create a migration**, **change schema**, or **add/modify database tables**.

## Rules
- **JANGAN pernah edit file migration yang sudah ada** — selalu buat file baru
- Format nama file: `NNN_deskripsi_singkat.sql` (NNN = nomor urut 3 digit)
- Cek nomor terakhir dulu: `ls database/migrations/`

## Workflow

### Cek nomor migration terakhir
```bash
ls database/migrations/ | sort | tail -5
```

### Buat file migration baru
```bash
# Ganti NNN dengan nomor berikutnya, contoh 010
touch database/migrations/010_nama_perubahan.sql
```

### Template migration file
```sql
-- Migration: 010_nama_perubahan.sql
-- Deskripsi singkat perubahan

-- UP
ALTER TABLE table_name ADD COLUMN kolom_baru VARCHAR(100);

-- Catatan: golang-migrate hanya jalankan UP
-- Untuk rollback, buat file 010_nama_perubahan_down.sql atau gunakan make migrate-down
```

### Jalankan migration
```bash
make migrate          # jalankan semua pending
make migrate-status   # cek versi sekarang
```

### Rollback jika ada masalah
```bash
make migrate-down     # rollback 1 step
```

### Reset total (DEV ONLY)
```bash
make migrate-reset    # ada konfirmasi — hati-hati!
```

## Setelah migrasi yang melibatkan query baru
```bash
# Update sqlc queries jika ada query baru/berubah
# Edit file di backend/internal/database/queries/
make sqlc-gen
```

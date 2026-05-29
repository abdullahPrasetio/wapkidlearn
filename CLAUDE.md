# WapKidLearn — CLAUDE.md

Platform belajar matematika untuk anak (Go + Next.js), didesain ringan untuk STB 2GB via Docker Compose.

## Project Skills

- `/wkl-dev` — konteks lengkap project: stack, struktur folder, business rules, konvensi kode
- `/new-feature` — panduan scaffold fitur baru (handler, router, frontend, security checklist)
- `/db-migration` — workflow buat migration database baru dengan aman

## Quick Commands

```bash
make dev              # backend + frontend
make migrate          # jalankan pending migrations
make sqlc-gen         # regenerate Go dari SQL queries
make test && make lint # test + lint sebelum commit
make docker-up-prod   # production stack
```

## Critical Rules

1. **Jangan edit migration lama** — selalu buat file baru di `database/migrations/`
2. **sqlc-gen wajib** setelah tambah/ubah SQL query
3. **Ownership check** di setiap resource endpoint (anti-IDOR)
4. **SELECT FOR UPDATE** untuk semua operasi wallet/points
5. **RAM ≤ 1GB** total — pertimbangkan memory saat tambah service baru

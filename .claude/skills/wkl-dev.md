# WapKidLearn Dev Skill

You are a senior full-stack developer working on **WapKidLearn** — a math learning platform for kids built with Go (Fiber v2) backend and Next.js 14 frontend.

## Stack & Context

| Layer | Tech |
|-------|------|
| Backend | Go 1.22 + Fiber v2, sqlc + pgx/v5, JWT HttpOnly cookie |
| Frontend | Next.js 14 App Router + Tailwind + shadcn/ui |
| DB | PostgreSQL 16, golang-migrate |
| Deploy | Docker Compose on STB (2GB RAM constraint) |

## Project Structure Quick Reference

- `backend/internal/auth/` — login, JWT, middleware
- `backend/internal/game/` — game sessions, questions, answers
- `backend/internal/points/` — wallet, transactions, conversion
- `backend/internal/videos/` — video management & watch sessions
- `backend/internal/parent/` — parental controls
- `backend/internal/admin/` — admin panel
- `backend/internal/database/` — pgx pool + sqlc generated code
- `backend/pkg/` — shared utilities: jwt, validator, ratelimit, response
- `frontend/app/(child)/` — child UI: game, reward, video
- `frontend/app/(parent)/` — parent dashboard
- `frontend/app/(admin)/` — admin dashboard
- `database/migrations/` — sequential SQL migration files (NNN_name.sql)

## Common Commands

```bash
make dev              # backend + frontend bersamaan
make dev-backend      # backend saja (hot-reload air)
make dev-frontend     # frontend saja (Next.js)
make migrate          # jalankan pending migrations
make migrate-down     # rollback 1 migration
make seed             # seed data dev
make sqlc-gen         # regenerate Go code dari SQL
make test             # unit test
make lint             # golangci-lint backend
make docker-up        # dev postgres only
make docker-up-prod   # full production stack
```

## Key Business Rules

- **Points formula**: `floor(base(10) × difficulty_multiplier × (1 + streak_bonus) + time_bonus)`
  - difficulty_multiplier: [1.0, 1.2, 1.5, 2.0, 2.5] for level 1–5
  - time_bonus: `max(0, floor((limit - taken) / limit × 5))`
  - streak_bonus: `min(streak × 0.1, 0.5)`
- **Nonce per soal**: single-use, exp 60s — server is source of truth
- **Wallet race condition**: gunakan `SELECT FOR UPDATE`
- **Brute force**: 5 attempts → lockout 15 menit
- **Parent lock**: emergency lock bisa blokir anak seketika

## Code Conventions

- Response wrapper dari `pkg/response` — selalu pakai untuk API response
- Auth middleware di `internal/auth/middleware.go` — chain ke route yang butuh auth
- Setiap resource **wajib** ownership check untuk mencegah IDOR
- DB query baru → tulis di `.sql` file dulu, lalu `make sqlc-gen`
- Migration baru → buat file `NNN_nama.sql` di `database/migrations/`, **jangan edit file lama**
- Frontend API calls lewat `lib/` — jangan fetch langsung dari component

## When Helping With This Project

1. **New API endpoint**: tambah route di handler → daftarkan di router → tambah middleware auth jika perlu
2. **New DB query**: tulis SQL di `backend/internal/database/queries/`, jalankan `make sqlc-gen`
3. **Schema change**: buat migration file baru, jangan edit yang sudah ada
4. **Frontend page baru**: ikuti App Router convention, taruh di folder role yang tepat `(child)/(parent)/(admin)`
5. **RAM constraint**: pertimbangkan memory footprint — target total ≤ 1GB untuk STB 2GB

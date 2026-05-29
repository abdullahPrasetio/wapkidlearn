# PRD — WapKidLearn (STB Edition)
# Golang + PostgreSQL + Next.js PWA

**Version:** 1.0.0  
**Scope:** 3 users (1 Super Admin, 1 Parent, 1 Child)  
**Target Deploy:** STB Home Server via Cloudflare Tunnel  
**Last Updated:** 2026-05-29

---

## 1. Scope & Constraints

### Yang Dibangun

- Satu Next.js app (PWA) untuk semua role: Super Admin, Parent, Child
- Backend Golang (REST API)
- PostgreSQL sebagai satu-satunya database (tanpa Redis)
- Deploy di STB via Docker Compose
- Akses publik via Cloudflare Tunnel

### Yang Tidak Dibangun (sengaja dihilangkan)

- Adaptive learning / AI
- Leaderboard
- Seasonal events
- Push notification (cukup in-app)
- Mobile native app (PWA sudah cukup)
- Multi-family / multi-tenant
- Billing / subscription

---

## 2. User Roles

| Role | Akses |
|------|-------|
| **Super Admin** | Kelola soal, kelola video global, lihat semua aktivitas |
| **Parent** | Kelola anak, set reward rules, approve video, lihat laporan |
| **Child** | Main game, earn poin, konversi ke watch time, nonton video |

---

## 3. Functional Requirements

### Auth

- Login dengan email + password (parent, admin)
- Login child dengan PIN 4 digit
- JWT access token (exp 15 menit) + refresh token (exp 7 hari)
- Stored di HttpOnly cookie
- Rate limit login: 5 attempt → lockout 15 menit

### Game Engine

- Soal matematika multiple choice (4 pilihan)
- Difficulty level 1–5
- Timer per soal (server-side validation)
- Poin dihitung server-side, client tidak dipercaya
- Anti-cheat: minimum 2 detik sebelum jawaban bisa disubmit
- Nonce per soal (cegah replay)

### Point System

- Setiap jawaban benar → poin masuk wallet
- Formula: `poin = 10 × difficulty_multiplier + time_bonus`
- Transaksi dicatat di ledger (tidak bisa diedit)
- Konversi poin → watch time sesuai rate yang diset parent

### Video Reward

- Parent tambah video via URL (YouTube, MP4, Vimeo)
- Validasi: domain whitelist check
- Watch session dikelola server (heartbeat setiap 30 detik)
- Timer server-side: client tidak bisa manipulasi
- Support embed YouTube iframe + HTML5 video player untuk MP4
- Concurrent session prevention (max 1 aktif)

### Parent Control

- Set conversion rate (X poin = 1 menit)
- Set daily watch limit (menit)
- Set jam boleh nonton (per hari)
- Emergency lock (terminate semua sesi anak)
- Approve/reject video yang ditambahkan

### Super Admin

- CRUD soal matematika
- CRUD video global (tersedia untuk semua anak)
- Lihat semua aktivitas (game, watch, poin)
- Aktifkan/nonaktifkan user

---

## 4. Database Schema

```sql
-- Users (semua role)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255),
  role VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'parent', 'child')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Parent profiles
CREATE TABLE parent_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20)
);

-- Child profiles
CREATE TABLE child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID NOT NULL REFERENCES users(id),
  display_name VARCHAR(50) NOT NULL,
  pin_hash VARCHAR(255) NOT NULL,
  grade_level INT NOT NULL CHECK (grade_level BETWEEN 1 AND 6),
  current_level INT DEFAULT 1,
  is_locked BOOLEAN DEFAULT false,
  avatar VARCHAR(50) DEFAULT 'default'
);

-- Parent settings per child
CREATE TABLE parent_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  daily_watch_limit_minutes INT DEFAULT 60,
  conversion_rate INT DEFAULT 10,
  allowed_hours JSONB DEFAULT '{}',
  require_study_first BOOLEAN DEFAULT true,
  min_study_minutes INT DEFAULT 10,
  emergency_lock BOOLEAN DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Math questions
CREATE TABLE math_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_level INT NOT NULL,
  topic VARCHAR(50) NOT NULL,
  difficulty INT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  question_text TEXT NOT NULL,
  options JSONB NOT NULL,
  correct_answer VARCHAR(100) NOT NULL,
  explanation TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Game sessions
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES child_profiles(id),
  total_questions INT DEFAULT 0,
  correct_count INT DEFAULT 0,
  points_earned INT DEFAULT 0,
  duration_seconds INT DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Game answers
CREATE TABLE game_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES game_sessions(id),
  question_id UUID NOT NULL REFERENCES math_questions(id),
  submitted_answer VARCHAR(100),
  is_correct BOOLEAN NOT NULL,
  points_earned INT DEFAULT 0,
  time_taken_seconds INT,
  nonce VARCHAR(64) NOT NULL,
  answered_at TIMESTAMPTZ DEFAULT NOW()
);

-- Point wallets
CREATE TABLE point_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL UNIQUE REFERENCES child_profiles(id),
  balance INT DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Point transactions (append-only ledger)
CREATE TABLE point_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES point_wallets(id),
  type VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'spend')),
  amount INT NOT NULL,
  idempotency_key VARCHAR(100) UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watch time wallet
CREATE TABLE watch_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL UNIQUE REFERENCES child_profiles(id),
  balance_seconds INT DEFAULT 0 CHECK (balance_seconds >= 0),
  used_today_seconds INT DEFAULT 0,
  last_reset_date DATE DEFAULT CURRENT_DATE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submitted_by UUID NOT NULL REFERENCES users(id),
  title VARCHAR(200) NOT NULL,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  video_type VARCHAR(20) CHECK (video_type IN ('youtube', 'mp4', 'vimeo')),
  scope VARCHAR(20) DEFAULT 'child_specific' CHECK (scope IN ('global', 'child_specific')),
  child_id UUID REFERENCES child_profiles(id),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'rejected')),
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Watch sessions
CREATE TABLE watch_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES child_profiles(id),
  video_id UUID NOT NULL REFERENCES videos(id),
  allocated_seconds INT NOT NULL,
  consumed_seconds INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  last_heartbeat_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ
);

-- Watch history
CREATE TABLE watch_histories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES child_profiles(id),
  video_id UUID NOT NULL REFERENCES videos(id),
  session_id UUID REFERENCES watch_sessions(id),
  duration_seconds INT NOT NULL,
  watched_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streaks
CREATE TABLE streaks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL UNIQUE REFERENCES child_profiles(id),
  current_streak INT DEFAULT 0,
  longest_streak INT DEFAULT 0,
  last_activity_date DATE
);

-- Nonces (anti-replay)
CREATE TABLE question_nonces (
  nonce VARCHAR(64) PRIMARY KEY,
  child_id UUID NOT NULL,
  question_id UUID NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT false
);

-- Indexes
CREATE INDEX idx_child_profiles_parent ON child_profiles(parent_id);
CREATE INDEX idx_game_sessions_child ON game_sessions(child_id, started_at DESC);
CREATE INDEX idx_game_answers_session ON game_answers(session_id);
CREATE INDEX idx_math_questions_grade_topic ON math_questions(grade_level, topic, difficulty);
CREATE UNIQUE INDEX idx_point_wallets_child ON point_wallets(child_id);
CREATE INDEX idx_point_transactions_wallet ON point_transactions(wallet_id, created_at DESC);
CREATE INDEX idx_watch_sessions_child_active ON watch_sessions(child_id) WHERE status = 'active';
CREATE INDEX idx_videos_child ON videos(child_id, status);
CREATE INDEX idx_nonces_expires ON question_nonces(expires_at);
```

---

## 5. API Endpoints

### Auth
```
POST   /api/v1/auth/login              # Parent / Admin login
POST   /api/v1/auth/child/login        # Child PIN login
POST   /api/v1/auth/refresh            # Refresh token
POST   /api/v1/auth/logout
```

### Game
```
POST   /api/v1/game/sessions
GET    /api/v1/game/sessions/:id/question
POST   /api/v1/game/sessions/:id/answer
POST   /api/v1/game/sessions/:id/end
GET    /api/v1/game/sessions/:id/summary
```

### Points
```
GET    /api/v1/points/wallet
POST   /api/v1/points/convert
GET    /api/v1/points/transactions
```

### Videos
```
GET    /api/v1/videos
POST   /api/v1/videos
DELETE /api/v1/videos/:id
PATCH  /api/v1/videos/:id/approve
PATCH  /api/v1/videos/:id/reject
```

### Watch Sessions
```
POST   /api/v1/watch-sessions
PATCH  /api/v1/watch-sessions/:id/heartbeat
DELETE /api/v1/watch-sessions/:id
```

### Parent
```
GET    /api/v1/parent/children
POST   /api/v1/parent/children
PUT    /api/v1/parent/children/:id/settings
POST   /api/v1/parent/children/:id/lock
DELETE /api/v1/parent/children/:id/lock
GET    /api/v1/parent/children/:id/analytics
```

### Admin
```
GET    /api/v1/admin/questions
POST   /api/v1/admin/questions
PUT    /api/v1/admin/questions/:id
DELETE /api/v1/admin/questions/:id
GET    /api/v1/admin/videos
GET    /api/v1/admin/users
PATCH  /api/v1/admin/users/:id/toggle
```

---

## 6. Request/Response Examples

### POST /api/v1/game/sessions/:id/answer

```json
// Request
{
  "question_id": "uuid",
  "answer": "168",
  "time_taken_seconds": 8,
  "nonce": "abc123"
}

// Response 200
{
  "is_correct": true,
  "correct_answer": "168",
  "explanation": "24 × 7 = 168",
  "points_earned": 15,
  "wallet_balance": 85,
  "streak": 3
}
```

### POST /api/v1/points/convert

```json
// Request
{
  "points": 50,
  "idempotency_key": "uuid-dari-client"
}

// Response 200
{
  "points_spent": 50,
  "watch_time_added_seconds": 300,
  "watch_balance_seconds": 300
}
```

### POST /api/v1/watch-sessions

```json
// Request
{ "video_id": "uuid" }

// Response 201
{
  "session_id": "uuid",
  "video": {
    "title": "Belajar Perkalian",
    "url": "https://youtube.com/embed/xxx",
    "video_type": "youtube"
  },
  "time_remaining_seconds": 300
}

// Response 403
{
  "error": "outside_allowed_hours",
  "message": "Waktu nonton mulai jam 15:00"
}
```

---

## 7. Scoring Formula

```
base_points           = 10
difficulty_multiplier = [1.0, 1.2, 1.5, 2.0, 2.5]  (level 1–5)
time_bonus            = max(0, floor((limit - taken) / limit * 5))
streak_bonus          = min(streak * 0.1, 0.5)

final = floor(base * multiplier * (1 + streak_bonus) + time_bonus)

Contoh: level 3, 8s dari limit 20s, streak 4
= floor(10 * 1.5 * 1.4 + 3) = floor(21 + 3) = 24 poin
```

---

## 8. Video Player Strategy

```
YouTube  → iframe embed: https://youtube.com/embed/{id}?autoplay=1
MP4      → <video> tag HTML5 native
Vimeo    → iframe embed: https://player.vimeo.com/video/{id}
```

URL parsing logic di backend saat video ditambahkan:
- `youtube.com/watch?v=ID` atau `youtu.be/ID` → type: youtube, extract ID
- `vimeo.com/ID` → type: vimeo, extract ID  
- URL diakhiri `.mp4` atau domain lain → type: mp4

Timer overlay dirender di atas semua video type.

---

## 9. Watch Timer Flow

```
Client kirim POST /watch-sessions
  → Server validasi: saldo cukup, jam diizinkan, tidak ada sesi aktif lain
  → Server return session_id + time_remaining

Setiap 30 detik: PATCH /watch-sessions/:id/heartbeat { elapsed: 30 }
  → Server deduct 30s dari watch_wallet
  → Server return time_remaining terbaru

Jika time_remaining = 0 → client pause video, tampil "Waktu habis"
Jika heartbeat tidak datang > 90s → server auto-close session (background job)
```

---

## 10. Security

| Threat | Mitigation |
|--------|-----------|
| JWT theft | HttpOnly cookie, SameSite=Strict |
| Brute force | 5 attempt → lockout 15 menit |
| IDOR | Ownership check setiap resource |
| XSS | CSP header, Next.js auto-escape |
| Replay attack | Nonce per soal, single-use, exp 60s |
| SQL injection | pgx parameterized query / sqlc |
| Timer manipulation | Server source of truth |
| URL injection | Domain whitelist |

---

## 11. PWA Setup

```json
{
  "name": "WapKidLearn",
  "short_name": "WapKidLearn",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#FF6B35",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Service worker: cache app shell + static assets. API calls network-first.

---

## 12. Achievements (5 untuk MVP)

| Achievement | Kriteria |
|-------------|----------|
| Langkah Pertama | Jawab soal pertama |
| Hot Streak | 5 benar berturut-turut |
| Rajin Belajar | Belajar 7 hari berturut |
| Poin 100 | Total 100 poin |
| Nonton Perdana | Konversi poin pertama |

---

## 13. Edge Cases

| Kasus | Handling |
|-------|---------|
| Double klik convert | Idempotency key + DB unique constraint |
| Internet putus saat nonton | Buffer max 60s di client, sync saat reconnect |
| Tab duplikat | BroadcastChannel detect, tab kedua diblokir |
| STB restart | Session auto-close oleh cleanup job saat server start |
| Video URL tidak valid | Error graceful, watch time tidak dikurangi |
| Parent ubah setting saat anak nonton | Berlaku sesi berikutnya |

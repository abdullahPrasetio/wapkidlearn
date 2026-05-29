-- Migration: 006_create_watch
-- Creates watch_wallets, watch_sessions, and watch_histories tables

CREATE TABLE IF NOT EXISTS watch_wallets (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id          UUID NOT NULL UNIQUE REFERENCES child_profiles(id),
  balance_seconds   INT DEFAULT 0 CHECK (balance_seconds >= 0),
  used_today_seconds INT DEFAULT 0,
  last_reset_date   DATE DEFAULT CURRENT_DATE,
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_watch_wallets_updated_at
  BEFORE UPDATE ON watch_wallets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS watch_sessions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id          UUID NOT NULL REFERENCES child_profiles(id),
  video_id          UUID NOT NULL REFERENCES videos(id),
  allocated_seconds INT NOT NULL,
  consumed_seconds  INT DEFAULT 0,
  status            VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'terminated')),
  started_at        TIMESTAMPTZ DEFAULT NOW(),
  last_heartbeat_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at          TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS watch_histories (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id         UUID NOT NULL REFERENCES child_profiles(id),
  video_id         UUID NOT NULL REFERENCES videos(id),
  session_id       UUID REFERENCES watch_sessions(id),
  duration_seconds INT NOT NULL,
  watched_at       TIMESTAMPTZ DEFAULT NOW()
);

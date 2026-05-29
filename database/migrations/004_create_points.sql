-- Migration: 004_create_points
-- Creates point_wallets and point_transactions (append-only ledger)

CREATE TABLE IF NOT EXISTS point_wallets (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id        UUID NOT NULL UNIQUE REFERENCES child_profiles(id),
  balance         INT DEFAULT 0 CHECK (balance >= 0),
  lifetime_earned INT DEFAULT 0,
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_point_wallets_updated_at
  BEFORE UPDATE ON point_wallets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Append-only ledger, no UPDATE/DELETE allowed on rows
CREATE TABLE IF NOT EXISTS point_transactions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id        UUID NOT NULL REFERENCES point_wallets(id),
  type             VARCHAR(20) NOT NULL CHECK (type IN ('earn', 'spend')),
  amount           INT NOT NULL,
  idempotency_key  VARCHAR(100) UNIQUE,
  description      TEXT,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

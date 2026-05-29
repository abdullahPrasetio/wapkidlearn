-- Migration: 008_create_nonces
-- Creates question_nonces table for anti-replay protection

CREATE TABLE IF NOT EXISTS question_nonces (
  nonce       VARCHAR(64) PRIMARY KEY,
  child_id    UUID NOT NULL,
  question_id UUID NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  used        BOOLEAN DEFAULT false
);

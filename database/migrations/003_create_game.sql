-- Migration: 003_create_game
-- Creates math_questions, game_sessions, and game_answers tables

CREATE TABLE IF NOT EXISTS math_questions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  grade_level    INT NOT NULL,
  topic          VARCHAR(50) NOT NULL,
  difficulty     INT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
  question_text  TEXT NOT NULL,
  options        JSONB NOT NULL,
  correct_answer VARCHAR(100) NOT NULL,
  explanation    TEXT,
  is_active      BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS game_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id         UUID NOT NULL REFERENCES child_profiles(id),
  total_questions  INT DEFAULT 0,
  correct_count    INT DEFAULT 0,
  points_earned    INT DEFAULT 0,
  duration_seconds INT DEFAULT 0,
  started_at       TIMESTAMPTZ DEFAULT NOW(),
  ended_at         TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS game_answers (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id          UUID NOT NULL REFERENCES game_sessions(id),
  question_id         UUID NOT NULL REFERENCES math_questions(id),
  submitted_answer    VARCHAR(100),
  is_correct          BOOLEAN NOT NULL,
  points_earned       INT DEFAULT 0,
  time_taken_seconds  INT,
  nonce               VARCHAR(64) NOT NULL,
  answered_at         TIMESTAMPTZ DEFAULT NOW()
);

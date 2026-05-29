-- Migration: 007_create_streaks
-- Creates streaks and achievements tables

CREATE TABLE IF NOT EXISTS streaks (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id            UUID NOT NULL UNIQUE REFERENCES child_profiles(id),
  current_streak      INT DEFAULT 0,
  longest_streak      INT DEFAULT 0,
  last_activity_date  DATE
);

CREATE TABLE IF NOT EXISTS achievements (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code        VARCHAR(50) NOT NULL UNIQUE,
  name        VARCHAR(100) NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS child_achievements (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id       UUID NOT NULL REFERENCES child_profiles(id),
  achievement_id UUID NOT NULL REFERENCES achievements(id),
  earned_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (child_id, achievement_id)
);

-- Seed 5 MVP achievements
INSERT INTO achievements (code, name, description) VALUES
  ('first_step',     'Langkah Pertama',  'Jawab soal pertama'),
  ('hot_streak',     'Hot Streak',       '5 jawaban benar berturut-turut'),
  ('diligent',       'Rajin Belajar',    'Belajar 7 hari berturut-turut'),
  ('century_points', 'Poin 100',         'Kumpulkan total 100 poin'),
  ('first_watch',    'Nonton Perdana',   'Konversi poin pertama kali')
ON CONFLICT (code) DO NOTHING;

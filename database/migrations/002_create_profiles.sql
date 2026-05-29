-- Migration: 002_create_profiles
-- Creates parent_profiles and child_profiles tables

CREATE TABLE IF NOT EXISTS parent_profiles (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(100) NOT NULL,
  phone     VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS child_profiles (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id     UUID NOT NULL REFERENCES users(id),
  display_name  VARCHAR(50) NOT NULL,
  pin_hash      VARCHAR(255) NOT NULL,
  grade_level   INT NOT NULL CHECK (grade_level BETWEEN 1 AND 6),
  current_level INT DEFAULT 1,
  is_locked     BOOLEAN DEFAULT false,
  avatar        VARCHAR(50) DEFAULT 'default'
);

-- Parent settings per child
CREATE TABLE IF NOT EXISTS parent_settings (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id                 UUID NOT NULL UNIQUE REFERENCES child_profiles(id) ON DELETE CASCADE,
  daily_watch_limit_minutes INT DEFAULT 60,
  conversion_rate          INT DEFAULT 10,
  allowed_hours            JSONB DEFAULT '{}',
  require_study_first      BOOLEAN DEFAULT true,
  min_study_minutes        INT DEFAULT 10,
  emergency_lock           BOOLEAN DEFAULT false,
  updated_at               TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_parent_settings_updated_at
  BEFORE UPDATE ON parent_settings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Migration: 014_watch_position
-- Simpan posisi playback terakhir agar anak bisa lanjut nonton dari posisi yang sama

ALTER TABLE watch_sessions
  ADD COLUMN IF NOT EXISTS last_position_seconds INT NOT NULL DEFAULT 0;

ALTER TABLE watch_histories
  ADD COLUMN IF NOT EXISTS last_position_seconds INT NOT NULL DEFAULT 0;

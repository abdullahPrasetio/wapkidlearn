-- Migration: 009_add_indexes
-- Performance indexes for all high-traffic queries

CREATE INDEX IF NOT EXISTS idx_child_profiles_parent      ON child_profiles(parent_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_child        ON game_sessions(child_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_answers_session       ON game_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_math_questions_grade_topic ON math_questions(grade_level, topic, difficulty);
CREATE INDEX IF NOT EXISTS idx_point_transactions_wallet  ON point_transactions(wallet_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_watch_sessions_child_active ON watch_sessions(child_id) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_videos_child               ON videos(child_id, status);
CREATE INDEX IF NOT EXISTS idx_nonces_expires             ON question_nonces(expires_at);
CREATE INDEX IF NOT EXISTS idx_watch_histories_child      ON watch_histories(child_id, watched_at DESC);
CREATE INDEX IF NOT EXISTS idx_child_achievements_child   ON child_achievements(child_id);

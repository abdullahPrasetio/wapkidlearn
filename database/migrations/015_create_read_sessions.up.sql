CREATE TABLE IF NOT EXISTS read_sessions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    child_id         UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
    passage_id       TEXT NOT NULL,
    grade_level      SMALLINT NOT NULL,
    transcript       TEXT NOT NULL DEFAULT '',
    accuracy         FLOAT NOT NULL DEFAULT 0,
    points_earned    INT NOT NULL DEFAULT 0,
    duration_seconds INT NOT NULL DEFAULT 0,
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_read_sessions_child_id ON read_sessions(child_id);
CREATE INDEX idx_read_sessions_created_at ON read_sessions(created_at DESC);

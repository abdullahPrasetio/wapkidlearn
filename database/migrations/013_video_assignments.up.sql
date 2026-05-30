-- Migration: 013_video_assignments
-- Mengganti model 1-video-1-child menjadi M:M via pivot table

-- 1. Buat pivot table
CREATE TABLE child_video_assignments (
  child_id     UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  video_id     UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  assigned_by  UUID NOT NULL REFERENCES users(id),
  assigned_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (child_id, video_id)
);

CREATE INDEX idx_cva_child_id ON child_video_assignments(child_id);
CREATE INDEX idx_cva_video_id ON child_video_assignments(video_id);

-- 2. Migrate data lama: video child_specific yang punya child_id → pivot
INSERT INTO child_video_assignments (child_id, video_id, assigned_by)
SELECT v.child_id, v.id, v.submitted_by
FROM videos v
WHERE v.scope = 'child_specific' AND v.child_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- 3. Rename scope value: child_specific → private
ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_scope_check;
UPDATE videos SET scope = 'private' WHERE scope = 'child_specific';
ALTER TABLE videos ADD CONSTRAINT videos_scope_check
  CHECK (scope IN ('global', 'private'));

-- 4. Hapus kolom child_id dari videos
ALTER TABLE videos DROP COLUMN IF EXISTS child_id;

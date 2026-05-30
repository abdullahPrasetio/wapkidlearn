-- Rollback: 013_video_assignments

ALTER TABLE videos ADD COLUMN IF NOT EXISTS child_id UUID REFERENCES child_profiles(id);

ALTER TABLE videos DROP CONSTRAINT IF EXISTS videos_scope_check;
UPDATE videos SET scope = 'child_specific' WHERE scope = 'private';
ALTER TABLE videos ADD CONSTRAINT videos_scope_check
  CHECK (scope IN ('global', 'child_specific'));

-- Restore child_id dari pivot (best-effort: ambil assignment pertama)
UPDATE videos v
SET child_id = cva.child_id
FROM (
  SELECT DISTINCT ON (video_id) video_id, child_id
  FROM child_video_assignments
  ORDER BY video_id, assigned_at
) cva
WHERE v.id = cva.video_id;

DROP TABLE IF EXISTS child_video_assignments;

-- Migration: 016_cascade_delete_video
-- Add ON DELETE CASCADE to watch_sessions and watch_histories so videos can be deleted

ALTER TABLE watch_sessions
  DROP CONSTRAINT watch_sessions_video_id_fkey,
  ADD CONSTRAINT watch_sessions_video_id_fkey
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE;

ALTER TABLE watch_histories
  DROP CONSTRAINT watch_histories_video_id_fkey,
  ADD CONSTRAINT watch_histories_video_id_fkey
    FOREIGN KEY (video_id) REFERENCES videos(id) ON DELETE CASCADE;

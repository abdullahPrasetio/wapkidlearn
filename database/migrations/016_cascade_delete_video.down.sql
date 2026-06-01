-- Revert: 016_cascade_delete_video

ALTER TABLE watch_sessions
  DROP CONSTRAINT watch_sessions_video_id_fkey,
  ADD CONSTRAINT watch_sessions_video_id_fkey
    FOREIGN KEY (video_id) REFERENCES videos(id);

ALTER TABLE watch_histories
  DROP CONSTRAINT watch_histories_video_id_fkey,
  ADD CONSTRAINT watch_histories_video_id_fkey
    FOREIGN KEY (video_id) REFERENCES videos(id);

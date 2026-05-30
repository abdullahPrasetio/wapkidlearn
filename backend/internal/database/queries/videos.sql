-- name: GetVideosByChild :many
SELECT * FROM videos WHERE (child_id = $1 OR scope = 'global') AND status = 'active' ORDER BY created_at DESC;

-- name: GetVideoByID :one
SELECT * FROM videos WHERE id = $1;

-- name: CreateVideo :one
INSERT INTO videos (submitted_by, title, url, thumbnail_url, video_type, scope, child_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *;

-- name: ApproveVideo :one
UPDATE videos SET status = 'active' WHERE id = $1 RETURNING *;

-- name: RejectVideo :one
UPDATE videos SET status = 'rejected', rejection_reason = $2 WHERE id = $1 RETURNING *;

-- name: DeleteVideo :exec
DELETE FROM videos WHERE id = $1;

-- name: GetAllVideos :many
SELECT * FROM videos ORDER BY created_at DESC;

-- name: GetVideosBySubmitter :many
SELECT * FROM videos WHERE submitted_by = $1 ORDER BY created_at DESC;

-- name: GetVideosByChildAllStatuses :many
SELECT * FROM videos WHERE child_id = $1 OR (scope = 'global' AND status = 'active') ORDER BY created_at DESC;

-- name: GetGlobalActiveVideos :many
SELECT * FROM videos WHERE scope = 'global' AND status = 'active' ORDER BY created_at DESC;

-- name: UpdateVideo :one
UPDATE videos SET title = $2, url = $3, thumbnail_url = $4, video_type = $5, updated_at = NOW() WHERE id = $1 RETURNING *;

-- name: GetActiveWatchSession :one
SELECT * FROM watch_sessions WHERE child_id = $1 AND status = 'active' LIMIT 1;

-- name: CreateWatchSession :one
INSERT INTO watch_sessions (child_id, video_id, allocated_seconds) VALUES ($1, $2, $3) RETURNING *;

-- name: HeartbeatWatchSession :one
UPDATE watch_sessions SET consumed_seconds = consumed_seconds + $2, last_heartbeat_at = NOW() WHERE id = $1 AND status = 'active' RETURNING *;

-- name: TerminateWatchSession :one
UPDATE watch_sessions SET status = $2, ended_at = NOW() WHERE id = $1 RETURNING *;

-- name: CloseStaleWatchSessions :exec
UPDATE watch_sessions SET status = 'terminated', ended_at = NOW()
WHERE status = 'active' AND last_heartbeat_at < NOW() - INTERVAL '90 seconds';

-- name: CreateWatchHistory :exec
INSERT INTO watch_histories (child_id, video_id, session_id, duration_seconds) VALUES ($1, $2, $3, $4);

-- name: DeductWatchTime :one
UPDATE watch_wallets SET balance_seconds = balance_seconds - $2, used_today_seconds = used_today_seconds + $2 WHERE child_id = $1 AND balance_seconds >= $2 RETURNING *;

-- name: GetChildrenByParentID :many
SELECT cp.*, u.email, u.is_active FROM child_profiles cp JOIN users u ON u.id = cp.user_id WHERE cp.parent_id = $1;

-- name: CreateChildUser :one
INSERT INTO users (role) VALUES ('child') RETURNING *;

-- name: CreateChildProfile :one
INSERT INTO child_profiles (user_id, parent_id, display_name, pin_hash, grade_level, avatar) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *;

-- name: UpdateParentSettings :one
INSERT INTO parent_settings (child_id, daily_watch_limit_minutes, conversion_rate, allowed_hours, require_study_first, min_study_minutes)
VALUES ($1, $2, $3, $4, $5, $6)
ON CONFLICT (child_id) DO UPDATE
SET daily_watch_limit_minutes = $2, conversion_rate = $3, allowed_hours = $4, require_study_first = $5, min_study_minutes = $6
RETURNING *;

-- name: SetEmergencyLock :exec
UPDATE parent_settings SET emergency_lock = $2 WHERE child_id = $1;

-- name: SetChildLocked :exec
UPDATE child_profiles SET is_locked = $2 WHERE id = $1;

-- name: GetChildAnalytics :many
SELECT gs.started_at, gs.correct_count, gs.total_questions, gs.points_earned, gs.duration_seconds
FROM game_sessions gs WHERE gs.child_id = $1 AND gs.ended_at IS NOT NULL ORDER BY gs.started_at DESC LIMIT 30;

-- name: GetChildAccuracyPerTopic :many
SELECT mq.topic,
       COUNT(*) FILTER (WHERE ga.is_correct) AS correct,
       COUNT(*) AS total
FROM game_answers ga
JOIN game_sessions gs ON gs.id = ga.session_id
JOIN math_questions mq ON mq.id = ga.question_id
WHERE gs.child_id = $1
GROUP BY mq.topic
ORDER BY mq.topic;

-- name: GetWatchHistoriesByChild :many
SELECT wh.watched_at, wh.duration_seconds, v.title, v.video_type
FROM watch_histories wh
JOIN videos v ON v.id = wh.video_id
WHERE wh.child_id = $1
ORDER BY wh.watched_at DESC LIMIT 30;

-- name: GetStreakByChild :one
SELECT current_streak, longest_streak FROM streaks WHERE child_id = $1;

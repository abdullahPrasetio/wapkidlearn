-- name: CreateReadSession :one
INSERT INTO read_sessions (child_id, passage_id, grade_level, transcript, accuracy, points_earned, duration_seconds)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING *;

-- name: GetReadSessionsByChild :many
SELECT * FROM read_sessions WHERE child_id = $1 ORDER BY created_at DESC LIMIT 20;

-- name: GetReadSessionCount :one
SELECT COUNT(*) FROM read_sessions WHERE child_id = $1;

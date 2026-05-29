-- name: GetRandomQuestion :one
SELECT * FROM math_questions
WHERE grade_level = $1 AND is_active = true
ORDER BY RANDOM() LIMIT 1;

-- name: GetQuestionByID :one
SELECT * FROM math_questions WHERE id = $1;

-- name: CreateGameSession :one
INSERT INTO game_sessions (child_id) VALUES ($1) RETURNING *;

-- name: GetGameSession :one
SELECT * FROM game_sessions WHERE id = $1;

-- name: EndGameSession :one
UPDATE game_sessions SET ended_at = NOW(), total_questions = $2, correct_count = $3, points_earned = $4, duration_seconds = $5 WHERE id = $1 RETURNING *;

-- name: CreateGameAnswer :one
INSERT INTO game_answers (session_id, question_id, submitted_answer, is_correct, points_earned, time_taken_seconds, nonce) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;

-- name: GetSessionAnswers :many
SELECT * FROM game_answers WHERE session_id = $1;

-- name: CreateNonce :exec
INSERT INTO question_nonces (nonce, child_id, question_id, expires_at) VALUES ($1, $2, $3, $4);

-- name: GetNonce :one
SELECT * FROM question_nonces WHERE nonce = $1;

-- name: MarkNonceUsed :exec
UPDATE question_nonces SET used = true WHERE nonce = $1;

-- name: DeleteExpiredNonces :exec
DELETE FROM question_nonces WHERE expires_at < NOW();

-- name: GetStreak :one
SELECT * FROM streaks WHERE child_id = $1;

-- name: UpsertStreak :one
INSERT INTO streaks (child_id, current_streak, longest_streak, last_activity_date)
VALUES ($1, $2, $3, $4)
ON CONFLICT (child_id) DO UPDATE
SET current_streak = $2, longest_streak = $3, last_activity_date = $4
RETURNING *;

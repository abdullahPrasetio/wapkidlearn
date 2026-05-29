-- name: ListAllUsers :many
SELECT * FROM users ORDER BY created_at DESC;

-- name: ToggleUserActive :one
UPDATE users SET is_active = NOT is_active WHERE id = $1 RETURNING *;

-- name: ListAllQuestions :many
SELECT * FROM math_questions ORDER BY grade_level, difficulty;

-- name: CreateQuestion :one
INSERT INTO math_questions (grade_level, topic, difficulty, question_text, options, correct_answer, explanation)
VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *;

-- name: UpdateQuestion :one
UPDATE math_questions SET grade_level=$2, topic=$3, difficulty=$4, question_text=$5, options=$6, correct_answer=$7, explanation=$8 WHERE id=$1 RETURNING *;

-- name: DeleteQuestion :exec
UPDATE math_questions SET is_active = false WHERE id = $1;

-- name: ListPendingVideos :many
SELECT * FROM videos WHERE status = 'pending' ORDER BY created_at;

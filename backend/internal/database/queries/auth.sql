-- name: GetUserByEmail :one
SELECT * FROM users WHERE email = $1;

-- name: GetUserByID :one
SELECT * FROM users WHERE id = $1;

-- name: CreateUser :one
INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3) RETURNING *;

-- name: UpdateUserActive :exec
UPDATE users SET is_active = $2 WHERE id = $1;

-- name: GetChildByUserID :one
SELECT * FROM child_profiles WHERE user_id = $1;

-- name: GetChildByID :one
SELECT * FROM child_profiles WHERE id = $1;

-- name: GetParentSettings :one
SELECT * FROM parent_settings WHERE child_id = $1;

-- name: GetChildGradeLevel :one
SELECT grade_level FROM child_profiles WHERE id = $1;

-- name: GetChildByUsername :one
SELECT * FROM child_profiles WHERE username = $1;

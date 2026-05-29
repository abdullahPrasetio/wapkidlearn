-- name: GetWalletByChildID :one
SELECT * FROM point_wallets WHERE child_id = $1;

-- name: LockWalletForUpdate :one
SELECT * FROM point_wallets WHERE child_id = $1 FOR UPDATE;

-- name: CreateWallet :one
INSERT INTO point_wallets (child_id) VALUES ($1) RETURNING *;

-- name: CreditPoints :one
UPDATE point_wallets SET balance = balance + $2, lifetime_earned = lifetime_earned + $2 WHERE id = $1 RETURNING *;

-- name: DeductPoints :one
UPDATE point_wallets SET balance = balance - $2 WHERE id = $1 AND balance >= $2 RETURNING *;

-- name: CreatePointTransaction :one
INSERT INTO point_transactions (wallet_id, type, amount, idempotency_key, description) VALUES ($1, $2, $3, $4, $5) RETURNING *;

-- name: GetTransactionByIdempotencyKey :one
SELECT * FROM point_transactions WHERE idempotency_key = $1;

-- name: GetWalletTransactions :many
SELECT * FROM point_transactions WHERE wallet_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3;

-- name: GetWatchWalletByChildID :one
SELECT * FROM watch_wallets WHERE child_id = $1;

-- name: LockWatchWalletForUpdate :one
SELECT * FROM watch_wallets WHERE child_id = $1 FOR UPDATE;

-- name: CreateWatchWallet :one
INSERT INTO watch_wallets (child_id) VALUES ($1) RETURNING *;

-- name: AddWatchTime :one
UPDATE watch_wallets SET balance_seconds = balance_seconds + $2 WHERE child_id = $1 RETURNING *;

-- name: ResetDailyWatch :exec
UPDATE watch_wallets SET used_today_seconds = 0, last_reset_date = CURRENT_DATE WHERE child_id = $1;

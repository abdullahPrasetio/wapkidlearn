package points

import (
	"context"
	db "wapkidlearn/internal/database/queries"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Repository struct {
	q    *db.Queries
	pool *pgxpool.Pool
}

func NewRepository(pool *pgxpool.Pool) *Repository {
	return &Repository{q: db.New(pool), pool: pool}
}

func (r *Repository) GetWalletByChildID(ctx context.Context, childID pgtype.UUID) (db.PointWallet, error) {
	return r.q.GetWalletByChildID(ctx, childID)
}

func (r *Repository) CreateWallet(ctx context.Context, childID pgtype.UUID) (db.PointWallet, error) {
	return r.q.CreateWallet(ctx, childID)
}

func (r *Repository) GetTransactionByIdempotencyKey(ctx context.Context, key string) (db.PointTransaction, error) {
	return r.q.GetTransactionByIdempotencyKey(ctx, &key)
}

func (r *Repository) GetWalletTransactions(ctx context.Context, params db.GetWalletTransactionsParams) ([]db.PointTransaction, error) {
	return r.q.GetWalletTransactions(ctx, params)
}

func (r *Repository) GetWatchWalletByChildID(ctx context.Context, childID pgtype.UUID) (db.WatchWallet, error) {
	return r.q.GetWatchWalletByChildID(ctx, childID)
}

func (r *Repository) CreateWatchWallet(ctx context.Context, childID pgtype.UUID) (db.WatchWallet, error) {
	return r.q.CreateWatchWallet(ctx, childID)
}

func (r *Repository) AddWatchTime(ctx context.Context, childID pgtype.UUID, seconds int32) (db.WatchWallet, error) {
	return r.q.AddWatchTime(ctx, db.AddWatchTimeParams{ChildID: childID, BalanceSeconds: &seconds})
}

func (r *Repository) ResetDailyWatch(ctx context.Context, childID pgtype.UUID) error {
	return r.q.ResetDailyWatch(ctx, childID)
}

func (r *Repository) GetIsLocked(ctx context.Context, childID pgtype.UUID) (bool, error) {
	child, err := r.q.GetChildByID(ctx, childID)
	if err != nil {
		return false, err
	}
	if child.IsLocked != nil {
		return *child.IsLocked, nil
	}
	return false, nil
}

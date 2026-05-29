package points

import (
	"context"
	"errors"
	db "wapkidlearn/internal/database/queries"
	"wapkidlearn/pkg/pgutil"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Service struct {
	repo *Repository
	pool *pgxpool.Pool
}

func NewService(repo *Repository, pool *pgxpool.Pool) *Service {
	return &Service{repo: repo, pool: pool}
}

type WalletResponse struct {
	WalletID       string `json:"wallet_id"`
	ChildID        string `json:"child_id"`
	Balance        int32  `json:"balance"`
	LifetimeEarned int32  `json:"lifetime_earned"`
}

type WatchWalletResponse struct {
	BalanceSeconds  int32  `json:"balance_seconds"`
	UsedTodaySeconds int32 `json:"used_today_seconds"`
}

type CombinedWalletResponse struct {
	Point    *WalletResponse      `json:"point"`
	Watch    *WatchWalletResponse `json:"watch"`
	IsLocked bool                 `json:"is_locked"`
}

type ConversionResult struct {
	PointsDeducted int32 `json:"points_deducted"`
	SecondsAdded   int32 `json:"seconds_added"`
	NewBalance     int32 `json:"new_balance"`
	WatchBalance   int32 `json:"watch_balance_seconds"`
}

func (s *Service) GetWallet(ctx context.Context, childID string) (*CombinedWalletResponse, error) {
	cid, err := pgutil.ParseUUID(childID)
	if err != nil {
		return nil, errors.New("invalid child_id")
	}
	w, err := s.repo.GetWalletByChildID(ctx, cid)
	if err != nil {
		return nil, errors.New("wallet not found")
	}
	bal := int32(0)
	if w.Balance != nil {
		bal = *w.Balance
	}
	lt := int32(0)
	if w.LifetimeEarned != nil {
		lt = *w.LifetimeEarned
	}

	ww, err := s.repo.GetWatchWalletByChildID(ctx, cid)
	watchBal := int32(0)
	watchUsed := int32(0)
	if err == nil {
		if ww.BalanceSeconds != nil {
			watchBal = *ww.BalanceSeconds
		}
		if ww.UsedTodaySeconds != nil {
			watchUsed = *ww.UsedTodaySeconds
		}
	}

	isLocked, err := s.repo.GetIsLocked(ctx, cid)
	if err != nil {
		isLocked = true // safe-fail: bila gagal cek, anggap locked
	}

	return &CombinedWalletResponse{
		Point: &WalletResponse{
			WalletID:       pgutil.UUIDToString(w.ID),
			ChildID:        pgutil.UUIDToString(w.ChildID),
			Balance:        bal,
			LifetimeEarned: lt,
		},
		Watch: &WatchWalletResponse{
			BalanceSeconds:   watchBal,
			UsedTodaySeconds: watchUsed,
		},
		IsLocked: isLocked,
	}, nil
}

// CreditPoints credits earned points to a child's wallet using SELECT FOR UPDATE.
func (s *Service) CreditPoints(ctx context.Context, childID string, amount int32, idempotencyKey string) error {
	cid, err := pgutil.ParseUUID(childID)
	if err != nil {
		return errors.New("invalid child_id")
	}

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	// Lock wallet row
	var walletID pgtype.UUID
	var currentBalance int32
	err = tx.QueryRow(ctx,
		`SELECT id, balance FROM point_wallets WHERE child_id = $1 FOR UPDATE`, cid,
	).Scan(&walletID, &currentBalance)
	if err != nil {
		return errors.New("wallet not found")
	}

	// Credit
	var newBalance int32
	err = tx.QueryRow(ctx,
		`UPDATE point_wallets SET balance = balance + $2, lifetime_earned = lifetime_earned + $2 WHERE id = $1 RETURNING balance`,
		walletID, amount,
	).Scan(&newBalance)
	if err != nil {
		return err
	}

	// Record transaction
	_, err = tx.Exec(ctx,
		`INSERT INTO point_transactions (wallet_id, type, amount, idempotency_key, description) VALUES ($1, $2, $3, $4, $5)`,
		walletID, "earn", amount, idempotencyKey, "game session reward",
	)
	if err != nil {
		return err
	}

	return tx.Commit(ctx)
}

// ConvertPoints deducts points and adds watch time atomically.
func (s *Service) ConvertPoints(ctx context.Context, childID string, points int32, idempotencyKey string) (*ConversionResult, error) {
	cid, err := pgutil.ParseUUID(childID)
	if err != nil {
		return nil, errors.New("invalid child_id")
	}

	// Idempotency check
	existing, err := s.repo.GetTransactionByIdempotencyKey(ctx, idempotencyKey)
	if err == nil && existing.ID.Valid {
		return &ConversionResult{PointsDeducted: existing.Amount}, nil
	}

	// Fetch conversion rate
	conversionRate, err := s.getConversionRate(ctx, cid)
	if err != nil || conversionRate == 0 {
		conversionRate = 10
	}
	watchSeconds := (points / conversionRate) * 60

	tx, err := s.pool.Begin(ctx)
	if err != nil {
		return nil, err
	}
	defer tx.Rollback(ctx) //nolint:errcheck

	// Lock and deduct point wallet
	var walletID pgtype.UUID
	var newBalance int32
	err = tx.QueryRow(ctx,
		`UPDATE point_wallets SET balance = balance - $2 WHERE child_id = $1 AND balance >= $2 RETURNING id, balance`,
		cid, points,
	).Scan(&walletID, &newBalance)
	if err != nil {
		return nil, errors.New("insufficient points")
	}

	// Record spend transaction
	_, err = tx.Exec(ctx,
		`INSERT INTO point_transactions (wallet_id, type, amount, idempotency_key, description) VALUES ($1, $2, $3, $4, $5)`,
		walletID, "spend", points, idempotencyKey, "converted to watch time",
	)
	if err != nil {
		return nil, err
	}

	// Add watch time
	var watchBalance int32
	err = tx.QueryRow(ctx,
		`UPDATE watch_wallets SET balance_seconds = balance_seconds + $2 WHERE child_id = $1 RETURNING balance_seconds`,
		cid, watchSeconds,
	).Scan(&watchBalance)
	if err != nil {
		return nil, errors.New("watch wallet not found")
	}

	if err := tx.Commit(ctx); err != nil {
		return nil, err
	}

	return &ConversionResult{
		PointsDeducted: points,
		SecondsAdded:   watchSeconds,
		NewBalance:     newBalance,
		WatchBalance:   watchBalance,
	}, nil
}

func (s *Service) GetTransactions(ctx context.Context, childID string, page, limit int) ([]db.PointTransaction, error) {
	cid, err := pgutil.ParseUUID(childID)
	if err != nil {
		return nil, errors.New("invalid child_id")
	}
	wallet, err := s.repo.GetWalletByChildID(ctx, cid)
	if err != nil {
		return nil, errors.New("wallet not found")
	}
	offset := int32((page - 1) * limit)
	return s.repo.GetWalletTransactions(ctx, db.GetWalletTransactionsParams{
		WalletID: wallet.ID,
		Limit:    int32(limit),
		Offset:   offset,
	})
}

func (s *Service) getConversionRate(ctx context.Context, childID pgtype.UUID) (int32, error) {
	var rate int32
	err := s.pool.QueryRow(ctx,
		`SELECT conversion_rate FROM parent_settings WHERE child_id = $1`, childID,
	).Scan(&rate)
	return rate, err
}

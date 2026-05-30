package game

import (
	"context"
	"time"
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

func (r *Repository) GetRandomQuestion(ctx context.Context, gradeLevel int32) (db.MathQuestion, error) {
	return r.q.GetRandomQuestion(ctx, gradeLevel)
}

func (r *Repository) GetQuestionByID(ctx context.Context, id pgtype.UUID) (db.MathQuestion, error) {
	return r.q.GetQuestionByID(ctx, id)
}

func (r *Repository) CreateSession(ctx context.Context, childID pgtype.UUID) (db.GameSession, error) {
	return r.q.CreateGameSession(ctx, childID)
}

func (r *Repository) GetSession(ctx context.Context, id pgtype.UUID) (db.GameSession, error) {
	return r.q.GetGameSession(ctx, id)
}

func (r *Repository) EndSession(ctx context.Context, params db.EndGameSessionParams) (db.GameSession, error) {
	return r.q.EndGameSession(ctx, params)
}

func (r *Repository) CreateAnswer(ctx context.Context, params db.CreateGameAnswerParams) (db.GameAnswer, error) {
	return r.q.CreateGameAnswer(ctx, params)
}

func (r *Repository) GetSessionAnswers(ctx context.Context, sessionID pgtype.UUID) ([]db.GameAnswer, error) {
	return r.q.GetSessionAnswers(ctx, sessionID)
}

func (r *Repository) CreateNonce(ctx context.Context, params db.CreateNonceParams) error {
	return r.q.CreateNonce(ctx, params)
}

func (r *Repository) GetNonce(ctx context.Context, nonce string) (db.QuestionNonce, error) {
	return r.q.GetNonce(ctx, nonce)
}

func (r *Repository) MarkNonceUsed(ctx context.Context, nonce string) error {
	return r.q.MarkNonceUsed(ctx, nonce)
}

func (r *Repository) DeleteExpiredNonces(ctx context.Context) error {
	return r.q.DeleteExpiredNonces(ctx)
}

func (r *Repository) GetStreak(ctx context.Context, childID pgtype.UUID) (db.Streak, error) {
	return r.q.GetStreak(ctx, childID)
}

func (r *Repository) UpsertStreak(ctx context.Context, params db.UpsertStreakParams) (db.Streak, error) {
	return r.q.UpsertStreak(ctx, params)
}

func (r *Repository) GetLifetimePoints(ctx context.Context, childID pgtype.UUID) (int32, error) {
	return r.q.GetLifetimePoints(ctx, childID)
}

func (r *Repository) GetChildGradeLevel(ctx context.Context, childID pgtype.UUID) (int32, error) {
	return r.q.GetChildGradeLevel(ctx, childID)
}

// NonceExpiry is how long a question nonce is valid.
const NonceExpiry = 60 * time.Second

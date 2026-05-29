package achievement

import (
	"context"
	"log"
	db "wapkidlearn/internal/database/queries"
	"wapkidlearn/pkg/pgutil"

	"github.com/jackc/pgx/v5/pgtype"
	"github.com/jackc/pgx/v5/pgxpool"
)

type Service struct {
	q *db.Queries
}

func NewService(pool *pgxpool.Pool) *Service {
	return &Service{q: db.New(pool)}
}

type AchievementStatus struct {
	ID          string  `json:"id"`
	Code        string  `json:"code"`
	Title       string  `json:"title"`
	Description string  `json:"description"`
	Unlocked    bool    `json:"unlocked"`
	UnlockedAt  *string `json:"unlocked_at,omitempty"`
}

func (s *Service) GetAll(ctx context.Context, childID string) ([]AchievementStatus, error) {
	cid, err := pgutil.ParseUUID(childID)
	if err != nil {
		return nil, err
	}
	rows, err := s.q.GetAllAchievementsWithStatus(ctx, cid)
	if err != nil {
		return nil, err
	}
	result := make([]AchievementStatus, 0, len(rows))
	for _, r := range rows {
		a := AchievementStatus{
			ID:       pgutil.UUIDToString(r.ID),
			Code:     r.Code,
			Title:    r.Name,
			Unlocked: r.EarnedAt.Valid,
		}
		if r.Description != nil {
			a.Description = *r.Description
		}
		if r.EarnedAt.Valid {
			t := r.EarnedAt.Time.Format("2006-01-02T15:04:05Z07:00")
			a.UnlockedAt = &t
		}
		result = append(result, a)
	}
	return result, nil
}

type CheckParams struct {
	ChildID        pgtype.UUID
	CurrentStreak  int32
	LongestStreak  int32
	LifetimePoints int32
}

func (s *Service) CheckAndAward(ctx context.Context, params CheckParams) {
	s.award(ctx, params.ChildID, "first_step", params.LifetimePoints > 0)
	s.award(ctx, params.ChildID, "hot_streak", params.CurrentStreak >= 5)
	s.award(ctx, params.ChildID, "diligent", params.LongestStreak >= 7)
	s.award(ctx, params.ChildID, "century_points", params.LifetimePoints >= 100)
}

func (s *Service) AwardFirstWatch(ctx context.Context, childID pgtype.UUID) {
	// Skip DB write if already earned — avoids 2 redundant queries on every conversion.
	already, err := s.q.HasChildAchievement(ctx, db.HasChildAchievementParams{
		ChildID: childID,
		Code:    "first_watch",
	})
	if err != nil || already {
		return
	}
	s.award(ctx, childID, "first_watch", true)
}

func (s *Service) award(ctx context.Context, childID pgtype.UUID, code string, condition bool) {
	if !condition {
		return
	}
	achID, err := s.q.GetAchievementByCode(ctx, code)
	if err != nil {
		log.Printf("[achievement] GetAchievementByCode %s: %v", code, err)
		return
	}
	if err := s.q.AwardAchievement(ctx, db.AwardAchievementParams{
		ChildID:       childID,
		AchievementID: achID,
	}); err != nil {
		log.Printf("[achievement] AwardAchievement %s: %v", code, err)
	}
}
